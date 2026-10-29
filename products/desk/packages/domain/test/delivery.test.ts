import { describe, expect, it } from "vitest";
import { createEvent, deliver, type AnyEvent, type EventConsumer, type InboxPort } from "../src/index.js";

const clock = { now: () => new Date("2026-10-28T13:00:00Z") };
const note = createEvent(
  "NoteCaptured",
  { noteId: "n1", text: "call the bank", capturedAt: "2026-10-28T09:00:00.000-04:00" },
  { clock, ids: { next: () => "evt-1" }, tenantId: "t" },
);

const memoryInbox = (): InboxPort & { seen: Set<string> } => {
  const seen = new Set<string>();
  return {
    seen,
    hasProcessed: async (consumer, id) => seen.has(`${consumer}:${id}`),
    markProcessed: async (consumer, id) => {
      const key = `${consumer}:${id}`;
      const first = !seen.has(key);
      seen.add(key);
      return first;
    },
  };
};

const consumer = (output: AnyEvent[]): EventConsumer & { calls: number } => ({
  name: "test-consumer",
  consumes: ["NoteCaptured"],
  calls: 0,
  async handle() {
    this.calls += 1;
    return output;
  },
});

describe("deliver", () => {
  it("handles the event, publishes the output, then marks the event", async () => {
    const inbox = memoryInbox();
    const published: AnyEvent[][] = [];
    const c = consumer([note]);

    const outcome = await deliver(c, note, { inbox, publish: async (events) => void published.push([...events]) });

    expect(outcome).toBe("handled");
    expect(published).toEqual([[note]]);
    expect(inbox.seen.has("test-consumer:evt-1")).toBe(true);
  });

  it("skips an event that the consumer has processed", async () => {
    const inbox = memoryInbox();
    const c = consumer([]);
    const publish = async () => undefined;

    await deliver(c, note, { inbox, publish });
    const outcome = await deliver(c, note, { inbox, publish });

    expect(outcome).toBe("duplicate");
    expect(c.calls).toBe(1);
  });

  it("does not mark the event when the publish fails, so a retry does the work again", async () => {
    const inbox = memoryInbox();
    const c = consumer([note]);

    await expect(
      deliver(c, note, {
        inbox,
        publish: async () => {
          throw new Error("queue down");
        },
      }),
    ).rejects.toThrow("queue down");

    expect(inbox.seen.size).toBe(0);
  });

  it("ignores an event type that the consumer does not read", async () => {
    const c = { ...consumer([]), consumes: ["InviteParsed"] as const };

    expect(await deliver(c, note, { inbox: memoryInbox(), publish: async () => undefined })).toBe("ignored");
  });
});
