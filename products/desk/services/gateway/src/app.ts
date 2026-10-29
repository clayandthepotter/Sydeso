import { createCapture, InvalidNoteError } from "@desk/capture";
import { D1NotesReadModel } from "@desk/capture/d1";
import { D1EventStore, R2RawStore } from "@desk/cloudflare";
import type { Clock } from "@desk/domain";
import { createIdentity, IdentityError, type IdentityErrorCode, type PasskeyVerifierPort, type Principal } from "@desk/identity";
import {
  BodyError,
  SESSION_COOKIE,
  clearedSessionCookie,
  json,
  problem,
  readCookie,
  readJson,
  sessionCookie,
} from "./http.js";

export interface AppEnv {
  readonly DB: D1Database;
  readonly RAW: R2Bucket;
  readonly ASSETS?: Fetcher;
  /** For example https://desk.sydeso.com. State changing requests must come from it. */
  readonly APP_ORIGIN: string;
  readonly SESSION_TTL_DAYS: string;
  readonly CHALLENGE_TTL_MINUTES: string;
  readonly DEFAULT_CONFIDENCE_THRESHOLD: string;
  readonly AUTH_RATE_LIMITER?: RateLimit;
}

export interface AppDeps {
  readonly env: AppEnv;
  readonly clock: Clock;
  readonly verifier: PasskeyVerifierPort;
}

const IDENTITY_STATUS: Record<IdentityErrorCode, number> = {
  invalid_input: 400,
  invite_invalid: 403,
  email_taken: 409,
  challenge_expired: 400,
  verification_failed: 401,
  unknown_passkey: 401,
};

const numberVar = (value: string, name: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${name} must be a positive number`);
  return parsed;
};

const publicPrincipal = (principal: Principal) => ({
  email: principal.email,
  displayName: principal.displayName,
  timeZone: principal.timeZone,
});

/** desk-api. Routes /api/* and serves the PWA for every other path. */
export function createApp(deps: AppDeps) {
  const { env, clock } = deps;
  const identity = createIdentity({
    db: env.DB,
    clock,
    verifier: deps.verifier,
    settings: {
      sessionTtlDays: numberVar(env.SESSION_TTL_DAYS, "SESSION_TTL_DAYS"),
      challengeTtlMinutes: numberVar(env.CHALLENGE_TTL_MINUTES, "CHALLENGE_TTL_MINUTES"),
      defaultConfidenceThreshold: numberVar(env.DEFAULT_CONFIDENCE_THRESHOLD, "DEFAULT_CONFIDENCE_THRESHOLD"),
    },
  });

  const captureFor = (tenantId: string) =>
    createCapture({
      tenantId,
      store: new D1EventStore(env.DB, tenantId),
      notes: new D1NotesReadModel(env.DB, tenantId),
      raw: new R2RawStore(env.RAW),
      clock,
    });

  const withSession = async (request: Request, handler: (principal: Principal) => Promise<Response>) => {
    const principal = await identity.authenticate(readCookie(request, SESSION_COOKIE));
    return principal ? handler(principal) : problem(401, "signed_out");
  };

  const signedIn = (session: { token: string; expiresAt: string; principal: Principal }) =>
    json({ user: publicPrincipal(session.principal) }, 200, {
      "Set-Cookie": sessionCookie(session.token, session.expiresAt, clock.now()),
    });

  type Route = (request: Request) => Promise<Response>;
  const routes: Record<string, Route> = {
    "GET /api/health": async () => json({ ok: true }),
    "GET /api/me": (request) => withSession(request, async (principal) => json({ user: publicPrincipal(principal) })),
    "POST /api/auth/register/options": async (request) => {
      const body = (await readJson(request)) as Record<string, unknown>;
      return json(
        await identity.startRegistration({
          inviteCode: String(body.inviteCode ?? ""),
          email: String(body.email ?? ""),
          displayName: String(body.displayName ?? ""),
          timeZone: String(body.timeZone ?? ""),
        }),
      );
    },
    "POST /api/auth/register/verify": async (request) => {
      const body = (await readJson(request)) as Record<string, unknown>;
      return signedIn(
        await identity.finishRegistration({
          challengeId: body.challengeId,
          response: body.response,
          userAgent: request.headers.get("User-Agent"),
        }),
      );
    },
    "POST /api/auth/login/options": async () => json(await identity.startLogin()),
    "POST /api/auth/login/verify": async (request) => {
      const body = (await readJson(request)) as Record<string, unknown>;
      return signedIn(
        await identity.finishLogin({
          challengeId: body.challengeId,
          response: body.response,
          userAgent: request.headers.get("User-Agent"),
        }),
      );
    },
    "POST /api/auth/logout": async (request) => {
      await identity.signOut(readCookie(request, SESSION_COOKIE));
      return json({ ok: true }, 200, { "Set-Cookie": clearedSessionCookie() });
    },
    "GET /api/notes": (request) =>
      withSession(request, async (principal) => json({ notes: await captureFor(principal.tenantId).listNotes(200) })),
    "POST /api/notes": async (request) =>
      withSession(request, async (principal) => {
        const outcome = await captureFor(principal.tenantId).captureNote(await readJson(request));
        return json({ outcome }, outcome === "appended" ? 201 : 200);
      }),
  };

  const handleApi = async (request: Request, url: URL): Promise<Response> => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      // Cookies are SameSite=Lax. This check also blocks cross site requests from old browsers.
      if (request.headers.get("Origin") !== env.APP_ORIGIN) return problem(403, "bad_origin");
    }
    if (url.pathname.startsWith("/api/auth/") && env.AUTH_RATE_LIMITER) {
      const key = request.headers.get("CF-Connecting-IP") ?? "unknown";
      const { success } = await env.AUTH_RATE_LIMITER.limit({ key });
      if (!success) return problem(429, "rate_limited");
    }
    const route = routes[`${request.method} ${url.pathname}`];
    if (!route) return problem(404, "not_found");
    try {
      return await route(request);
    } catch (error) {
      if (error instanceof IdentityError) return problem(IDENTITY_STATUS[error.code], error.code);
      if (error instanceof InvalidNoteError) return json({ error: "invalid_note", details: error.errors }, 400);
      if (error instanceof BodyError) return problem(error.status, "bad_body");
      console.error("desk-api error", error);
      return problem(500, "internal_error");
    }
  };

  return {
    async fetch(request: Request): Promise<Response> {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) return handleApi(request, url);
      if (!env.ASSETS) return problem(404, "not_found");
      return env.ASSETS.fetch(request);
    },
  };
}
