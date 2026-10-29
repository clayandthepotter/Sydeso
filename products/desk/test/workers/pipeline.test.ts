import { SecretBox } from "@desk/cloudflare";
import { createEvent, type AnyEvent } from "@desk/domain";
import { D1TenantDirectory } from "@desk/identity";
import { D1LinearConnections, D1PlannerPending } from "@desk/planning";
import { createPlannerRuntime } from "@desk/planning/worker";
import { triageForNotes } from "@desk/triage/d1";
import { createTriageRuntime } from "@desk/triage/worker";
import { FakeExtraction } from "@desk/testing";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const clock = { now: () => new Date("2026-10-28T13:00:00.000Z") };
const KEY = btoa(String.fromCharCode(...new Uint8Array(32).fill(3)));

const recordingQueue = () => {
  const messages: AnyEvent[] = [];
  return {
    messages,
    send: async (body: AnyEvent) => void messages.push(body),
    sendBatch: async (batch: Iterable<MessageSendRequest<AnyEvent>>) => {
      for (const message of batch) messages.push(message.body);
    },
  } as unknown as Queue & { messages: AnyEvent[] };
};

/** A fake Linear team with Today, Next, and Later. It keeps the issues it makes. */
const fakeLinear = () => {
  const created: Array<Record<string, unknown>> = [];
  const fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
    const { query, variables } = JSON.parse(String(init?.body)) as { query: string; variables: Record<string, unknown> };
    if (query.includes("TeamSetup")) {
      return Response.json({
        data: {
          team: {
            projects: { nodes: [{ id: "p-client", name: "Client Work" }] },
            states: { nodes: ["Today", "Next", "Later"].map((name) => ({ id: `s-${name}`, name })) },
          },
        },
      });
    }
    if (query.includes("CreateIssue")) {
      const input = variables.input as Record<string, unknown>;
      created.push(input);
      return Response.json({ data: { issueCreate: { success: true, issue: { id: input.id, identifier: `DESK-${created.length}` } } } });
    }
    if (query.includes("CountIssues")) return Response.json({ data: { issues: { nodes: [] } } });
    return Response.json({ errors: [{ message: "unexpected" }] });
  }) as typeof globalThis.fetch;
  return { created, fetch };
};

let unique = 0;
const seedTenant = async () => {
  unique += 1;
  const tenantId = `pipe-tenant-${unique}`;
  await env.DB.prepare(
    `INSERT INTO tenants (tenant_id, time_zone, confidence_threshold, invite_address_token, created_at)
     VALUES (?, 'America/La_Paz', 0.7, ?, ?)`,
  )
    .bind(tenantId, `pipe-token-${unique}`, clock.now().toISOString())
    .run();
  return tenantId;
};

const event = <T extends AnyEvent["type"]>(tenantId: string, type: T, id: string, payload: Extract<AnyEvent, { type: T }>["payload"]) =>
  createEvent(type, payload as never, { clock, ids: { next: () => id }, tenantId }) as unknown as Extract<AnyEvent, { type: T }>;

const sow = {
  action: "Send Dana the SOW",
  project: "Client Work",
  dueDate: "2026-10-30",
  durationMinutes: 30,
  priority: "P2" as const,
  confidence: 0.92,
};

