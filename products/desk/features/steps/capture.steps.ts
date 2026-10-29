import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { USER_TIME_ZONE } from "@desk/domain";
import { FixedClock, SequentialIds } from "@desk/testing";
import { createNoteBox, type LocalNote, type NoteBox } from "@desk/web";
import { expect } from "vitest";
import { FakeConnectivity, FakeLocalNoteStore, FakeSyncTransport } from "../support/web.js";
import { SCENARIO_NOW } from "../support/world.js";

const feature = await loadFeature("../capture.feature");

describeFeature(feature, ({ Scenario }) => {
  Scenario("Offline capture", ({ Given, When, Then, And }) => {
    let connectivity: FakeConnectivity;
    let transport: FakeSyncTransport;
    let noteBox: NoteBox;
    let saved: LocalNote;

    Given("the device has no connection", () => {
      connectivity = new FakeConnectivity(false);
      transport = new FakeSyncTransport(connectivity);
      noteBox = createNoteBox({
        local: new FakeLocalNoteStore(),
        transport,
        connectivity,
        clock: new FixedClock(SCENARIO_NOW),
        ids: new SequentialIds("note"),
        timeZone: USER_TIME_ZONE,
      });
    });
    When("the user saves a note", async () => {
      saved = await noteBox.save("call the bank about the card");
    });
    Then("the note appears in the list", async () => {
      expect(await noteBox.list()).toEqual([expect.objectContaining({ noteId: saved.noteId, syncState: "pending" })]);
      expect(transport.sent).toEqual([]);
    });
    And("it syncs once the connection returns", async () => {
      await connectivity.goOnline();
      expect(transport.sent.map((note) => note.noteId)).toEqual([saved.noteId]);
      expect(await noteBox.list()).toEqual([expect.objectContaining({ noteId: saved.noteId, syncState: "synced" })]);
    });
  });
});
