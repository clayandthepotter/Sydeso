import { createApp, type AppEnv } from "@desk/gateway";
import { sha256Hex } from "@desk/identity";
import { FakePasskeyVerifier } from "@desk/testing/passkeys";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const ORIGIN = "https://desk.sydeso.com";
const clock = { now: () => new Date("2026-10-28T13:00:00.000Z") };

const recordingQueue = () => {
  const messages: unknown[] = [];
  return {
    messages,
    send: async (body: unknown) => void messages.push(body),
    sendBatch: async (batch: Iterable<MessageSendRequest>) => {
      for (const message of batch) messages.push(message.body);
    },
  } as unknown as Queue & { messages: unknown[] };
};

/** A fake Linear. It knows one key. */
const linearFetch = (teams: Array<{ id: string; name: string }>) =>
  (async (_input: string | URL | Request, init?: RequestInit) => {
    const auth = new Headers(init?.headers).get("Authorization");
    const { query } = JSON.parse(String(init?.body)) as { query: string };
    if (auth !== "lin_api_good_key") return Response.json({ errors: [{ message: "Authentication required" }] });
    if (query.includes("query Teams")) return Response.json({ data: { teams: { nodes: teams } } });
    if (query.includes("TeamSetup")) {
      return Response.json({
        data: {
          team: {
            projects: { nodes: [{ id: "p1", name: "Client Work" }] },
            states: { nodes: [{ id: "s1", name: "Today" }, { id: "s2", name: "Next" }] },
          },
        },
      });
    }
    return Response.json({ errors: [{ message: "unexpected" }] });
  }) as typeof globalThis.fetch;

const setup = (teams: Array<{ id: string; name: string }>) => {
  const triageQueue = recordingQueue();
  const appEnv: AppEnv = {
    DB: env.DB,
    RAW: env.RAW,
    TRIAGE_QUEUE: triageQueue,
    PLANNER_QUEUE: recordingQueue(),
    DESK_SECRETS_KEY: btoa(String.fromCharCode(...new Uint8Array(32).fill(9))),
    APP_ORIGIN: ORIGIN,
    SESSION_TTL_DAYS: "30",
    CHALLENGE_TTL_MINUTES: "5",
    DEFAULT_CONFIDENCE_THRESHOLD: "0.7",
  DEVICE_LINK_TTL_MINUTES: "15",
  };
  const app = createApp({ env: appEnv, clock, verifier: new FakePasskeyVerifier(), fetch: linearFetch(teams) });
  const call = (method: string, path: string, cookie: string, body?: unknown) =>
    app.fetch(
      new Request(`${ORIGIN}${path}`, {
        method,
        headers: { Origin: ORIGIN, Cookie: cookie, ...(body !== undefined && { "Content-Type": "application/json" }) },
        ...(body !== undefined && { body: JSON.stringify(body) }),
      }),
    );
  return { app, call, triageQueue };
};

let unique = 0;
const signUp = async (call: ReturnType<typeof setup>["call"]) => {
  unique += 1;
  const code = `linear-invite-${unique}`;
  await env.DB.prepare("INSERT INTO invites (code_hash, created_at, expires_at) VALUES (?, ?, ?)")
    .bind(await sha256Hex(code), clock.now().toISOString(), "2026-12-31T00:00:00.000Z")
    .run();
  const options = await call("POST", "/api/auth/register/options", "", {
    inviteCode: code,
    email: `linear-${unique}@example.com`,
    displayName: "L",
    timeZone: "America/La_Paz",
  });
  const { challengeId, options: webauthn } = (await options.json()) as { challengeId: string; options: { challenge: string } };
  const verify = await call("POST", "/api/auth/register/verify", "", {
    challengeId,
    response: { credentialId: `linear-cred-${unique}`, challenge: webauthn.challenge },
  });
  return (verify.headers.get("Set-Cookie") ?? "").split(";")[0] ?? "";
};

describe("Connect Linear", () => {
  it("rejects a bad API key", async () => {
    const { call } = setup([{ id: "team-1", name: "Core" }]);
    const cookie = await signUp(call);

    const response = await call("POST", "/api/integrations/linear", cookie, { apiKey: "lin_api_wrong_key" });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "linear_invalid_key" });
  });

  it("asks for a team when the key sees more than one", async () => {
    const { call } = setup([
      { id: "team-1", name: "Core" },
      { id: "team-2", name: "Ops" },
    ]);
    const cookie = await signUp(call);

    const response = await call("POST", "/api/integrations/linear", cookie, { apiKey: "lin_api_good_key" });

    expect(await response.json()).toEqual({ kind: "choose_team", teams: [{ id: "team-1", name: "Core" }, { id: "team-2", name: "Ops" }] });
  });

  it("connects, reports missing states, and sends ProjectsSynced to triage", async () => {
    const { call, triageQueue } = setup([{ id: "team-1", name: "Core" }]);
    const cookie = await signUp(call);

    const response = await call("POST", "/api/integrations/linear", cookie, { apiKey: "lin_api_good_key" });

    expect(await response.json()).toEqual({
      kind: "connected",
      teamName: "Core",
      projects: ["Client Work"],
      missingStates: ["Later"],
    });
    expect(triageQueue.messages).toEqual([
      expect.objectContaining({ type: "ProjectsSynced", payload: { teamId: "team-1", teamName: "Core", projects: ["Client Work"] } }),
    ]);
    expect(await (await call("GET", "/api/integrations/linear", cookie)).json()).toEqual({ connected: true, teamName: "Core" });
  });

  it("stores the API key encrypted", async () => {
    const { call } = setup([{ id: "team-1", name: "Core" }]);
    const cookie = await signUp(call);

    await call("POST", "/api/integrations/linear", cookie, { apiKey: "lin_api_good_key" });

    const rows = await env.DB.prepare("SELECT token_sealed FROM linear_connections").all<{ token_sealed: string }>();
    expect(rows.results.length).toBeGreaterThan(0);
    for (const row of rows.results) expect(row.token_sealed).not.toContain("lin_api_good_key");
  });

  it("disconnects", async () => {
    const { call } = setup([{ id: "team-1", name: "Core" }]);
    const cookie = await signUp(call);
    await call("POST", "/api/integrations/linear", cookie, { apiKey: "lin_api_good_key" });

    await call("DELETE", "/api/integrations/linear", cookie);

    expect(await (await call("GET", "/api/integrations/linear", cookie)).json()).toEqual({ connected: false });
  });
});
