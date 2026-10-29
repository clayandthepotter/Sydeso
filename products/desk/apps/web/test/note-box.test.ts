import { FakeConnectivity, FakeLocalNoteStore, FakeSyncTransport, FixedClock, SequentialIds } from "@desk/testing";
import { describe, expect, it } from "vitest";
import { EmptyNoteError, createNoteBox } from "../src/index.js";

const setup = (online: boolean) => {
  const connectivity = new FakeConnectivity(online);
  const transport = new FakeSyncTransport(connectivity);
  const local = new FakeLocalNoteStore();
  const clock = new FixedClock("2026-10-28T13:00:00Z");
  const noteBox = createNoteBox({
    local,
    transport,
    connectivity,
    clock,
    ids: new SequentialIds("note"),
    timeZone: "America/La_Paz",
  });
  return { connectivity, transport, local, clock, noteBox };
};

describe("createNoteBox", () => {
  it("rejects a note with no text", async () => {
    const { noteBox } = setup(true);

    await expect(noteBox.save("   ")).rejects.toThrow(EmptyNoteError);
  });

  it("gives the note a client ID and a capture time in the tenant time zone", async () => {
    const { noteBox } = setup(false);

    const note = await noteBox.save("  call the bank  ");

    expect(note).toEqual({
      noteId: "note-1",
      text: "call the bank",
      capturedAt: "2026-10-28T09:00:00.000-04:00",
      syncState: "pending",
    });
  });

  it("sends the note at once when online", async () => {
    const { noteBox, transport } = setup(true);

    const note = await noteBox.save("call the bank");

    expect(transport.sent.map((sent) => sent.noteId)).toEqual([note.noteId]);
    expect((await noteBox.list())[0]?.syncState).toBe("synced");
  });

  it("keeps the note pending when the send fails, and sends it on the next sync", async () => {
    const { noteBox, transport } = setup(true);
    transport.failures.push(new Error("502 from server"));

    await noteBox.save("call the bank");
    expect((await noteBox.list())[0]?.syncState).toBe("pending");

    await noteBox.sync();
    expect((await noteBox.list())[0]?.syncState).toBe("synced");
  });

  it("sends the oldest note first, and sends each note once when syncs overlap", async () => {
    const { noteBox, transport, connectivity, clock } = setup(false);
    await noteBox.save("first");
    clock.advanceMinutes(1);
    await noteBox.save("second");

    await connectivity.goOnline();
    await Promise.all([noteBox.sync(), noteBox.sync()]);

    expect(transport.sent.map((note) => note.text)).toEqual(["first", "second"]);
  });

  it("lists the newest note first", async () => {
    const { noteBox, clock } = setup(false);
    await noteBox.save("first");
    clock.advanceMinutes(1);
    await noteBox.save("second");

    expect((await noteBox.list()).map((note) => note.text)).toEqual(["second", "first"]);
  });

  it("tells listeners when the notes change", async () => {
    const { noteBox } = setup(true);
    let changes = 0;
    noteBox.onChange(() => {
      changes += 1;
    });

    await noteBox.save("call the bank");

    expect(changes).toBeGreaterThanOrEqual(2);
  });
});
