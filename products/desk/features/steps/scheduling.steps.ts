import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { EventEnvelope } from "@desk/domain";
import { expect } from "vitest";
import { createWorld, type World } from "../support/world.js";

const feature = await loadFeature("../scheduling.feature");

const minutesBetween = (start: string, end: string) => (Date.parse(end) - Date.parse(start)) / 60_000;

describeFeature(feature, ({ Scenario }) => {
  Scenario("Time blocks need confirmation", ({ Given, When, Then, And }) => {
    let world: World;
    let routed: EventEnvelope<"ItemRouted">;

    Given("a P1 item with a 60 minute duration", () => {
      world = createWorld();
      world.availability.setBusy([{ start: "2026-10-28T10:00:00-04:00", end: "2026-10-28T11:00:00-04:00" }]);
      routed = world.event("ItemRouted", {
        state: "Today",
        item: {
          itemId: "item-1",
          sourceNoteId: "note-1",
          action: "Fix the login bug",
          project: "Sydeso",
          dueDate: "2026-10-28",
          durationMinutes: 60,
          priority: "P1",
          confidence: 0.9,
        },
      });
    });
    When("the scheduler runs", async () => {
      await world.busFor(world.scheduler).publish(routed);
    });
    Then("a TimeBlockProposed event is stored", async () => {
      const proposed = await world.store.byType("TimeBlockProposed");
      expect(proposed).toHaveLength(1);
      expect(proposed[0]?.payload.itemId).toBe("item-1");
      expect(minutesBetween(proposed[0]?.payload.start ?? "", proposed[0]?.payload.end ?? "")).toBe(60);
    });
    And("no calendar event exists until TimeBlockConfirmed", async () => {
      expect(world.calendar.events("focus-blocks")).toEqual([]);

      const [proposed] = await world.store.byType("TimeBlockProposed");
      const confirmed = await world.scheduler.confirm(proposed?.payload.timeBlockId ?? "");
      await world.store.append(confirmed);

      expect(world.calendar.events("focus-blocks")).toHaveLength(1);
      expect(await world.store.byType("TimeBlockConfirmed")).toHaveLength(1);
    });
  });
});
