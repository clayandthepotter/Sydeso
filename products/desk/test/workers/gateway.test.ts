import { createApp, type AppEnv } from "@desk/gateway";
import { sha256Hex } from "@desk/identity";
import { FakePasskeyVerifier } from "@desk/testing/passkeys";
import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";

const ORIGIN = "https://desk.sydeso.com";
let now = new Date("2026-10-28T13:00:00.000Z");
const clock = { now: () => new Date(now) };

/** A fake queue that keeps what it gets. */
export const recordingQueue = () => {
  const messages: unknown[] = [];
  const queue = {
    messages,
    send: async (body: unknown) => void messages.push(body),
    sendBatch: async (batch: Iterable<MessageSendRequest>) => {
      for (const message of batch) messages.push(message.body);
    },
  };
  return queue as unknown as Queue & { messages: unknown[] };
};

const triageQueue = recordingQueue();
const plannerQueue = recordingQueue();

const appEnv: AppEnv = {
  DB: env.DB,
  RAW: env.RAW,
  TRIAGE_QUEUE: triageQueue,
  PLANNER_QUEUE: plannerQueue,
  DESK_SECRETS_KEY: btoa(String.fromCharCode(...new Uint8Array(32).fill(7))),
  APP_ORIGIN: ORIGIN,
  SESSION_TTL_DAYS: "30",
  CHALLENGE_TTL_MINUTES: "5",
  DEFAULT_CONFIDENCE_THRESHOLD: "0.7",
};

const app = createApp({ env: appEnv, clock, verifier: new FakePasskeyVerifier() });

// Storage is shared across tests in this file. Each test uses its own emails, codes, and passkeys.
let unique = 0;
const next = (label: string) => `${label}-${++unique}`;

const call = (method: string, path: string, options: { body?: unknown; cookie?: string; origin?: string | null } = {}) => {
  const headers = new Headers();
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (options.cookie) headers.set("Cookie", options.cookie);
  if (options.origin !== null) headers.set("Origin", options.origin ?? ORIGIN);
  return app.fetch(
    new Request(`${ORIGIN}${path}`, {
      method,
      headers,
      ...(options.body !== undefined && { body: JSON.stringify(options.body) }),
    }),
  );
};

