import { describe, expect, it } from "vitest";
import { MAX_P1_IN_TODAY, decideItems, itemIdFor, limitTodayP1, stateFor, type ExtractedItem } from "../src/index.js";

const item = (overrides: Partial<ExtractedItem> = {}): ExtractedItem => ({
  action: "Send Dana the SOW",
  project: "Client Work",
  dueDate: "2026-10-30",
  durationMinutes: 30,
  priority: "P2",
  confidence: 0.9,
  ...overrides,
});

const base = {
  sourceEventId: "note/tenant-a/n1",
  noteId: "n1",
  threshold: 0.7,
  projects: ["Client Work", "Sydeso"],
  today: "2026-10-28",
};

describe("itemIdFor", () => {
  it("is stable for the same source and index, and differs by index", () => {
    expect(itemIdFor("note/t/n1", 0)).toBe(itemIdFor("note/t/n1", 0));
    expect(itemIdFor("note/t/n1", 0)).not.toBe(itemIdFor("note/t/n1", 1));
  });
});

describe("stateFor", () => {
  it.each([
    ["a P1 item", item({ priority: "P1", dueDate: null }), "Today"],
    ["an item due today", item({ dueDate: "2026-10-28" }), "Today"],
    ["an overdue item", item({ dueDate: "2026-10-20", priority: "P3" }), "Today"],
    ["a P2 item", item({ dueDate: null }), "Next"],
    ["an item due within 7 days", item({ priority: "P3", dueDate: "2026-11-04" }), "Next"],
    ["a P3 item with no date", item({ priority: "P3", dueDate: null }), "Later"],
    ["a P3 item due later", item({ priority: "P3", dueDate: "2026-12-01" }), "Later"],
  ])("puts %s in the right state", (_label, input, state) => {
    expect(stateFor(input, "2026-10-28")).toBe(state);
  });
});

describe("decideItems", () => {
  it("routes a confident item with a known project", () => {
    const [decision] = decideItems({ ...base, extracted: [item()] });

    expect(decision).toEqual({
      kind: "routed",
      item: { ...item(), itemId: itemIdFor(base.sourceEventId, 0), sourceNoteId: "n1" },
      state: "Next",
    });
  });

  it("sends an item below the threshold to review", () => {
    const [decision] = decideItems({ ...base, extracted: [item({ confidence: 0.69 })] });

    expect(decision).toMatchObject({ kind: "review", reason: "low_confidence" });
  });

  it("routes an item exactly at the threshold", () => {
    const [decision] = decideItems({ ...base, extracted: [item({ confidence: 0.7 })] });

    expect(decision?.kind).toBe("routed");
  });

  it("sends an item with no project or an unknown project to review", () => {
    const decisions = decideItems({ ...base, extracted: [item({ project: null }), item({ project: "Unknown" })] });

    expect(decisions.map((decision) => decision.kind === "review" && decision.reason)).toEqual(["no_project", "no_project"]);
  });

  it("matches the project name without case and uses the Linear name", () => {
    const [decision] = decideItems({ ...base, extracted: [item({ project: "client work" })] });

    expect(decision?.kind === "routed" && decision.item.project).toBe("Client Work");
  });

  it("checks confidence before the project", () => {
    const [decision] = decideItems({ ...base, extracted: [item({ project: null, confidence: 0.2 })] });

    expect(decision).toMatchObject({ kind: "review", reason: "low_confidence" });
  });
});

describe("limitTodayP1", () => {
  it(`keeps a P1 in Today while fewer than ${MAX_P1_IN_TODAY} are there`, () => {
    expect(limitTodayP1("Today", "P1", MAX_P1_IN_TODAY - 1)).toBe("Today");
  });

  it(`moves a P1 to Next when ${MAX_P1_IN_TODAY} are in Today`, () => {
    expect(limitTodayP1("Today", "P1", MAX_P1_IN_TODAY)).toBe("Next");
  });

  it("does not move P2 or P3 items", () => {
    expect(limitTodayP1("Today", "P2", 10)).toBe("Today");
  });
});
