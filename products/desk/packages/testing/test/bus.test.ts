import { causedEventId, createEvent, type AnyEvent, type EventConsumer } from "@desk/domain";
import { describe, expect, it } from "vitest";
import { FakeRawStore, FixedClock, InMemoryBus, InMemoryEventStore, SequentialIds } from "../src/index.js";

const clock = new FixedClock("2026-10-28T13:00:00Z");
const note = createEvent(
  "NoteCaptured",
  { noteId: "n1", text: "call the bank", capturedAt: "2026-10-28T09:00:00-04:00" },
  { clock, ids: new SequentialIds("evt") },
);

/** A consumer that publishes one ItemsExtracted per note. It is not idempotent on purpose. */
const echo = (): EventConsumer & { calls: number } => ({
  name: "echo",
  consumes: ["NoteCaptured"],
  calls: 0,
  async handle(event: AnyEvent) {
    this.calls += 1;
    if (event.type !== "NoteCaptured") return [];
    return [
      createEvent(
        "ItemsExtracted",
        { noteId: event.payload.noteId, items: [] },
        { clock, ids: new SequentialIds("x"), id: causedEventId(event.id, "ItemsExtracted"), causationId: event.id },
      ),
    ];
  },
});

describe("InMemoryBus", () => {
  it("stores a published event and every event that consumers return", async () => {
    const store = new InMemoryEventStore();
    const bus = new InMemoryBus(store, [echo()]);

    await bus.publish(note);

    expect((await store.all()).map((event) => event.type)).toEqual(["NoteCaptured", "ItemsExtracted"]);
  });

  it("delivers a repeat to consumers again, like a queue that delivers at least once", async () => {
    const consumer = echo();
    const bus = new InMemoryBus(new InMemoryEventStore(), [consumer]);

    await bus.publish(note);
    await bus.publish(note);

    expect(consumer.calls).toBe(2);
  });

  it("delivers only the event types that a consumer declares", async () => {
    const consumer = { ...echo(), consumes: ["InviteParsed"] as const };
    const bus = new InMemoryBus(new InMemoryEventStore(), [consumer]);

    await bus.publish(note);

    expect(consumer.calls).toBe(0);
  });
});

describe("FakeRawStore", () => {
  it("returns what was put, and null for an unknown key", async () => {
    const raw = new FakeRawStore();
    await raw.put("emails/1.eml", "body");

    expect(await raw.get("emails/1.eml")).toBe("body");
    expect(await raw.get("missing")).toBeNull();
  });
});
