import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { loadInviteFixture } from "@desk/testing";
import { expect } from "vitest";
import { createWorld, type World } from "../support/world.js";

const feature = await loadFeature("../mirror.feature");

const parsedFixture = (name: string) => {
  const { expected } = loadInviteFixture(name);
  if (expected.outcome !== "parsed") throw new Error(`Fixture ${name} is not a parsed invite`);
  return expected.invite;
};

describeFeature(feature, ({ Scenario }) => {
  let world: World;

  const givenMirroredInvite = async () => {
    world = createWorld();
    await world.busFor(world.mirror).publish(world.inviteParsed("request-basic", "email-1"));
  };

  Scenario("Invite update replaces the mirror event", ({ Given, When, Then, And }) => {
    Given("a mirrored invite", givenMirroredInvite);
    When("the organizer moves it by 1 hour (higher SEQUENCE)", async () => {
      await world.busFor(world.mirror).publish(world.inviteParsed("request-moved", "email-2"));
    });
    Then("the mirror event moves", () => {
      const moved = parsedFixture("request-moved");
      const [event] = world.calendar.events("corporate-mirror");
      expect(event).toMatchObject({ start: moved.start, end: moved.end });
      expect(event?.title).not.toMatch(/CONFIDENTIAL|Board room/);
    });
    And("no duplicate exists", async () => {
      expect(world.calendar.events("corporate-mirror")).toHaveLength(1);
      const upserts = await world.store.byType("MirrorEventUpserted");
      expect(new Set(upserts.map((event) => event.payload.calendarEventId)).size).toBe(1);
    });
  });

  Scenario("Invite cancellation", ({ Given, When, Then }) => {
    Given("a mirrored invite", givenMirroredInvite);
    When("a METHOD CANCEL invite arrives", async () => {
      await world.busFor(world.mirror).publish(world.inviteParsed("cancel", "email-3"));
    });
    Then("the mirror event is removed", async () => {
      expect(world.calendar.events("corporate-mirror")).toEqual([]);
      const removed = await world.store.byType("MirrorEventRemoved");
      expect(removed).toHaveLength(1);
      expect(removed[0]?.payload.icalUid).toBe(parsedFixture("cancel").icalUid);
    });
  });
});
