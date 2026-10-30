import { createApp, type AppEnv } from "@desk/gateway";
import { sha256Hex } from "@desk/identity";
import { FakePasskeyVerifier } from "@desk/testing/passkeys";
import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";

const ORIGIN = "https://desk.sydeso.com";
let now = new Date("2026-10-30T13:00:00.000Z");
const clock = { now: () => new Date(now) };

const queue = () =>
  ({ send: async () => undefined, sendBatch: async () => undefined }) as unknown as Queue;

const appEnv: AppEnv = {
  DB: env.DB,
  RAW: env.RAW,
  TRIAGE_QUEUE: queue(),
  PLANNER_QUEUE: queue(),
  DESK_SECRETS_KEY: btoa(String.fromCharCode(...new Uint8Array(32).fill(5))),
  APP_ORIGIN: ORIGIN,
  SESSION_TTL_DAYS: "30",
  CHALLENGE_TTL_MINUTES: "5",
  DEFAULT_CONFIDENCE_THRESHOLD: "0.7",
  DEVICE_LINK_TTL_MINUTES: "15",
};

const app = createApp({ env: appEnv, clock, verifier: new FakePasskeyVerifier() });

const call = (method: string, path: string, options: { body?: unknown; cookie?: string } = {}) =>
  app.fetch(
    new Request(`${ORIGIN}${path}`, {
      method,
      headers: {
        Origin: ORIGIN,
        ...(options.cookie && { Cookie: options.cookie }),
        ...(options.body !== undefined && { "Content-Type": "application/json" }),
      },
      ...(options.body !== undefined && { body: JSON.stringify(options.body) }),
    }),
  );

const cookieOf = (response: Response) => (response.headers.get("Set-Cookie") ?? "").split(";")[0] ?? "";

let unique = 0;
const next = (label: string) => `${label}-${++unique}`;

const signUp = async () => {
  const code = next("device-invite");
  await env.DB.prepare("INSERT INTO invites (code_hash, created_at, expires_at) VALUES (?, ?, ?)")
    .bind(await sha256Hex(code), now.toISOString(), "2026-12-31T00:00:00.000Z")
    .run();
  const email = `${next("device-person")}@example.com`;
  const options = await call("POST", "/api/auth/register/options", {
    body: { inviteCode: code, email, displayName: "D", timeZone: "America/La_Paz" },
  });
  const { challengeId, options: webauthn } = (await options.json()) as { challengeId: string; options: { challenge: string } };
  const verify = await call("POST", "/api/auth/register/verify", {
    body: { challengeId, response: { credentialId: next("desktop-cred"), challenge: webauthn.challenge } },
  });
  return { cookie: cookieOf(verify), email };
};

const addDevice = async (code: string, credentialId = next("phone-cred")) => {
  const options = await call("POST", "/api/auth/device/options", { body: { code } });
  if (options.status !== 200) return { status: options.status, body: await options.json(), cookie: "", credentialId };
  const { challengeId, options: webauthn } = (await options.json()) as { challengeId: string; options: { challenge: string } };
  const verify = await call("POST", "/api/auth/device/verify", {
    body: { challengeId, response: { credentialId, challenge: webauthn.challenge } },
  });
  return { status: verify.status, body: await verify.json(), cookie: cookieOf(verify) as string, credentialId };
};

const linkCode = async (cookie: string) => {
  const response = await call("POST", "/api/devices/link", { cookie, body: {} });
  expect(response.status).toBe(200);
  const body = (await response.json()) as { url: string; expiresAt: string };
  return { ...body, code: new URL(body.url).searchParams.get("code") ?? "" };
};

beforeEach(() => {
  now = new Date("2026-10-30T13:00:00.000Z");
});

