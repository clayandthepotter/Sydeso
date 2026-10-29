import { describe, expect, it } from "vitest";
import { CONSUMERS, EVENT_CATALOG, SUBSCRIPTIONS, subscribersOf } from "../src/index.js";

describe("SUBSCRIPTIONS", () => {
  it("names only event types from the catalog", () => {
    for (const types of Object.values(SUBSCRIPTIONS)) {
      for (const type of types) expect(Object.hasOwn(EVENT_CATALOG, type)).toBe(true);
    }
  });

  it("never sends a consumer the events of its own context back to it", () => {
    const owner = { "desk-triage": "triage", "desk-planner": "planning" } as const;
    for (const consumer of CONSUMERS) {
      for (const type of SUBSCRIPTIONS[consumer]) expect(EVENT_CATALOG[type].source).not.toBe(owner[consumer]);
    }
  });
});

describe("subscribersOf", () => {
  it("routes each event to the consumers that read it", () => {
    expect(subscribersOf("NoteCaptured")).toEqual(["desk-triage"]);
    expect(subscribersOf("ItemRouted")).toEqual(["desk-planner"]);
    expect(subscribersOf("WorkItemCreated")).toEqual(["desk-triage"]);
    expect(subscribersOf("TenantCreated")).toEqual([]);
  });
});
