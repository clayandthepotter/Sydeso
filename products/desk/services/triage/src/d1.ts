import type { AnyEvent, EventEnvelope, LinearState, Priority, ProjectDirectoryPort } from "@desk/domain";

/** The Linear projects that triage can route to, for one tenant. Built from ProjectsSynced. */
export class D1TriageProjects implements ProjectDirectoryPort {
  constructor(
    private readonly db: D1Database,
    private readonly tenantId: string,
  ) {}

  async listProjects(): Promise<readonly string[]> {
    const rows = await this.db
      .prepare("SELECT name FROM triage_projects WHERE tenant_id = ? ORDER BY name")
      .bind(this.tenantId)
      .all<{ name: string }>();
    return rows.results.map((row) => row.name);
  }

  /** Replaces the project list with the one in the event. */
  async apply(event: EventEnvelope<"ProjectsSynced">): Promise<void> {
    await this.db.batch([
      this.db.prepare("DELETE FROM triage_projects WHERE tenant_id = ?").bind(this.tenantId),
      ...event.payload.projects.map((name) =>
        this.db
          .prepare("INSERT OR IGNORE INTO triage_projects (tenant_id, name, last_event_id) VALUES (?, ?, ?)")
          .bind(this.tenantId, name, event.id),
      ),
    ]);
  }
}

/** Keeps the items and review_queue read models up to date. Each step is safe to repeat. */
export class TriageProjection {
  constructor(private readonly db: D1Database) {}

  async apply(event: AnyEvent): Promise<void> {
    const t = event.tenantId;
    switch (event.type) {
      case "ItemsExtracted":
        // D1 rejects an empty batch. A note with no task has nothing to store.
        if (event.payload.items.length === 0) return;
        await this.db.batch(
          event.payload.items.map((item) =>
            this.db
              .prepare(
                `INSERT OR IGNORE INTO items
                 (tenant_id, item_id, source_note_id, action, project, due_date, duration_minutes, priority, confidence, status, last_event_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'extracted', ?)`,
              )
              .bind(
                t,
                item.itemId,
                item.sourceNoteId,
                item.action,
                item.project,
                item.dueDate,
                item.durationMinutes,
                item.priority,
                item.confidence,
                event.id,
              ),
          ),
        );
        return;
      case "ItemRouted":
        await this.db
          .prepare(
            `UPDATE items SET status = 'routed', linear_state = ?, project = ?, last_event_id = ?
             WHERE tenant_id = ? AND item_id = ? AND status = 'extracted'`,
          )
          .bind(event.payload.state, event.payload.item.project, event.id, t, event.payload.item.itemId)
          .run();
        return;
      case "ItemNeedsReview": {
        const { source, reason, item } = event.payload;
        const statements = [
          this.db
            .prepare(
              `INSERT OR IGNORE INTO review_queue (tenant_id, review_id, source_kind, source_id, item_id, reason, detail, created_at, last_event_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .bind(
              t,
              event.id,
              source.kind,
              source.kind === "note" ? source.noteId : source.emailId,
              item?.itemId ?? null,
              reason,
              item ? JSON.stringify(item) : null,
              event.occurredAt,
              event.id,
            ),
        ];
        if (item) {
          statements.push(
            this.db
              .prepare(
                `UPDATE items SET status = 'needs_review', last_event_id = ? WHERE tenant_id = ? AND item_id = ? AND status = 'extracted'`,
              )
              .bind(event.id, t, item.itemId),
          );
        }
        await this.db.batch(statements);
        return;
      }
      case "WorkItemCreated":
        await this.db
          .prepare(
            `UPDATE items SET status = 'created', issue_id = ?, issue_key = ?, linear_state = ?, last_event_id = ?
             WHERE tenant_id = ? AND item_id = ?`,
          )
          .bind(event.payload.issueId, event.payload.issueKey, event.payload.state, event.id, t, event.payload.itemId)
          .run();
        return;
      default:
        return;
    }
  }
}

export interface ItemView {
  readonly itemId: string;
  readonly noteId: string;
  readonly action: string;
  readonly project: string | null;
  readonly dueDate: string | null;
  readonly priority: Priority;
  readonly status: "extracted" | "routed" | "needs_review" | "created";
  readonly state: LinearState | null;
  readonly issueKey: string | null;
  readonly reviewReason: string | null;
}

export interface NoteTriageView {
  readonly noteId: string;
  readonly items: readonly ItemView[];
  /** A review for the whole note, for example when the model declined it. */
  readonly noteReview: string | null;
}

interface ItemRow {
  item_id: string;
  source_note_id: string;
  action: string;
  project: string | null;
  due_date: string | null;
  priority: Priority;
  status: ItemView["status"];
  linear_state: LinearState | null;
  issue_key: string | null;
  reason: string | null;
}

/** Triage results for the given notes of one tenant. */
export async function triageForNotes(db: D1Database, tenantId: string, noteIds: readonly string[]): Promise<Map<string, NoteTriageView>> {
  const views = new Map<string, NoteTriageView>();
  if (noteIds.length === 0) return views;
  const ids = JSON.stringify(noteIds);
  const [items, reviews] = await db.batch<ItemRow | { source_id: string; reason: string }>([
    db
      .prepare(
        `SELECT i.item_id, i.source_note_id, i.action, i.project, i.due_date, i.priority, i.status, i.linear_state, i.issue_key,
                (SELECT r.reason FROM review_queue r WHERE r.tenant_id = i.tenant_id AND r.item_id = i.item_id LIMIT 1) AS reason
         FROM items i
         WHERE i.tenant_id = ? AND i.source_note_id IN (SELECT value FROM json_each(?))
         ORDER BY i.item_id`,
      )
      .bind(tenantId, ids),
    db
      .prepare(
        `SELECT source_id, reason FROM review_queue
         WHERE tenant_id = ? AND source_kind = 'note' AND item_id IS NULL AND source_id IN (SELECT value FROM json_each(?))`,
      )
      .bind(tenantId, ids),
  ]);
  const byNote = new Map<string, ItemView[]>();
  for (const row of (items?.results ?? []) as ItemRow[]) {
    const list = byNote.get(row.source_note_id) ?? [];
    list.push({
      itemId: row.item_id,
      noteId: row.source_note_id,
      action: row.action,
      project: row.project,
      dueDate: row.due_date,
      priority: row.priority,
      status: row.status,
      state: row.linear_state,
      issueKey: row.issue_key,
      reviewReason: row.reason,
    });
    byNote.set(row.source_note_id, list);
  }
  const noteReviews = new Map(
    ((reviews?.results ?? []) as Array<{ source_id: string; reason: string }>).map((row) => [row.source_id, row.reason]),
  );
  for (const noteId of new Set([...byNote.keys(), ...noteReviews.keys()])) {
    views.set(noteId, { noteId, items: byNote.get(noteId) ?? [], noteReview: noteReviews.get(noteId) ?? null });
  }
  return views;
}