describe("Triage and planning pipeline", () => {
  it("turns a note into a Linear issue and shows the issue key on the note", async () => {
    const tenantId = await seedTenant();
    const plannerQueue = recordingQueue();
    const triageQueue = recordingQueue();
    const linear = fakeLinear();
    const extraction = new FakeExtraction().respondTo("send Dana the SOW by Friday", [sow]);
    const triage = createTriageRuntime({
      db: env.DB,
      plannerQueue,
      extraction,
      tenants: new D1TenantDirectory(env.DB),
      clock,
    });
    const planner = createPlannerRuntime({
      env: { DB: env.DB, TRIAGE_QUEUE: triageQueue, DESK_SECRETS_KEY: KEY },
      clock,
      fetch: linear.fetch,
    });
    await new D1LinearConnections(env.DB, new SecretBox(KEY), clock).save(tenantId, {
      token: "lin_api_x",
      tokenType: "api_key",
      teamId: "team-1",
      teamName: "Core",
    });

    await triage(event(tenantId, "ProjectsSynced", `${tenantId}/sync`, { teamId: "team-1", teamName: "Core", projects: ["Client Work"] }));
    await triage(
      event(tenantId, "NoteCaptured", `note/${tenantId}/n1`, {
        noteId: "n1",
        text: "send Dana the SOW by Friday",
        capturedAt: "2026-10-28T09:00:00.000-04:00",
      }),
    );

    expect(plannerQueue.messages.map((message) => message.type)).toEqual(["ItemRouted"]);
    expect(extraction.calls[0]?.projects).toEqual(["Client Work"]);

    for (const message of plannerQueue.messages) await planner(message);
    expect(linear.created).toHaveLength(1);
    expect(linear.created[0]).toMatchObject({ title: "Send Dana the SOW", stateId: "s-Next", projectId: "p-client", priority: 2 });
    expect(triageQueue.messages.map((message) => message.type)).toEqual(["WorkItemCreated"]);

    for (const message of triageQueue.messages) await triage(message);
    const view = (await triageForNotes(env.DB, tenantId, ["n1"])).get("n1");
    expect(view?.items).toEqual([
      expect.objectContaining({ action: "Send Dana the SOW", status: "created", state: "Next", issueKey: "DESK-1" }),
    ]);
  });

  it("runs triage once for a repeated note", async () => {
    const tenantId = await seedTenant();
    const extraction = new FakeExtraction().respondTo("call the bank", []);
    const triage = createTriageRuntime({
      db: env.DB,
      plannerQueue: recordingQueue(),
      extraction,
      tenants: new D1TenantDirectory(env.DB),
      clock,
    });
    const note = event(tenantId, "NoteCaptured", `note/${tenantId}/dup`, {
      noteId: "dup",
      text: "call the bank",
      capturedAt: "2026-10-28T09:00:00.000-04:00",
    });

    await triage(note);
    await triage(note);

    expect(extraction.calls).toHaveLength(1);
  });

  it("sends items to review when the tenant has no projects yet", async () => {
    const tenantId = await seedTenant();
    const plannerQueue = recordingQueue();
    const triage = createTriageRuntime({
      db: env.DB,
      plannerQueue,
      extraction: new FakeExtraction().respondTo("send Dana the SOW by Friday", [sow]),
      tenants: new D1TenantDirectory(env.DB),
      clock,
    });

    await triage(
      event(tenantId, "NoteCaptured", `note/${tenantId}/n2`, {
        noteId: "n2",
        text: "send Dana the SOW by Friday",
        capturedAt: "2026-10-28T09:00:00.000-04:00",
      }),
    );

    expect(plannerQueue.messages).toEqual([]);
    const view = (await triageForNotes(env.DB, tenantId, ["n2"])).get("n2");
    expect(view?.items).toEqual([expect.objectContaining({ status: "needs_review", reviewReason: "no_project" })]);
  });

  it("parks a routed item when Linear is not connected", async () => {
    const tenantId = await seedTenant();
    const planner = createPlannerRuntime({
      env: { DB: env.DB, TRIAGE_QUEUE: recordingQueue(), DESK_SECRETS_KEY: KEY },
      clock,
      fetch: fakeLinear().fetch,
    });
    const routed = event(tenantId, "ItemRouted", `${tenantId}/routed`, {
      state: "Next",
      item: { ...sow, itemId: "item-1", sourceNoteId: "n3" },
    });

    await planner(routed);

    const parked = await new D1PlannerPending(env.DB, clock).list(tenantId);
    expect(parked.map((parkedEvent) => parkedEvent.id)).toEqual([routed.id]);
  });
});
