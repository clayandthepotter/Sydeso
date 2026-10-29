import { describe, expect, it } from "vitest";
import {
  appendOnce,
  causedEventId,
  createEvent,
  dedupeById,
  shouldProcess,
  type AnyEvent,
  type Clock,
} from "../src/index.js";

const clock: Clock = { now: () => new Date("2026-10-28T13:00:00.000Z") };

const note = (id: string, noteId = "note-1"): AnyEvent =>
  createEvent(
    "NoteCaptured",
    { noteId, text: "call the bank", capturedAt: "2026-10-28T09:00:00.000-04:00" },
    { clock, ids: { next: () => id } },
  );

describe("appendOnce", () => {
  it("appends an event with a new ID", () => {
    const result = appendOnce([], note("evt-1"));

    expect(result.outcome).toBe("appended");
    expect(result.log.map((event) => event.id)).toEqual(["evt-1"]);
  });

  it("ignores an event with an ID that is already in the log", () => {
    const first = appendOnce([], note("evt-1"));
    const second = appendOnce(first.log, note("evt-1"));

    expect(second.outcome).toBe("duplicate");
    expect(second.log).toBe(first.log);
  });

  it("does not change the input log", () => {
    const log: readonly AnyEvent[] = Object.freeze([note("evt-1")]);
    appendOnce(log, note("evt-2"));

    expect(log).toHaveLength(1);
  });
});

describe("dedupeById", () => {
  it("keeps the first copy of each ID in order", () => {
    const events = [note("a"), note("b"), note("a", "note-2"), note("c"), note("b")];

    const result = dedupeById(events);

    expect(result.map((event) => event.id)).toEqual(["a", "b", "c"]);
    expect(result[0]?.payload).toEqual(events[0]?.payload);
  });
});

describe("shouldProcess", () => {
  it("processes an event that was not seen", () => {
    expect(shouldProcess(new Set(["x"]), note("evt-1"))).toBe(true);
  });

  it("skips an event that was seen", () => {
    expect(shouldProcess(new Set(["evt-1"]), note("evt-1"))).toBe(false);
  });
});

describe("causedEventId", () => {
  it("gives the same ID for the same cause and type", () => {
    expect(causedEventId("evt-1", "ItemsExtracted")).toBe(causedEventId("evt-1", "ItemsExtracted"));
  });

  it("gives different IDs for different causes, types, or keys", () => {
    const ids = new Set([
      causedEventId("evt-1", "ItemsExtracted"),
      causedEventId("evt-2", "ItemsExtracted"),
      causedEventId("evt-1", "ItemNeedsReview"),
      causedEventId("evt-1", "ItemNeedsReview", "item-2"),
    ]);

    expect(ids.size).toBe(4);
  });
});
