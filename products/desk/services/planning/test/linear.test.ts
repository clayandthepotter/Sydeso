import { describe, expect, it } from "vitest";
import { LinearIssueTracker, LinearSetupError, issueUuidFor } from "../src/linear.js";

interface Call {
  query: string;
  variables: Record<string, unknown>;
  authorization: string | null;
}

/** A fake Linear GraphQL API. Each handler answers one operation by name. */
const fakeLinear = (handlers: Record<string, (variables: Record<string, unknown>) => unknown>) => {
  const calls: Call[] = [];
  const fetch = async (_input: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { query: string; variables: Record<string, unknown> };
    calls.push({ ...body, authorization: new Headers(init?.headers).get("Authorization") });
    const name = /(?:query|mutation)\s+(\w+)/.exec(body.query)?.[1] ?? "";
    const handler = handlers[name];
    if (!handler) return new Response(JSON.stringify({ errors: [{ message: `No handler for ${name}` }] }), { status: 200 });
    return new Response(JSON.stringify(handler(body.variables)), { status: 200 });
  };
  return { calls, fetch: fetch as typeof globalThis.fetch };
};

const team = {
  data: {
    team: {
      projects: { nodes: [{ id: "p-client", name: "Client Work" }, { id: "p-sydeso", name: "Sydeso" }] },
      states: {
        nodes: [
          { id: "s-today", name: "Today" },
          { id: "s-next", name: "next" },
          { id: "s-later", name: "Later" },
          { id: "s-done", name: "Done" },
        ],
      },
    },
  },
};

const connection = { token: "lin_api_x", tokenType: "api_key" as const, teamId: "team-1" };

const draft = {
  idempotencyKey: "note/t/n1#0",
  title: "Send Dana the SOW",
  project: "Client Work",
  state: "Next" as const,
  priority: "P2" as const,
  dueDate: "2026-10-30",
};

describe("issueUuidFor", () => {
  it("gives the same UUID v4 for the same key", async () => {
    const first = await issueUuidFor("note/t/n1#0");

    expect(first).toBe(await issueUuidFor("note/t/n1#0"));
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(first).not.toBe(await issueUuidFor("note/t/n1#1"));
  });
});

describe("LinearIssueTracker", () => {
  it("lists the team's project names", async () => {
    const linear = fakeLinear({ TeamSetup: () => team });

    expect(await new LinearIssueTracker(connection, linear.fetch).listProjects()).toEqual(["Client Work", "Sydeso"]);
  });

  it("sends a personal API key without Bearer, and an OAuth token with Bearer", async () => {
    const apiKey = fakeLinear({ TeamSetup: () => team });
    const oauth = fakeLinear({ TeamSetup: () => team });

    await new LinearIssueTracker(connection, apiKey.fetch).listProjects();
    await new LinearIssueTracker({ ...connection, token: "tok", tokenType: "oauth" }, oauth.fetch).listProjects();

    expect(apiKey.calls[0]?.authorization).toBe("lin_api_x");
    expect(oauth.calls[0]?.authorization).toBe("Bearer tok");
  });

  it("creates the issue with a stable ID, the mapped state, project, and priority", async () => {
    const linear = fakeLinear({
      TeamSetup: () => team,
      CreateIssue: (variables) => ({
        data: { issueCreate: { success: true, issue: { id: (variables.input as { id: string }).id, identifier: "DESK-7" } } },
      }),
    });

    const ref = await new LinearIssueTracker(connection, linear.fetch).createIssue(draft);

    const create = linear.calls.find((call) => call.query.includes("CreateIssue"));
    expect(create?.variables.input).toEqual({
      id: await issueUuidFor(draft.idempotencyKey),
      teamId: "team-1",
      title: "Send Dana the SOW",
      projectId: "p-client",
      stateId: "s-next",
      priority: 2,
      dueDate: "2026-10-30",
    });
    expect(ref).toEqual({ issueId: await issueUuidFor(draft.idempotencyKey), issueKey: "DESK-7" });
  });

  it("returns the existing issue when a retry finds that the ID is taken", async () => {
    const linear = fakeLinear({
      TeamSetup: () => team,
      CreateIssue: () => ({ data: null, errors: [{ message: "Entity already exists" }] }),
      FindIssue: (variables) => ({ data: { issue: { id: variables.id, identifier: "DESK-7" } } }),
    });

    const ref = await new LinearIssueTracker(connection, linear.fetch).createIssue(draft);

    expect(ref.issueKey).toBe("DESK-7");
  });

  it("throws the Linear error when the create fails and no issue exists", async () => {
    const linear = fakeLinear({
      TeamSetup: () => team,
      CreateIssue: () => ({ data: null, errors: [{ message: "Rate limited" }] }),
      FindIssue: () => ({ data: null, errors: [{ message: "Entity not found" }] }),
    });

    await expect(new LinearIssueTracker(connection, linear.fetch).createIssue(draft)).rejects.toThrow(/Rate limited/);
  });

  it("explains a missing Today, Next, or Later state", async () => {
    const linear = fakeLinear({
      TeamSetup: () => ({ data: { team: { ...team.data.team, states: { nodes: [{ id: "s1", name: "Todo" }] } } } }),
    });

    await expect(new LinearIssueTracker(connection, linear.fetch).createIssue(draft)).rejects.toThrow(LinearSetupError);
  });

  it("counts issues by state and priority", async () => {
    const linear = fakeLinear({
      TeamSetup: () => team,
      CountIssues: () => ({ data: { issues: { nodes: [{ id: "a" }, { id: "b" }] } } }),
    });

    const count = await new LinearIssueTracker(connection, linear.fetch).countIssues({ state: "Today", priority: "P1" });

    expect(count).toBe(2);
    const query = linear.calls.find((call) => call.query.includes("CountIssues"));
    expect(query?.variables.filter).toEqual({
      team: { id: { eq: "team-1" } },
      state: { id: { eq: "s-today" } },
      priority: { eq: 1 },
    });
  });

  it("loads the team setup once per tracker", async () => {
    const linear = fakeLinear({ TeamSetup: () => team });
    const tracker = new LinearIssueTracker(connection, linear.fetch);

    await tracker.listProjects();
    await tracker.listProjects();

    expect(linear.calls.filter((call) => call.query.includes("TeamSetup"))).toHaveLength(1);
  });
});
