import { QueuePublisher, SecretBox, D1EventStore, D1Inbox } from "@desk/cloudflare";
import { createEvent } from "@desk/domain";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const KEY = btoa(String.fromCharCode(...new Uint8Array(32).map((_, i) => i)));
const clock = { now: () => new Date("2026-10-28T13:00:00Z") };

describe("SecretBox", () => {
  it("opens what it seals for the same tenant", async () => {
    const box = new SecretBox(KEY);

    const sealed = await box.seal("lin_api_secret", "tenant-a");

    expect(sealed).toMatch(/^v1\./);
    expect(sealed).not.toContain("lin_api_secret");
    expect(await box.open(sealed, "tenant-a")).toBe("lin_api_secret");
  });

  it("does not open a value for another tenant", async () => {
    const box = new SecretBox(KEY);
    const sealed = await box.seal("lin_api_secret", "tenant-a");

    await expect(box.open(sealed, "tenant-b")).rejects.toThrow();
  });

  it("uses a new IV each time", async () => {
    const box = new SecretBox(KEY);

    expect(await box.seal("x", "t")).not.toBe(await box.seal("x", "t"));
  });

  it("rejects a key of the wrong size", () => {
    expect(() => new SecretBox(btoa("short"))).toThrow(/32 bytes/);
  });
});

describe("QueuePublisher", () => {
  it("stores each event and sends it to the queues of its subscribers", async () => {
    const sent: Array<{ queue: string; bodies: unknown[] }> = [];
    const fakeQueue = (queue: string) =>
      ({
        send: async () => undefined,
        sendBatch: async (batch: Iterable<MessageSendRequest>) => {
          sent.push({ queue, bodies: [...batch].map((message) => message.body) });
        },
      }) as unknown as Queue;
    const publisher = new QueuePublisher((tenantId) => new D1EventStore(env.DB, tenantId), {
      "desk-triage": fakeQueue("triage"),
      "desk-planner": fakeQueue("planner"),
    });
    const note = createEvent(
      "NoteCaptured",
      { noteId: "pub-1", text: "call the bank", capturedAt: "2026-10-28T09:00:00.000-04:00" },
      { clock, ids: { next: () => "evt-pub-1" }, tenantId: "tenant-pub" },
    );
    const created = createEvent(
      "TenantCreated",
      { userId: "u1", email: "a@example.com", displayName: "A", timeZone: "UTC" },
      { clock, ids: { next: () => "evt-pub-2" }, tenantId: "tenant-pub" },
    );

    await publisher.publish([note, created]);

    expect(sent).toEqual([{ queue: "triage", bodies: [note] }]);
    expect((await new D1EventStore(env.DB, "tenant-pub").all()).map((event) => event.id)).toEqual(["evt-pub-1", "evt-pub-2"]);
  });
});

describe("D1EventStore", () => {
  it("reads only the events of its tenant", async () => {
    const make = (tenantId: string, id: string) =>
      createEvent(
        "NoteCaptured",
        { noteId: id, text: "x", capturedAt: "2026-10-28T09:00:00.000-04:00" },
        { clock, ids: { next: () => id }, tenantId },
      );
    await new D1EventStore(env.DB, "iso-a").append(make("iso-a", "iso-evt-a"));
    await new D1EventStore(env.DB, "iso-b").append(make("iso-b", "iso-evt-b"));

    expect((await new D1EventStore(env.DB, "iso-a").all()).map((event) => event.id)).toEqual(["iso-evt-a"]);
    await expect(new D1EventStore(env.DB, "iso-a").append(make("iso-b", "iso-evt-c"))).rejects.toThrow(/another tenant/);
  });
});

describe("D1Inbox", () => {
  it("reports an event as processed only after it is marked", async () => {
    const inbox = new D1Inbox(env.DB, clock.now);

    expect(await inbox.hasProcessed("desk-triage", "inbox-1")).toBe(false);
    expect(await inbox.markProcessed("desk-triage", "inbox-1")).toBe(true);
    expect(await inbox.hasProcessed("desk-triage", "inbox-1")).toBe(true);
    expect(await inbox.markProcessed("desk-triage", "inbox-1")).toBe(false);
  });
});