const seedInvite = async (options: { email?: string; expiresAt?: string } = {}) => {
  const code = next("invite-code");
  await env.DB.prepare("INSERT INTO invites (code_hash, email, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .bind(await sha256Hex(code), options.email ?? null, now.toISOString(), options.expiresAt ?? "2026-12-31T00:00:00.000Z")
    .run();
  return code;
};

const cookieFrom = (response: Response) => {
  const header = response.headers.get("Set-Cookie") ?? "";
  return header.split(";")[0] ?? "";
};

const signUp = async (email = `${next("person")}@example.com`) => {
  const inviteCode = await seedInvite();
  const credentialId = next("credential");
  const options = await call("POST", "/api/auth/register/options", {
    body: { inviteCode, email, displayName: "Test Person", timeZone: "America/La_Paz" },
  });
  const { challengeId, options: webauthn } = (await options.json()) as { challengeId: string; options: { challenge: string } };
  const verify = await call("POST", "/api/auth/register/verify", {
    body: { challengeId, response: { credentialId, challenge: webauthn.challenge } },
  });
  expect(verify.status).toBe(200);
  return { cookie: cookieFrom(verify), credentialId, email, inviteCode };
};

beforeEach(() => {
  now = new Date("2026-10-28T13:00:00.000Z");
});

describe("Sign-up needs an invite", () => {
  it("makes a tenant, a user, and a session from a valid invite and a passkey", async () => {
    const { cookie, email } = await signUp();

    expect(cookie).toMatch(/^__Host-desk_session=.+/);
    const me = await call("GET", "/api/me", { cookie });
    expect(me.status).toBe(200);
    expect(await me.json()).toEqual({ user: { email, displayName: "Test Person", timeZone: "America/La_Paz" } });
  });

  it("sets a secure, HttpOnly session cookie", async () => {
    const inviteCode = await seedInvite();
    const options = await call("POST", "/api/auth/register/options", {
      body: { inviteCode, email: `${next("p")}@example.com`, displayName: "P", timeZone: "UTC" },
    });
    const { challengeId, options: webauthn } = (await options.json()) as { challengeId: string; options: { challenge: string } };
    const verify = await call("POST", "/api/auth/register/verify", {
      body: { challengeId, response: { credentialId: next("c"), challenge: webauthn.challenge } },
    });

    const header = verify.headers.get("Set-Cookie") ?? "";
    expect(header).toContain("HttpOnly");
    expect(header).toContain("Secure");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Path=/");
  });

  it("stores a TenantCreated event for the new tenant", async () => {
    const { email } = await signUp();

    const row = await env.DB.prepare(
      "SELECT e.type, e.source FROM events e JOIN users u ON u.tenant_id = e.tenant_id WHERE u.email = ?",
    )
      .bind(email)
      .first();
    expect(row).toEqual({ type: "TenantCreated", source: "identity" });
  });

  it("rejects an unknown invite code", async () => {
    const response = await call("POST", "/api/auth/register/options", {
      body: { inviteCode: "not-a-real-code", email: "a@example.com", displayName: "A", timeZone: "UTC" },
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "invite_invalid" });
  });

  it("lets an invite work only once", async () => {
    const { inviteCode } = await signUp();

    const again = await call("POST", "/api/auth/register/options", {
      body: { inviteCode, email: `${next("other")}@example.com`, displayName: "B", timeZone: "UTC" },
    });

    expect(again.status).toBe(403);
  });

  it("rejects an expired invite", async () => {
    const inviteCode = await seedInvite({ expiresAt: "2026-10-01T00:00:00.000Z" });

    const response = await call("POST", "/api/auth/register/options", {
      body: { inviteCode, email: `${next("x")}@example.com`, displayName: "X", timeZone: "UTC" },
    });

    expect(response.status).toBe(403);
  });

  it("rejects an invite for another email", async () => {
    const inviteCode = await seedInvite({ email: "only.this@example.com" });

    const response = await call("POST", "/api/auth/register/options", {
      body: { inviteCode, email: "someone.else@example.com", displayName: "S", timeZone: "UTC" },
    });

    expect(response.status).toBe(403);
  });

  it("rejects an email that has an account", async () => {
    const { email } = await signUp();
    const inviteCode = await seedInvite();

    const response = await call("POST", "/api/auth/register/options", {
      body: { inviteCode, email: email.toUpperCase(), displayName: "Copy", timeZone: "UTC" },
    });

    expect(response.status).toBe(409);
  });

  it("rejects a passkey response with the wrong challenge, and the challenge works only once", async () => {
    const inviteCode = await seedInvite();
    const options = await call("POST", "/api/auth/register/options", {
      body: { inviteCode, email: `${next("w")}@example.com`, displayName: "W", timeZone: "UTC" },
    });
    const { challengeId } = (await options.json()) as { challengeId: string };

    const wrong = await call("POST", "/api/auth/register/verify", {
      body: { challengeId, response: { credentialId: next("c"), challenge: "wrong" } },
    });
    const reused = await call("POST", "/api/auth/register/verify", {
      body: { challengeId, response: { credentialId: next("c"), challenge: "wrong" } },
    });

    expect(wrong.status).toBe(401);
    expect(reused.status).toBe(400);
  });

  it("rejects an expired challenge", async () => {
    const inviteCode = await seedInvite();
    const options = await call("POST", "/api/auth/register/options", {
      body: { inviteCode, email: `${next("late")}@example.com`, displayName: "L", timeZone: "UTC" },
    });
    const { challengeId, options: webauthn } = (await options.json()) as { challengeId: string; options: { challenge: string } };
    now = new Date(now.getTime() + 6 * 60_000);

    const verify = await call("POST", "/api/auth/register/verify", {
      body: { challengeId, response: { credentialId: next("c"), challenge: webauthn.challenge } },
    });

    expect(verify.status).toBe(400);
    expect(await verify.json()).toEqual({ error: "challenge_expired" });
  });

  it("rejects an unknown time zone", async () => {
    const inviteCode = await seedInvite();

    const response = await call("POST", "/api/auth/register/options", {
      body: { inviteCode, email: `${next("tz")}@example.com`, displayName: "T", timeZone: "Mars/Olympus" },
    });

    expect(response.status).toBe(400);
  });
});

describe("Sign-in with a passkey", () => {
  const login = async (credentialId: string) => {
    const options = await call("POST", "/api/auth/login/options", { body: {} });
    const { challengeId, options: webauthn } = (await options.json()) as { challengeId: string; options: { challenge: string } };
    return call("POST", "/api/auth/login/verify", {
      body: { challengeId, response: { credentialId, challenge: webauthn.challenge } },
    });
  };

  it("gives a new session for a known passkey", async () => {
    const { credentialId, email } = await signUp();

    const response = await login(credentialId);

    expect(response.status).toBe(200);
    const me = await call("GET", "/api/me", { cookie: cookieFrom(response) });
    expect(((await me.json()) as { user: { email: string } }).user.email).toBe(email);
  });

  it("rejects an unknown passkey", async () => {
    const response = await login("never-registered");

    expect(response.status).toBe(401);
  });

  it("ends the session on sign-out", async () => {
    const { cookie } = await signUp();

    await call("POST", "/api/auth/logout", { cookie, body: {} });

    expect((await call("GET", "/api/me", { cookie })).status).toBe(401);
  });

  it("ends the session when it expires", async () => {
    const { cookie } = await signUp();
    now = new Date(now.getTime() + 31 * 24 * 60 * 60_000);

    expect((await call("GET", "/api/me", { cookie })).status).toBe(401);
  });
});

describe("Notes API", () => {
  const note = (noteId: string, text = "call the bank") => ({
    noteId,
    text,
    capturedAt: "2026-10-28T09:00:00.000-04:00",
  });

  it("needs a session", async () => {
    expect((await call("POST", "/api/notes", { body: note("n1") })).status).toBe(401);
    expect((await call("GET", "/api/notes")).status).toBe(401);
  });

  it("blocks a state change from another origin", async () => {
    const { cookie } = await signUp();

    const response = await call("POST", "/api/notes", { cookie, body: note("n1"), origin: "https://evil.example" });

    expect(response.status).toBe(403);
  });

  it("blocks a state change with no origin", async () => {
    const { cookie } = await signUp();

    expect((await call("POST", "/api/notes", { cookie, body: note("n1"), origin: null })).status).toBe(403);
  });

  it("stores a note once and ignores a duplicate note ID", async () => {
    const { cookie } = await signUp();

    const first = await call("POST", "/api/notes", { cookie, body: note("n1") });
    const second = await call("POST", "/api/notes", { cookie, body: note("n1", "changed") });

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual({ outcome: "duplicate" });
    const list = (await (await call("GET", "/api/notes", { cookie })).json()) as { notes: Array<{ text: string }> };
    expect(list.notes.map((row) => row.text)).toEqual(["call the bank"]);
  });

  it("rejects a note that is not valid", async () => {
    const { cookie } = await signUp();

    const response = await call("POST", "/api/notes", { cookie, body: { noteId: "n1", text: "" } });

    expect(response.status).toBe(400);
  });

  it("rejects a body that is too large", async () => {
    const { cookie } = await signUp();

    const response = await call("POST", "/api/notes", { cookie, body: note("big", "x".repeat(70 * 1024)) });

    expect(response.status).toBe(413);
  });

  it("keeps each tenant's notes apart, even with the same client note ID", async () => {
    const alice = await signUp();
    const bob = await signUp();

    await call("POST", "/api/notes", { cookie: alice.cookie, body: note("same-id", "alice note") });
    const bobWrite = await call("POST", "/api/notes", { cookie: bob.cookie, body: note("same-id", "bob note") });

    expect(bobWrite.status).toBe(201);
    const aliceNotes = (await (await call("GET", "/api/notes", { cookie: alice.cookie })).json()) as {
      notes: Array<{ text: string }>;
    };
    const bobNotes = (await (await call("GET", "/api/notes", { cookie: bob.cookie })).json()) as {
      notes: Array<{ text: string }>;
    };
    expect(aliceNotes.notes.map((row) => row.text)).toEqual(["alice note"]);
    expect(bobNotes.notes.map((row) => row.text)).toEqual(["bob note"]);
  });

  it("sends each captured note to the triage queue, and sends it again on a retry", async () => {
    const { cookie } = await signUp();
    const before = triageQueue.messages.length;

    await call("POST", "/api/notes", { cookie, body: note("queued-1") });
    await call("POST", "/api/notes", { cookie, body: note("queued-1") });

    const sent = triageQueue.messages.slice(before) as Array<{ type: string; payload: { noteId: string } }>;
    expect(sent.map((event) => [event.type, event.payload.noteId])).toEqual([
      ["NoteCaptured", "queued-1"],
      ["NoteCaptured", "queued-1"],
    ]);
  });

  it("keeps the raw note in R2", async () => {
    const { cookie, email } = await signUp();
    await call("POST", "/api/notes", { cookie, body: note("raw-1") });

    const user = await env.DB.prepare("SELECT tenant_id FROM users WHERE email = ?").bind(email).first<{ tenant_id: string }>();
    const object = await env.RAW.get(`notes/${user?.tenant_id}/raw-1.json`);
    expect(JSON.parse((await object?.text()) ?? "{}")).toMatchObject({ noteId: "raw-1" });
  });
});

describe("Routing", () => {
  it("returns 404 JSON for an unknown API path", async () => {
    const response = await call("GET", "/api/nothing");

    expect(response.status).toBe(404);
  });

  it("does not cache API responses", async () => {
    const response = await call("GET", "/api/health");

    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
