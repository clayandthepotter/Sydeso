import { NotBuiltError, type Clock, type IdGenerator } from "@desk/domain";

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

/** Sends one note to desk-api. It is safe to retry. */
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
  list(): Promise<readonly LocalNote[]>;
  /** Sends each pending note. */
  sync(): Promise<void>;
}

export function createNoteBox(_deps: NoteBoxDeps): NoteBox {
  const notBuilt = (): never => {
    throw new NotBuiltError("desk web note box", 2);
  };
  return { save: async () => notBuilt(), list: async () => notBuilt(), sync: async () => notBuilt() };
}
