import type { LocalNote, SyncTransport } from "../note-box.js";

export class SignedOutError extends Error {
  override readonly name = "SignedOutError";
}

/** Sends notes to desk-api. The server ignores a note ID that it has. */
export class HttpSyncTransport implements SyncTransport {
  constructor(
    private readonly deviceId: string,
    private readonly onSignedOut: () => void,
  ) {}

  async send(note: LocalNote): Promise<void> {
    const response = await fetch("/api/notes", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId: note.noteId, text: note.text, capturedAt: note.capturedAt, deviceId: this.deviceId }),
    });
    if (response.status === 401) {
      this.onSignedOut();
      throw new SignedOutError("Session ended");
    }
    if (!response.ok) throw new Error(`Sync failed with status ${response.status}`);
  }
}
