import type { NoteView, NotesReadModel } from "./index.js";

interface NoteRow {
  note_id: string;
  text: string;
  captured_at: string;
  device_id: string | null;
}

/** The notes read model in D1, scoped to one tenant. */
export class D1NotesReadModel implements NotesReadModel {
  constructor(
    private readonly db: D1Database,
    private readonly tenantId: string,
  ) {}

  async add(note: NoteView & { readonly rawKey: string; readonly lastEventId: string }): Promise<void> {
    await this.db
      .prepare(
        `INSERT OR IGNORE INTO notes (tenant_id, note_id, text, captured_at, device_id, raw_key, last_event_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(this.tenantId, note.noteId, note.text, note.capturedAt, note.deviceId, note.rawKey, note.lastEventId)
      .run();
  }

  async list(limit: number): Promise<readonly NoteView[]> {
    const rows = await this.db
      .prepare(
        "SELECT note_id, text, captured_at, device_id FROM notes WHERE tenant_id = ? ORDER BY julianday(captured_at) DESC LIMIT ?",
      )
      .bind(this.tenantId, limit)
      .all<NoteRow>();
    return rows.results.map((row) => ({
      noteId: row.note_id,
      text: row.text,
      capturedAt: row.captured_at,
      deviceId: row.device_id,
    }));
  }
}
