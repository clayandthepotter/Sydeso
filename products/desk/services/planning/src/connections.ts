import { causedEventId, createEvent, type AnyEvent, type Clock } from "@desk/domain";
import { LINEAR_ENDPOINT, LinearIssueTracker, type LinearConnection } from "./linear.js";

/** Seals and opens secrets for one tenant. SecretBox in @desk/cloudflare implements it. */
export interface SecretSealer {
  seal(plaintext: string, tenantId: string): Promise<string>;
  open(sealed: string, tenantId: string): Promise<string>;
}

export interface StoredLinearConnection extends LinearConnection {
  readonly teamName: string;
}

interface ConnectionRow {
  token_type: "api_key" | "oauth";
  token_sealed: string;
  team_id: string;
  team_name: string;
}

/** ItemRouted events that waited for a Linear setup. Planning owns the table. */
export class D1PlannerPending {
  constructor(
    private readonly db: D1Database,
    private readonly clock: Clock,
  ) {}

  async add(event: AnyEvent, reason: string): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO planner_pending (tenant_id, event_id, event, reason, parked_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (tenant_id, event_id) DO UPDATE SET reason = excluded.reason`,
      )
      .bind(event.tenantId, event.id, JSON.stringify(event), reason, this.clock.now().toISOString())
      .run();
  }

  async list(tenantId: string): Promise<AnyEvent[]> {
    const rows = await this.db
      .prepare("SELECT event FROM planner_pending WHERE tenant_id = ? ORDER BY parked_at")
      .bind(tenantId)
      .all<{ event: string }>();
    return rows.results.map((row) => JSON.parse(row.event) as AnyEvent);
  }

  async remove(tenantId: string, eventId: string): Promise<void> {
    await this.db.prepare("DELETE FROM planner_pending WHERE tenant_id = ? AND event_id = ?").bind(tenantId, eventId).run();
  }

  async count(tenantId: string): Promise<number> {
    const row = await this.db
      .prepare("SELECT COUNT(*) AS n FROM planner_pending WHERE tenant_id = ?")
      .bind(tenantId)
      .first<{ n: number }>();
    return row?.n ?? 0;
  }
}

/** The linear_connections table. Planning owns it. */
export class D1LinearConnections {
  constructor(
    private readonly db: D1Database,
    private readonly box: SecretSealer,
    private readonly clock: Clock,
  ) {}

  async get(tenantId: string): Promise<StoredLinearConnection | null> {
    const row = await this.db
      .prepare("SELECT token_type, token_sealed, team_id, team_name FROM linear_connections WHERE tenant_id = ?")
      .bind(tenantId)
      .first<ConnectionRow>();
    if (!row) return null;
    return {
      token: await this.box.open(row.token_sealed, tenantId),
      tokenType: row.token_type,
      teamId: row.team_id,
      teamName: row.team_name,
    };
  }

  async save(tenantId: string, connection: StoredLinearConnection): Promise<void> {
    const at = this.clock.now().toISOString();
    await this.db
      .prepare(
        `INSERT INTO linear_connections (tenant_id, token_type, token_sealed, team_id, team_name, connected_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (tenant_id) DO UPDATE SET token_type = excluded.token_type, token_sealed = excluded.token_sealed,
           team_id = excluded.team_id, team_name = excluded.team_name, updated_at = excluded.updated_at`,
      )
      .bind(tenantId, connection.tokenType, await this.box.seal(connection.token, tenantId), connection.teamId, connection.teamName, at, at)
      .run();
  }

  async remove(tenantId: string): Promise<void> {
    await this.db.prepare("DELETE FROM linear_connections WHERE tenant_id = ?").bind(tenantId).run();
  }
}

export interface LinearTeam {
  readonly id: string;
  readonly name: string;
}

export type ConnectResult =
  | { readonly kind: "choose_team"; readonly teams: readonly LinearTeam[] }
  | {
      readonly kind: "connected";
      readonly teamName: string;
      readonly projects: readonly string[];
      /** Today, Next, or Later states that the team does not have yet. */
      readonly missingStates: readonly string[];
    };

export class LinearConnectError extends Error {
  override readonly name = "LinearConnectError";

  constructor(readonly code: "invalid_key" | "unknown_team" | "no_teams") {
    super(code);
  }
}

export interface LinearIntegrationDeps {
  readonly connections: D1LinearConnections;
  readonly pending: D1PlannerPending;
  /** Sends parked ItemRouted events to the planner queue again. */
  readonly replay: (events: readonly AnyEvent[]) => Promise<unknown>;
  readonly publish: (events: readonly AnyEvent[]) => Promise<unknown>;
  readonly clock: Clock;
  readonly fetch?: typeof globalThis.fetch;
  readonly endpoint?: string;
}

const TEAMS = `query Teams { teams(first: 50) { nodes { id name } } }`;

/** Connect, check, and disconnect a tenant's Linear team. */
export function createLinearIntegration(deps: LinearIntegrationDeps) {
  const fetcher = deps.fetch ?? globalThis.fetch.bind(globalThis);
  const endpoint = deps.endpoint ?? LINEAR_ENDPOINT;

  const listTeams = async (token: string): Promise<LinearTeam[]> => {
    const response = await fetcher(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({ query: TEAMS, variables: {} }),
    });
    const body = (await response.json().catch(() => ({}))) as {
      data?: { teams: { nodes: LinearTeam[] } };
      errors?: unknown[];
    };
    if (!response.ok || body.errors?.length || !body.data) throw new LinearConnectError("invalid_key");
    return body.data.teams.nodes;
  };

  const sync = async (tenantId: string, connection: StoredLinearConnection) => {
    const tracker = new LinearIssueTracker(connection, fetcher, endpoint);
    const projects = await tracker.listProjects();
    const missingStates = await tracker.missingStates();
    const at = deps.clock.now();
    const event = createEvent(
      "ProjectsSynced",
      { teamId: connection.teamId, teamName: connection.teamName, projects: [...projects] },
      {
        clock: deps.clock,
        ids: { next: () => causedEventId(`linear/${tenantId}`, "ProjectsSynced", at.toISOString()) },
        tenantId,
      },
    );
    await deps.publish([event]);
    if (missingStates.length === 0) {
      const parked = await deps.pending.list(tenantId);
      if (parked.length > 0) await deps.replay(parked);
    }
    return { kind: "connected" as const, teamName: connection.teamName, projects, missingStates };
  };

  return {
    async status(tenantId: string) {
      const connection = await deps.connections.get(tenantId);
      return connection ? { connected: true as const, teamName: connection.teamName } : { connected: false as const };
    },

    /** Checks a personal API key. With one team, or a chosen team, it saves the connection and syncs projects. */
    async connect(tenantId: string, input: { apiKey: string; teamId?: string }): Promise<ConnectResult> {
      const token = input.apiKey.trim();
      if (token.length < 10) throw new LinearConnectError("invalid_key");
      const teams = await listTeams(token);
      if (teams.length === 0) throw new LinearConnectError("no_teams");
      const team = input.teamId ? teams.find((candidate) => candidate.id === input.teamId) : teams.length === 1 ? teams[0] : undefined;
      if (!team) {
        if (input.teamId) throw new LinearConnectError("unknown_team");
        return { kind: "choose_team", teams };
      }
      const connection: StoredLinearConnection = { token, tokenType: "api_key", teamId: team.id, teamName: team.name };
      await deps.connections.save(tenantId, connection);
      return sync(tenantId, connection);
    },

    /** Reads the projects again, for example after the person adds a project in Linear. */
    async refresh(tenantId: string): Promise<ConnectResult | null> {
      const connection = await deps.connections.get(tenantId);
      return connection ? sync(tenantId, connection) : null;
    },

    async disconnect(tenantId: string): Promise<void> {
      await deps.connections.remove(tenantId);
    },
  };
}

export type LinearIntegration = ReturnType<typeof createLinearIntegration>;

