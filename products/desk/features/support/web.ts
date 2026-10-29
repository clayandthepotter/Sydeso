import type { Connectivity, LocalNote, LocalNoteStore, SyncTransport } from "@desk/web";

/** Fakes for the PWA ports. The real adapters use IndexedDB, fetch, and navigator.onLine. */

export class FakeLocalNoteStore implements LocalNoteStore {
  private readonly notes = new Map<string, LocalNote>();

  async put(note: LocalNote): Promise<void> {
    this.notes.set(note.noteId, note);
  }

  async list(): Promise<readonly LocalNote[]> {
    return [...this.notes.values()];
  }
}

export class FakeSyncTransport implements SyncTransport {
  readonly sent: LocalNote[] = [];

  constructor(private readonly connectivity: Connectivity) {}

  async send(note: LocalNote): Promise<void> {
    if (!this.connectivity.isOnline()) throw new Error("Network is offline");
    this.sent.push(note);
  }
}

export class FakeConnectivity implements Connectivity {
  private readonly listeners: Array<() => unknown> = [];

  constructor(private online: boolean) {}

  isOnline(): boolean {
    return this.online;
  }

  onOnline(listener: () => void): void {
    this.listeners.push(listener);
  }

  /** Turns the connection on and waits for each listener to finish. */
  async goOnline(): Promise<void> {
    this.online = true;
    await Promise.all(this.listeners.map((listener) => listener()));
  }
}
