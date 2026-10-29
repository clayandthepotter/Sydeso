import type { IssueChanges, IssueDraft, IssueQuery, IssueRef, IssueTrackerPort, LinearState, Priority } from "@desk/domain";
import { LINEAR_STATES } from "@desk/domain";

export const LINEAR_ENDPOINT = "https://api.linear.app/graphql";

export interface LinearConnection {
  readonly token: string;
  /** A personal API key goes in the header as is. An OAuth token needs "Bearer". */
  readonly tokenType: "api_key" | "oauth";
  readonly teamId: string;
}

/** The Linear team is not set up for Desk, for example a state is missing. */
export class LinearSetupError extends Error {
  override readonly name = "LinearSetupError";
}

export class LinearApiError extends Error {
  override readonly name = "LinearApiError";
}

/** Linear priority: 1 is Urgent, 2 is High, 3 is Medium. */
const PRIORITY: Record<Priority, number> = { P1: 1, P2: 2, P3: 3 };

/**
 * A stable UUID v4 for an idempotency key. Linear accepts a client ID on create,
 * so a retry with the same key cannot make a second issue.
 */
export async function issueUuidFor(key: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key))).slice(0, 16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

interface TeamSetup {
  readonly projects: ReadonlyMap<string, { id: string; name: string }>;
  readonly states: Partial<Record<LinearState, string>>;
}

interface Named {
  id: string;
  name: string;
}

const TEAM_SETUP = `query TeamSetup($teamId: String!) {
  team(id: $teamId) {
    projects(first: 250) { nodes { id name } }
    states(first: 100) { nodes { id name } }
  }
}`;

const CREATE_ISSUE = `mutation CreateIssue($input: IssueCreateInput!) {
  issueCreate(input: $input) { success issue { id identifier } }
}`;

const FIND_ISSUE = `query FindIssue($id: String!) {
  issue(id: $id) { id identifier }
}`;

const UPDATE_ISSUE = `mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
  issueUpdate(id: $id, input: $input) { success }
}`;

const COUNT_ISSUES = `query CountIssues($filter: IssueFilter) {
  issues(first: 250, filter: $filter) { nodes { id } }
}`;

/** IssueTrackerPort for one tenant's Linear team. */
export class LinearIssueTracker implements IssueTrackerPort {
  private setup: Promise<TeamSetup> | null = null;

  constructor(
    private readonly connection: LinearConnection,
    private readonly fetcher: typeof globalThis.fetch = globalThis.fetch.bind(globalThis),
    private readonly endpoint = LINEAR_ENDPOINT,
  ) {}

  private async call<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const response = await this.fetcher(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.connection.tokenType === "oauth" ? `Bearer ${this.connection.token}` : this.connection.token,
      },
      body: JSON.stringify({ query, variables }),
    });
    const body = (await response.json().catch(() => ({}))) as { data?: T; errors?: Array<{ message: string }> };
    if (body.errors?.length) throw new LinearApiError(body.errors.map((error) => error.message).join("; "));
    if (!response.ok || !body.data) throw new LinearApiError(`Linear returned status ${response.status}`);
    return body.data;
  }

  private teamSetup(): Promise<TeamSetup> {
    this.setup ??= this.call<{ team: { projects: { nodes: Named[] }; states: { nodes: Named[] } } }>(TEAM_SETUP, {
      teamId: this.connection.teamId,
    })
      .then(({ team }) => {
        const states: Partial<Record<LinearState, string>> = {};
        for (const state of team.states.nodes) {
          const match = LINEAR_STATES.find((name) => name.toLowerCase() === state.name.trim().toLowerCase());
          if (match && !states[match]) states[match] = state.id;
        }
        return {
          projects: new Map(team.projects.nodes.map((project) => [project.name.toLowerCase(), project])),
          states,
        };
      })
      .catch((error: unknown) => {
        this.setup = null;
        throw error;
      });
    return this.setup;
  }

  private async stateId(state: LinearState): Promise<string> {
    const id = (await this.teamSetup()).states[state];
    if (!id) throw new LinearSetupError(`The Linear team needs a workflow state named "${state}".`);
    return id;
  }

  /** The Desk states that the team does not have. Desk needs Today, Next, and Later. */
  async missingStates(): Promise<LinearState[]> {
    const { states } = await this.teamSetup();
    return LINEAR_STATES.filter((state) => !states[state]);
  }

  async listProjects(): Promise<readonly string[]> {
    return [...(await this.teamSetup()).projects.values()].map((project) => project.name);
  }

  async createIssue(draft: IssueDraft): Promise<IssueRef> {
    const setup = await this.teamSetup();
    const project = setup.projects.get(draft.project.toLowerCase());
    if (!project) throw new LinearSetupError(`The Linear team has no project named "${draft.project}".`);
    const id = await issueUuidFor(draft.idempotencyKey);
    const input = {
      id,
      teamId: this.connection.teamId,
      title: draft.title,
      projectId: project.id,
      stateId: await this.stateId(draft.state),
      priority: PRIORITY[draft.priority],
      ...(draft.dueDate !== null && { dueDate: draft.dueDate }),
    };
    try {
      const { issueCreate } = await this.call<{ issueCreate: { issue: { id: string; identifier: string } } }>(CREATE_ISSUE, {
        input,
      });
      return { issueId: issueCreate.issue.id, issueKey: issueCreate.issue.identifier };
    } catch (createError) {
      // A retry after a lost response finds the issue that the first try made.
      const existing = await this.call<{ issue: { id: string; identifier: string } }>(FIND_ISSUE, { id }).catch(() => null);
      if (existing?.issue) return { issueId: existing.issue.id, issueKey: existing.issue.identifier };
      throw createError;
    }
  }

  async updateIssue(issueId: string, changes: IssueChanges): Promise<void> {
    await this.call(UPDATE_ISSUE, {
      id: issueId,
      input: {
        ...(changes.title !== undefined && { title: changes.title }),
        ...(changes.priority !== undefined && { priority: PRIORITY[changes.priority] }),
        ...(changes.state !== undefined && { stateId: await this.stateId(changes.state) }),
      },
    });
  }

  async countIssues(query: IssueQuery): Promise<number> {
    const filter = {
      team: { id: { eq: this.connection.teamId } },
      ...(query.state !== undefined && { state: { id: { eq: await this.stateId(query.state) } } }),
      ...(query.priority !== undefined && { priority: { eq: PRIORITY[query.priority] } }),
    };
    const { issues } = await this.call<{ issues: { nodes: unknown[] } }>(COUNT_ISSUES, { filter });
    return issues.nodes.length;
  }
}
