import { toOffsetIso, type Clock, type IdGenerator } from "@desk/domain";

export type SyncState = "pending" | "synced";

/** A note as the device stores it. The device sets the note ID. */
export interface LocalNote {
  readonly noteId: string;
  readonly text: string;
  readonly capturedAt: string;
  readonly syncState: SyncState;
}

/** IndexedDB in the browser. */
export interface LocalNoteStore {
  put(note: LocalNote): Promise<void>;
  list(): Promise<readonly LocalNote[]>;
}

/** Sends one note to desk-api. It is safe to retry, because the server ignores a duplicate note ID. */
export interface SyncTransport {
  send(note: LocalNote): Promise<void>;
}

export interface Connectivity {
  isOnline(): boolean;
  onOnline(listener: () => void): void;
}

export interface NoteBoxDeps {
  readonly local: LocalNoteStore;
  readonly transport: SyncTransport;
  readonly connectivity: Connectivity;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly timeZone: string;
}

export interface NoteBox {
  /** Saves on the device first. Sends now if online, or later. */
  save(text: string): Promise<LocalNote>;
  /** Newest first. */
  list(): Promise<readonly LocalNote[]>;
  /** Sends each pending note, oldest first. Stops at the first failure. */
  sync(): Promise<void>;
  onChange(listener: () => void): void;
}

export class EmptyNoteError extends Error {
  override readonly name = "EmptyNoteError";

  constructor() {
    super("A note must have text.");
  }
}

const byCapturedAt = (a: LocalNote, b: LocalNote) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt);

export function createNoteBox(deps: NoteBoxDeps): NoteBox {
  const listeners: Array<() => void> = [];
  const changed = () => listeners.forEach((listener) => listener());
  let running: Promise<void> | null = null;

  const sendPending = async () => {
    const pending = (await deps.local.list()).filter((note) => note.syncState === "pending").sort(byCapturedAt);
    for (const note of pending) {
      if (!deps.connectivity.isOnline()) return;
      try {
        await deps.transport.send(note);
      } catch {
        // The note stays pending. The next sync tries again.
        return;
      }
      await deps.local.put({ ...note, syncState: "synced" });
      changed();
    }
  };

  /** One sync at a time. A call during a sync waits for it. */
  const sync = async () => {
    running ??= sendPending().finally(() => {
      running = null;
    });
    return running;
  };

  deps.connectivity.onOnline(() => sync());

  return {
    async save(text) {
      const trimmed = text.trim();
      if (trimmed.length === 0) throw new EmptyNoteError();
      const note: LocalNote = {
        noteId: deps.ids.next(),
        text: trimmed,
        capturedAt: toOffsetIso(deps.clock.now(), deps.timeZone),
        syncState: "pending",
      };
      await deps.local.put(note);
      changed();
      if (deps.connectivity.isOnline()) await sync();
      return note;
    },
    async list() {
      return [...(await deps.local.list())].sort((a, b) => byCapturedAt(b, a));
    },
    sync,
    onChange(listener) {
      listeners.push(listener);
    },
  };
}
