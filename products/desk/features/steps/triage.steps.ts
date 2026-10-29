import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { EventEnvelope } from "@desk/domain";
import { loadNoteFixture, loadNoteFixtures } from "@desk/testing";
import { expect } from "vitest";
import { createWorld, type World } from "../support/world.js";

const feature = await loadFeature("../triage.feature");

/** Day of the week for a local date: 0 is Sunday, 5 is Friday. */
const weekday = (localDate: string) => new Date(`${localDate}T12:00:00Z`).getUTCDay();

describeFeature(feature, ({ Scenario }) => {
  let world: World;
  let note: EventEnvelope<"NoteCaptured">;
  let deliveries: number;

  const givenNote = (fixtureName: string) => {
    world = createWorld();
    const fixture = loadNoteFixture(fixtureName);
    world.extraction.respondTo(fixture.text, fixture.expectedItems);
    note = world.event("NoteCaptured", { noteId: `note-${fixtureName}`, text: fixture.text, capturedAt: fixture.capturedAt });
    deliveries = 1;
  };

  const runTriage = async () => {
    const bus = world.busFor(world.triage, world.planner);
    for (let i = 0; i < deliveries; i += 1) await bus.publish(note);
  };

  Scenario("Note with a deadline becomes a work item", ({ Given, When, Then, And }) => {
    Given("a note {string}", (_ctx, text: string) => {
      const fixture = loadNoteFixtures().find((candidate) => candidate.text === text);
      if (!fixture) throw new Error(`No note fixture has the text "${text}"`);
      givenNote(fixture.name);
    });
    When("triage runs", runTriage);
    Then("one item is extracted with a Friday due date", async () => {
      const extracted = await world.store.byType("ItemsExtracted");
      expect(extracted).toHaveLength(1);
      expect(extracted[0]?.payload.items).toHaveLength(1);
      const dueDate = extracted[0]?.payload.items[0]?.dueDate;
      expect(dueDate).toBe("2026-10-30");
      expect(weekday(dueDate ?? "")).toBe(5);
    });
    And("a 30 minute duration", async () => {
      const [extracted] = await world.store.byType("ItemsExtracted");
      expect(extracted?.payload.items[0]?.durationMinutes).toBe(30);
    });
    And("one Linear issue is created", async () => {
      expect(world.issueTracker.issues).toHaveLength(1);
      expect(await world.store.byType("WorkItemCreated")).toHaveLength(1);
    });
  });

  Scenario("Low confidence goes to review", ({ Given, When, Then, And }) => {
    Given("a note with an ambiguous action", () => givenNote("ambiguous-action"));
    When("triage runs", runTriage);
    Then("an ItemNeedsReview event is stored", async () => {
      const reviews = await world.store.byType("ItemNeedsReview");
      expect(reviews).toHaveLength(1);
      expect(reviews[0]?.payload.reason).toBe("low_confidence");
      expect(reviews[0]?.payload.source).toMatchObject({ kind: "note", noteId: note.payload.noteId });
    });
    And("no Linear issue is created", async () => {
      expect(world.issueTracker.issues).toHaveLength(0);
      expect(await world.store.byType("ItemRouted")).toHaveLength(0);
    });
  });

  Scenario("Duplicate note delivery", ({ Given, When, Then }) => {
    Given("a NoteCaptured event was delivered twice", () => {
      givenNote("sow-by-friday");
      deliveries = 2;
    });
    When("triage runs", runTriage);
    Then("only one ItemsExtracted event exists", async () => {
      expect(await world.store.byType("ItemsExtracted")).toHaveLength(1);
      expect(world.issueTracker.issues).toHaveLength(1);
    });
  });
});