describe("Add a device", () => {
  it("needs a session to make a link", async () => {
    expect((await call("POST", "/api/devices/link", { body: {} })).status).toBe(401);
  });

  it("makes a link that works for the configured time", async () => {
    const { cookie } = await signUp();

    const link = await linkCode(cookie);

    expect(link.url).toMatch(/^https:\/\/desk\.sydeso\.com\/link\?code=.+/);
    expect(link.expiresAt).toBe("2026-10-30T13:15:00.000Z");
  });

  it("adds a passkey on the new device and signs it in to the same account", async () => {
    const { cookie, email } = await signUp();
    const { code } = await linkCode(cookie);

    const phone = await addDevice(code);

    expect(phone.status).toBe(200);
    const me = (await (await call("GET", "/api/me", { cookie: phone.cookie })).json()) as { user: { email: string } };
    expect(me.user.email).toBe(email);
  });

  it("lets the new passkey sign in later", async () => {
    const { cookie, email } = await signUp();
    const { code } = await linkCode(cookie);
    const phone = await addDevice(code);

    const options = await call("POST", "/api/auth/login/options", { body: {} });
    const { challengeId, options: webauthn } = (await options.json()) as { challengeId: string; options: { challenge: string } };
    const login = await call("POST", "/api/auth/login/verify", {
      body: { challengeId, response: { credentialId: phone.credentialId, challenge: webauthn.challenge } },
    });

    expect(login.status).toBe(200);
    expect(((await login.json()) as { user: { email: string } }).user.email).toBe(email);
  });

  it("works only once", async () => {
    const { cookie } = await signUp();
    const { code } = await linkCode(cookie);
    await addDevice(code);

    const again = await addDevice(code);

    expect(again.status).toBe(403);
    expect(again.body).toEqual({ error: "link_invalid" });
  });

  it("stops working after it expires", async () => {
    const { cookie } = await signUp();
    const { code } = await linkCode(cookie);
    now = new Date(now.getTime() + 16 * 60_000);

    expect((await addDevice(code)).status).toBe(403);
  });

  it("does not accept an invite code", async () => {
    const inviteCode = next("not-a-link");
    await env.DB.prepare("INSERT INTO invites (code_hash, created_at, expires_at) VALUES (?, ?, ?)")
      .bind(await sha256Hex(inviteCode), now.toISOString(), "2026-12-31T00:00:00.000Z")
      .run();

    expect((await addDevice(inviteCode)).status).toBe(403);
  });

  it("does not let one link be used by two devices at the same time", async () => {
    const { cookie } = await signUp();
    const { code } = await linkCode(cookie);
    const startA = await call("POST", "/api/auth/device/options", { body: { code } });
    const startB = await call("POST", "/api/auth/device/options", { body: { code } });
    const a = (await startA.json()) as { challengeId: string; options: { challenge: string } };
    const b = (await startB.json()) as { challengeId: string; options: { challenge: string } };

    const finishA = await call("POST", "/api/auth/device/verify", {
      body: { challengeId: a.challengeId, response: { credentialId: next("a"), challenge: a.options.challenge } },
    });
    const finishB = await call("POST", "/api/auth/device/verify", {
      body: { challengeId: b.challengeId, response: { credentialId: next("b"), challenge: b.options.challenge } },
    });

    expect(finishA.status).toBe(200);
    expect(finishB.status).toBe(403);
  });

  it("does not finish an invite sign-up with a device challenge", async () => {
    const { cookie } = await signUp();
    const { code } = await linkCode(cookie);
    const options = await call("POST", "/api/auth/device/options", { body: { code } });
    const { challengeId, options: webauthn } = (await options.json()) as { challengeId: string; options: { challenge: string } };

    const response = await call("POST", "/api/auth/register/verify", {
      body: { challengeId, response: { credentialId: next("cross"), challenge: webauthn.challenge } },
    });

    expect(response.status).toBe(403);
  });

  it("keeps the existing passkey working", async () => {
    const { cookie } = await signUp();
    const { code } = await linkCode(cookie);
    await addDevice(code);

    expect((await call("GET", "/api/me", { cookie })).status).toBe(200);
  });
});
