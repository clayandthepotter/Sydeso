import { describe, expect, it } from "vitest";
import {
  EVENT_CATALOG,
  EventValidationError,
  createEvent,
  parseEvent,
  type Clock,
  type IdGenerator,
} from "../src/index.js";

const clock: Clock = { now: () => new Date("2026-10-28T13:00:00.000Z") };
const ids = (...values: string[]): IdGenerator => {
  const queue = [...values];
  return {
    next: () => {
      const value = queue.shift();
      if (value === undefined) throw new Error("No more IDs in the test queue.");
      return value;
    },
  };
};

const notePayload = {
  noteId: "note-1",
  text: "send Dana the SOW by Friday",
  capturedAt: "2026-10-28T09:00:00.000-04:00",
};

describe("createEvent", () => {
  it("fills the envelope from the catalog, the clock, and the ID generator", () => {
    const event = createEvent("NoteCaptured", notePayload, { clock, ids: ids("evt-1"), tenantId: "tenant-a" });

    expect(event).toEqual({
      id: "evt-1",
      tenantId: "tenant-a",
      type: "NoteCaptured",
      version: 1,
      occurredAt: "2026-10-28T13:00:00.000Z",
      source: "capture",
      payload: notePayload,
    });
  });

  it("keeps the correlation and causation IDs when given", () => {
    const event = createEvent("NoteCaptured", notePayload, {
      clock,
      ids: ids("evt-2"),
      tenantId: "tenant-a",
      correlationId: "corr-1",
      causationId: "cause-1",
    });

    expect(event.correlationId).toBe("corr-1");
    expect(event.causationId).toBe("cause-1");
  });

  it("uses an explicit ID before the generator", () => {
    const event = createEvent("NoteCaptured", notePayload, { clock, ids: ids(), tenantId: "tenant-a", id: "fixed-id" });

    expect(event.id).toBe("fixed-id");
  });

  it("rejects a payload that does not match the schema", () => {
    expect(() =>
      createEvent("NoteCaptured", { ...notePayload, text: "" }, { clock, ids: ids("evt-3"), tenantId: "tenant-a" }),
    ).toThrow(EventValidationError);
  });

  it("returns a frozen envelope", () => {
    const event = createEvent("NoteCaptured", notePayload, { clock, ids: ids("evt-4"), tenantId: "tenant-a" });

    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.isFrozen(event.payload)).toBe(true);
  });
});

describe("parseEvent", () => {
  const valid = {
    id: "evt-1",
    tenantId: "tenant-a",
    type: "NoteCaptured",
    version: 1,
    occurredAt: "2026-10-28T13:00:00.000Z",
    source: "capture",
    payload: notePayload,
  };

  it("accepts a valid envelope", () => {
    const result = parseEvent(valid);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.event.type).toBe("NoteCaptured");
  });

  it("survives a JSON round trip", () => {
    const event = createEvent("NoteCaptured", notePayload, { clock, ids: ids("evt-9"), tenantId: "tenant-a" });
    const result = parseEvent(JSON.parse(JSON.stringify(event)));

    expect(result).toEqual({ ok: true, event });
  });

  it.each([
    ["a missing ID", { ...valid, id: "" }, "id"],
    ["a missing tenant", { ...valid, tenantId: undefined }, "tenantId"],
    ["an unknown type", { ...valid, type: "NoteDeleted" }, "type"],
    ["an unsupported version", { ...valid, version: 99 }, "version"],
    ["a bad timestamp", { ...valid, occurredAt: "yesterday" }, "occurredAt"],
    ["a source that does not own the type", { ...valid, source: "triage" }, "source"],
    ["a bad payload", { ...valid, payload: { noteId: "note-1" } }, "payload"],
  ])("rejects %s", (_label, input, field) => {
    const result = parseEvent(input);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((error) => error.startsWith(field))).toBe(true);
  });

  it("rejects input that is not an object", () => {
    expect(parseEvent("NoteCaptured").ok).toBe(false);
    expect(parseEvent(null).ok).toBe(false);
  });
});

describe("EVENT_CATALOG", () => {
  it("gives each context only the events from the handoff", () => {
    const byContext = Object.entries(EVENT_CATALOG).reduce<Record<string, string[]>>(
      (acc, [type, entry]) => {
        (acc[entry.source] ??= []).push(type);
        return acc;
      },
      {},
    );

    expect(byContext).toEqual({
      identity: ["TenantCreated"],
      capture: ["NoteCaptured"],
      ingestion: ["InviteReceived", "InviteParsed", "InviteRejected"],
      triage: ["ItemsExtracted", "ItemRouted", "ItemNeedsReview"],
      planning: ["WorkItemCreated", "WorkItemUpdated"],
      scheduling: [
        "MirrorEventUpserted",
        "MirrorEventRemoved",
        "TimeBlockProposed",
        "TimeBlockConfirmed",
        "TimeBlockRejected",
      ],
    });
  });
});
