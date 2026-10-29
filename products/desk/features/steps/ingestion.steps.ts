import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { AnyEvent } from "@desk/domain";
import { parseInvite, type InboundEmail, type ParseInviteResult } from "@desk/ingestion";
import { loadInviteFixture, type InviteFixture } from "@desk/testing";
import { expect } from "vitest";
import { createWorld, type World } from "../support/world.js";

const feature = await loadFeature("../ingestion.feature");

describeFeature(feature, ({ Scenario }) => {
  let world: World;

  Scenario("Invite in another time zone", ({ Given, When, Then }) => {
    let fixture: InviteFixture;
    let result: ParseInviteResult;

    Given("an invite in Eastern time", () => {
      world = createWorld();
      fixture = loadInviteFixture("eastern-time");
      expect(fixture.ics).toContain("TZID=Eastern Standard Time");
    });
    When("it is parsed", () => {
      result = parseInvite(fixture.ics, world.tenant.timeZone);
    });
    Then("the event shows at the correct La Paz time", () => {
      expect(fixture.expected.outcome).toBe("parsed");
      if (fixture.expected.outcome !== "parsed") return;
      expect(result).toEqual({ ok: true, invite: fixture.expected.invite });
    });
  });

  Scenario("Unknown sender", ({ Given, When, Then, And }) => {
    let email: InboundEmail;
    let published: readonly AnyEvent[];

    Given("an email from an address not on the allow list", () => {
      world = createWorld();
      // The sender is allowed for another tenant only. That must not help.
      email = {
        messageId: "<msg-1@elsewhere.example>",
        from: "someone@elsewhere.example",
        to: `invites+${world.tenant.inviteAddressToken}@in.sydeso.com`,
        raw: loadInviteFixture("request-basic").ics,
      };
      expect(world.tenant.allowedSenders).not.toContain(email.from);
    });
    When("the Email Worker runs", async () => {
      published = await world.emailWorker.receive(email);
      const bus = world.busFor();
      for (const event of published) await bus.publish(event);
    });
    Then("the email is rejected", () => {
      expect(published.map((event) => event.type)).toEqual(["InviteRejected"]);
      expect(published[0]?.payload).toMatchObject({ from: email.from, reason: "sender_not_allowed" });
    });
    And("an InviteRejected event is stored", async () => {
      expect(await world.store.byType("InviteRejected")).toHaveLength(1);
      expect(await world.store.byType("InviteReceived")).toHaveLength(0);
    });
  });
});
