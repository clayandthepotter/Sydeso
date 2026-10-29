import { extractedItemSchema, inviteParsedSchema } from "@desk/domain";
import { describe, expect, it } from "vitest";
import { loadInviteFixtures, loadNoteFixtures } from "../src/index.js";

describe("note fixtures", () => {
  const fixtures = loadNoteFixtures();

  it("has at least one fixture", () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  it.each(fixtures.map((fixture) => [fixture.name, fixture] as const))(
    "%s has expected items that match the domain schema",
    (_name, fixture) => {
      for (const item of fixture.expectedItems) expect(extractedItemSchema.safeParse(item).success).toBe(true);
    },
  );
});

describe("invite fixtures", () => {
  const fixtures = loadInviteFixtures();

  it("has at least one fixture", () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  it.each(fixtures.map((fixture) => [fixture.name, fixture] as const))(
    "%s has raw .ics text and an expected parse result that matches the schema",
    (_name, fixture) => {
      expect(fixture.ics).toContain("BEGIN:VCALENDAR");
      if (fixture.expected.outcome === "parsed") {
        expect(inviteParsedSchema.omit({ emailId: true }).safeParse(fixture.expected.invite).success).toBe(true);
      }
    },
  );
});
