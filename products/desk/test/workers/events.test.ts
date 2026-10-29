import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

// Storage is shared across tests in this file, and the log is append only.
// So each test uses its own event IDs.

const insertEvent = (id: string) =>
  env.DB.prepare(
    `INSERT OR IGNORE INTO events (id, tenant_id, type, version, occurred_at, source, payload)
     VALUES (?, 'tenant-a', 'NoteCaptured', 1, '2026-10-28T13:00:00.000Z', 'capture', ?)`,
  ).bind(id, JSON.stringify({ noteId: "note-1", text: "call the bank" }));

describe("events table", () => {
  it("stores an event once and ignores a duplicate ID", async () => {
    const first = await insertEvent("evt-dup").run();
    const second = await insertEvent("evt-dup").run();

    expect(first.meta.changes).toBe(1);
    expect(second.meta.changes).toBe(0);
    const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM events WHERE id = 'evt-dup'").first<{
      n: number;
    }>();
    expect(count?.n).toBe(1);
  });

  it("gives each event a sequence number in append order", async () => {
    await env.DB.batch([insertEvent("evt-a"), insertEvent("evt-b")]);

    const rows = await env.DB.prepare("SELECT id FROM events WHERE id IN ('evt-a', 'evt-b') ORDER BY seq").all<{
      id: string;
    }>();
    expect(rows.results.map((row) => row.id)).toEqual(["evt-a", "evt-b"]);
  });

  it("blocks UPDATE because the log is append only", async () => {
    await insertEvent("evt-upd").run();

    await expect(env.DB.prepare("UPDATE events SET type = 'X' WHERE id = 'evt-upd'").run()).rejects.toThrow(
      /append only/,
    );
  });

  it("blocks DELETE because the log is append only", async () => {
    await insertEvent("evt-del").run();

    await expect(env.DB.prepare("DELETE FROM events WHERE id = 'evt-del'").run()).rejects.toThrow(/append only/);
  });

  it("requires a tenant", async () => {
    await expect(
      env.DB.prepare(
        `INSERT INTO events (id, type, version, occurred_at, source, payload)
         VALUES ('evt-nt', 'NoteCaptured', 1, '2026-10-28T13:00:00.000Z', 'capture', '{}')`,
      ).run(),
    ).rejects.toThrow(/NOT NULL/);
  });

  it("rejects a payload that is not JSON", async () => {
    await expect(
      env.DB.prepare(
        `INSERT INTO events (id, tenant_id, type, version, occurred_at, source, payload)
         VALUES ('evt-x', 'tenant-a', 'NoteCaptured', 1, '2026-10-28T13:00:00.000Z', 'capture', 'not json')`,
      ).run(),
    ).rejects.toThrow();
  });
});

describe("processed_events table", () => {
  it("records a consumer and event ID pair once", async () => {
    const mark = () =>
      env.DB.prepare(
        `INSERT OR IGNORE INTO processed_events (consumer, event_id, processed_at)
         VALUES ('desk-triage', 'evt-1', '2026-10-28T13:00:00.000Z')`,
      ).run();

    expect((await mark()).meta.changes).toBe(1);
    expect((await mark()).meta.changes).toBe(0);
  });
});

describe("read models", () => {
  it("creates each read model table", async () => {
    const rows = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE '\\_%' ESCAPE '\\' ORDER BY name",
    ).all<{ name: string }>();

    expect(rows.results.map((row) => row.name)).toEqual(
      expect.arrayContaining([
        "auth_challenges",
        "events",
        "invites",
        "items",
        "mirror_events",
        "notes",
        "passkeys",
        "processed_events",
        "review_queue",
        "sessions",
        "tenants",
        "time_blocks",
        "users",
      ]),
    );
  });

  it("keeps one mirror event per tenant and iCalUID", async () => {
    const upsert = (sequence: number, start: string, tenant = "tenant-a") =>
      env.DB.prepare(
        `INSERT INTO mirror_events (tenant_id, ical_uid, sequence, calendar_event_id, title, start_at, end_at, last_event_id)
         VALUES (?, 'uid-1', ?, 'gcal-1', 'Busy', ?, ?, ?)
         ON CONFLICT (tenant_id, ical_uid) DO UPDATE SET
           sequence = excluded.sequence, start_at = excluded.start_at, end_at = excluded.end_at,
           last_event_id = excluded.last_event_id
         WHERE excluded.sequence > mirror_events.sequence`,
      ).bind(tenant, sequence, start, start, `evt-${tenant}-${sequence}`);

    await upsert(0, "2026-10-30T10:00:00-04:00").run();
    await upsert(1, "2026-10-30T11:00:00-04:00").run();
    await upsert(0, "2026-10-30T09:00:00-04:00").run();
    await upsert(0, "2026-10-30T08:00:00-04:00", "tenant-b").run();

    const rows = await env.DB.prepare("SELECT tenant_id, sequence, start_at FROM mirror_events ORDER BY tenant_id").all();
    expect(rows.results).toEqual([
      { tenant_id: "tenant-a", sequence: 1, start_at: "2026-10-30T11:00:00-04:00" },
      { tenant_id: "tenant-b", sequence: 0, start_at: "2026-10-30T08:00:00-04:00" },
    ]);
  });

  it("allows only the known time block statuses", async () => {
    await expect(
      env.DB.prepare(
        `INSERT INTO time_blocks (tenant_id, time_block_id, item_id, start_at, end_at, status, last_event_id)
         VALUES ('tenant-a', 'tb-1', 'item-1', '2026-10-30T10:00:00-04:00', '2026-10-30T11:00:00-04:00', 'maybe', 'evt-1')`,
      ).run(),
    ).rejects.toThrow();
  });
});
