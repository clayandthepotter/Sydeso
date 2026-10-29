import { createEvent } from "@desk/domain";
import { describe, expect, it } from "vitest";
import {
  FakeAvailability,
  FakeCalendar,
  FakeExtraction,
  FakeIssueTracker,
  FakeTenantDirectory,
  FixedClock,
  InMemoryEventStore,
  InMemoryInbox,
  SequentialIds,
} from "../src/index.js";

describe("FixedClock", () => {
  it("returns the set time and moves forward on request", () => {
    const clock = new FixedClock("2026-10-28T09:00:00-04:00");
    clock.advanceMinutes(30);

    expect(clock.now().toISOString()).toBe("2026-10-28T13:30:00.000Z");
  });
});

describe("SequentialIds", () => {
  it("gives IDs in order with a prefix", () => {
    const ids = new SequentialIds("evt");

    expect([ids.next(), ids.next()]).toEqual(["evt-1", "evt-2"]);
  });
});

describe("FakeExtraction", () => {
  it("returns the scripted items for a note text and records each call", async () => {
    const extraction = new FakeExtraction().respondTo("call the bank", [
      { action: "Call the bank", project: "Personal", dueDate: null, durationMinutes: 15, priority: "P3", confidence: 0.9 },
    ]);

    const request = { noteId: "n1", text: "call the bank", capturedAt: "2026-10-28T09:00:00-04:00", timeZone: "America/La_Paz", projects: [] };
    expect(await extraction.extract(request)).toHaveLength(1);
    expect(await extraction.extract({ ...request, text: "other" })).toEqual([]);
    expect(extraction.calls).toHaveLength(2);
  });
});

describe("FakeIssueTracker", () => {
  const draft = {
    idempotencyKey: "item-1",
    title: "Send Dana the SOW",
    project: "Client Work",
    state: "Today",
    priority: "P1",
    dueDate: "2026-10-30",
  } as const;

  it("creates one issue per idempotency key", async () => {
    const tracker = new FakeIssueTracker(["Client Work"]);

    const first = await tracker.createIssue(draft);
    const second = await tracker.createIssue(draft);

    expect(second).toEqual(first);
    expect(tracker.issues).toHaveLength(1);
  });

  it("counts issues by state and priority, and applies updates", async () => {
    const tracker = new FakeIssueTracker(["Client Work"]);
    const { issueId } = await tracker.createIssue(draft);
    await tracker.createIssue({ ...draft, idempotencyKey: "item-2", priority: "P2" });

    expect(await tracker.countIssues({ state: "Today", priority: "P1" })).toBe(1);
    await tracker.updateIssue(issueId, { state: "Next" });
    expect(await tracker.countIssues({ state: "Today", priority: "P1" })).toBe(0);
  });

  it("rejects an unknown project", async () => {
    await expect(new FakeIssueTracker([]).createIssue(draft)).rejects.toThrow(/project/);
  });
});

describe("FakeCalendar", () => {
  it("replaces the event that has the same external key", async () => {
    const calendar = new FakeCalendar();
    const event = { externalKey: "uid-1", title: "Busy", start: "2026-10-30T10:00:00-04:00", end: "2026-10-30T11:00:00-04:00" };

    const first = await calendar.upsertEvent("corporate-mirror", event);
    const second = await calendar.upsertEvent("corporate-mirror", { ...event, start: "2026-10-30T11:00:00-04:00" });

    expect(second.calendarEventId).toBe(first.calendarEventId);
    expect(calendar.events("corporate-mirror")).toEqual([
      { ...event, start: "2026-10-30T11:00:00-04:00", calendarEventId: first.calendarEventId },
    ]);
  });

  it("removes an event by its calendar event ID", async () => {
    const calendar = new FakeCalendar();
    const { calendarEventId } = await calendar.upsertEvent("focus-blocks", {
      externalKey: "tb-1",
      title: "Focus",
      start: "2026-10-30T10:00:00-04:00",
      end: "2026-10-30T11:00:00-04:00",
    });

    await calendar.removeEvent("focus-blocks", calendarEventId);

    expect(calendar.events("focus-blocks")).toEqual([]);
  });
});

describe("FakeAvailability", () => {
  it("returns only the busy intervals that overlap the range", async () => {
    const availability = new FakeAvailability([
      { start: "2026-10-30T08:00:00-04:00", end: "2026-10-30T09:00:00-04:00" },
      { start: "2026-10-30T12:00:00-04:00", end: "2026-10-30T13:00:00-04:00" },
    ]);

    const busy = await availability.busyIntervals({ start: "2026-10-30T08:30:00-04:00", end: "2026-10-30T12:00:00-04:00" });

    expect(busy).toEqual([{ start: "2026-10-30T08:00:00-04:00", end: "2026-10-30T09:00:00-04:00" }]);
  });
});

describe("InMemoryEventStore", () => {
  it("stores an event once and filters by type", async () => {
    const store = new InMemoryEventStore();
    const event = createEvent(
      "NoteCaptured",
      { noteId: "n1", text: "call the bank", capturedAt: "2026-10-28T09:00:00-04:00" },
      { clock: new FixedClock("2026-10-28T13:00:00Z"), ids: new SequentialIds("evt"), tenantId: "tenant-a" },
    );

    expect(await store.append(event)).toBe("appended");
    expect(await store.append(event)).toBe("duplicate");
    expect(await store.byType("NoteCaptured")).toEqual([event]);
    expect(await store.byType("ItemsExtracted")).toEqual([]);
  });
});

describe("InMemoryInbox", () => {
  it("returns true only for the first delivery per consumer", async () => {
    const inbox = new InMemoryInbox();

    expect(await inbox.markProcessed("desk-triage", "evt-1")).toBe(true);
    expect(await inbox.markProcessed("desk-triage", "evt-1")).toBe(false);
    expect(await inbox.markProcessed("desk-planner", "evt-1")).toBe(true);
  });
});

describe("FakeTenantDirectory", () => {
  const tenant = {
    tenantId: "tenant-a",
    timeZone: "America/La_Paz",
    confidenceThreshold: 0.7,
    allowedSenders: [],
    inviteAddressToken: "k7m2q9",
  };

  it("finds a tenant by ID and by invite token", async () => {
    const directory = new FakeTenantDirectory([tenant]);

    expect(await directory.get("tenant-a")).toBe(tenant);
    expect(await directory.byInviteToken("k7m2q9")).toBe(tenant);
    expect(await directory.byInviteToken("other")).toBeNull();
  });
});
