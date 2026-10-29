import {
  parseEvent,
  type AnyEvent,
  type AppendResult,
  type EventStorePort,
  type EventType,
  type InboxPort,
  type RawStorePort,
} from "@desk/domain";

interface EventRow {
  id: string;
  tenant_id: string;
  type: string;
  version: number;
  occurred_at: string;
  source: string;
  payload: string;
  correlation_id: string | null;
  causation_id: string | null;
}

const toEvent = (row: EventRow): AnyEvent => {
  const result = parseEvent({
    id: row.id,
    tenantId: row.tenant_id,
    type: row.type,
    version: row.version,
    occurredAt: row.occurred_at,
    source: row.source,
    payload: JSON.parse(row.payload),
    ...(row.correlation_id !== null && { correlationId: row.correlation_id }),
    ...(row.causation_id !== null && { causationId: row.causation_id }),
  });
  if (!result.ok) throw new Error(`Stored event ${row.id} is not valid: ${result.errors.join("; ")}`);
  return result.event;
};

/** The append only event log in D1, scoped to one tenant. */
export class D1EventStore implements EventStorePort {
  constructor(
    private readonly db: D1Database,
    private readonly tenantId: string,
  ) {}

  async append(event: AnyEvent): Promise<AppendResult> {
    if (event.tenantId !== this.tenantId) throw new Error("Event belongs to another tenant");
    const result = await this.db
      .prepare(
        `INSERT OR IGNORE INTO events (id, tenant_id, type, version, occurred_at, source, payload, correlation_id, causation_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        event.id,
        event.tenantId,
        event.type,
        event.version,
        event.occurredAt,
        event.source,
        JSON.stringify(event.payload),
        event.correlationId ?? null,
        event.causationId ?? null,
      )
      .run();
    return result.meta.changes === 1 ? "appended" : "duplicate";
  }

  async byType<T extends EventType>(type: T): Promise<ReadonlyArray<Extract<AnyEvent, { type: T }>>> {
    const rows = await this.db
      .prepare("SELECT * FROM events WHERE tenant_id = ? AND type = ? ORDER BY seq")
      .bind(this.tenantId, type)
      .all<EventRow>();
    return rows.results.map(toEvent) as Array<Extract<AnyEvent, { type: T }>>;
  }

  async all(): Promise<readonly AnyEvent[]> {
    const rows = await this.db.prepare("SELECT * FROM events WHERE tenant_id = ? ORDER BY seq").bind(this.tenantId).all<EventRow>();
    return rows.results.map(toEvent);
  }
}

export class D1Inbox implements InboxPort {
  constructor(
    private readonly db: D1Database,
    private readonly now: () => Date,
  ) {}

  async hasProcessed(consumer: string, eventId: string): Promise<boolean> {
    const row = await this.db
      .prepare("SELECT 1 AS seen FROM processed_events WHERE consumer = ? AND event_id = ?")
      .bind(consumer, eventId)
      .first();
    return row !== null;
  }

  async markProcessed(consumer: string, eventId: string): Promise<boolean> {
    const result = await this.db
      .prepare("INSERT OR IGNORE INTO processed_events (consumer, event_id, processed_at) VALUES (?, ?, ?)")
      .bind(consumer, eventId, this.now().toISOString())
      .run();
    return result.meta.changes === 1;
  }
}

/** Raw notes and emails in the desk-raw R2 bucket. */
export class R2RawStore implements RawStorePort {
  constructor(private readonly bucket: R2Bucket) {}

  async put(key: string, body: string): Promise<void> {
    await this.bucket.put(key, body, { httpMetadata: { contentType: "application/json" } });
  }

  async get(key: string): Promise<string | null> {
    const object = await this.bucket.get(key);
    return object ? object.text() : null;
  }
}
