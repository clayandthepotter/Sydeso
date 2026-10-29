import { FakeRawStore, FixedClock, InMemoryEventStore } from "@desk/testing";
import { describe, expect, it } from "vitest";
import { InvalidNoteError, createCapture, type NoteView, type NotesReadModel } from "../src/index.js";

class FakeNotes implements NotesReadModel {
  readonly rows = new Map<string, NoteView>();

  async add(note: NoteView) {
    if (!this.rows.has(note.noteId)) this.rows.set(note.noteId, note);
  }

  async list() {
    return [...this.rows.values()];
  }
}

const setup = (tenantId = "tenant-a") => {
  const store = new InMemoryEventStore();
  const notes = new FakeNotes();
  const raw = new FakeRawStore();
  const capture = createCapture({ tenantId, store, notes, raw, clock: new FixedClock("2026-10-28T13:00:00Z") });
  return { store, notes, raw, capture };
};

const command = { noteId: "n1", text: "call the bank", capturedAt: "2026-10-28T09:00:00.000-04:00" };

describe("createCapture", () => {
  it("stores a NoteCaptured event for the tenant", async () => {
    const { capture, store } = setup();

    expect(await capture.captureNote(command)).toBe("appended");

    const [event] = await store.byType("NoteCaptured");
    expect(event).toMatchObject({ id: "note/tenant-a/n1", tenantId: "tenant-a", source: "capture", payload: command });
  });

  it("ignores a duplicate note ID", async () => {
    const { capture, store, notes } = setup();

    await capture.captureNote(command);
    expect(await capture.captureNote({ ...command, text: "changed" })).toBe("duplicate");

    expect(await store.byType("NoteCaptured")).toHaveLength(1);
    expect(notes.rows.get("n1")?.text).toBe("call the bank");
  });

  it("keeps the raw note in R2 under the tenant", async () => {
    const { capture, raw } = setup();

    await capture.captureNote(command);

    expect(JSON.parse((await raw.get("notes/tenant-a/n1.json")) ?? "{}")).toEqual(command);
  });

  it.each([
    ["no text", { ...command, text: "" }],
    ["no note ID", { ...command, noteId: "" }],
    ["a time without an offset", { ...command, capturedAt: "2026-10-28 09:00" }],
    ["not an object", "call the bank"],
  ])("rejects a note with %s", async (_label, input) => {
    const { capture, store } = setup();

    await expect(capture.captureNote(input)).rejects.toThrow(InvalidNoteError);
    expect(await store.all()).toEqual([]);
  });
});
