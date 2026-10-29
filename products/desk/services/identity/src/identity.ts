import { createEvent, type Clock } from "@desk/domain";
import { z } from "zod";
import { randomCode, randomToken, sha256Hex } from "./crypto.js";
import type { PasskeyVerifierPort } from "./passkeys.js";

export type IdentityErrorCode =
  | "invalid_input"
  | "invite_invalid"
  | "email_taken"
  | "challenge_expired"
  | "verification_failed"
  | "unknown_passkey";

export class IdentityError extends Error {
  override readonly name = "IdentityError";

  constructor(readonly code: IdentityErrorCode) {
    super(code);
  }
}

export interface IdentitySettings {
  readonly sessionTtlDays: number;
  readonly challengeTtlMinutes: number;
  readonly defaultConfidenceThreshold: number;
}

export interface IdentityDeps {
  readonly db: D1Database;
  readonly clock: Clock;
  readonly verifier: PasskeyVerifierPort;
  readonly settings: IdentitySettings;
}

/** The signed in person. One person is one tenant. */
export interface Principal {
  readonly userId: string;
  readonly tenantId: string;
  readonly email: string;
  readonly displayName: string;
  readonly timeZone: string;
}

export interface NewSession {
  readonly token: string;
  readonly expiresAt: string;
  readonly principal: Principal;
}

const isTimeZone = (value: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

const registrationInputSchema = z.object({
  inviteCode: z.string().trim().min(8).max(128),
  email: z.email().max(254).transform((value) => value.toLowerCase()),
  displayName: z.string().trim().min(1).max(80),
  timeZone: z.string().refine(isTimeZone, "unknown time zone"),
});

export type RegistrationInput = z.input<typeof registrationInputSchema>;

const registerPayloadSchema = z.object({
  codeHash: z.string(),
  email: z.string(),
  displayName: z.string(),
  timeZone: z.string(),
  webauthnUserId: z.string(),
});

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60_000).toISOString();

interface ChallengeRow {
  challenge: string;
  payload: string;
}

interface PrincipalRow {
  user_id: string;
  tenant_id: string;
  email: string;
  display_name: string;
  time_zone: string;
}

const toPrincipal = (row: PrincipalRow): Principal => ({
  userId: row.user_id,
  tenantId: row.tenant_id,
  email: row.email,
  displayName: row.display_name,
  timeZone: row.time_zone,
});

export function createIdentity(deps: IdentityDeps) {
  const { db, clock, verifier, settings } = deps;
  const now = () => clock.now();

  const saveChallenge = async (purpose: "register" | "login", challenge: string, payload: object) => {
    const challengeId = randomToken(24);
    await db.batch([
      db.prepare("DELETE FROM auth_challenges WHERE expires_at <= ?").bind(now().toISOString()),
      db
        .prepare("INSERT INTO auth_challenges (challenge_id, purpose, challenge, payload, expires_at) VALUES (?, ?, ?, ?, ?)")
        .bind(challengeId, purpose, challenge, JSON.stringify(payload), addMinutes(now(), settings.challengeTtlMinutes)),
    ]);
    return challengeId;
  };

  /** A challenge works once. This removes it as it reads it. */
  const takeChallenge = async (purpose: "register" | "login", challengeId: unknown) => {
    if (typeof challengeId !== "string" || challengeId.length === 0) throw new IdentityError("challenge_expired");
    const row = await db
      .prepare(
        "DELETE FROM auth_challenges WHERE challenge_id = ? AND purpose = ? AND expires_at > ? RETURNING challenge, payload",
      )
      .bind(challengeId, purpose, now().toISOString())
      .first<ChallengeRow>();
    if (!row) throw new IdentityError("challenge_expired");
    return row;
  };

  const sessionStatement = async (principal: Pick<Principal, "userId" | "tenantId">, userAgent: string | null) => {
    const token = randomToken(32);
    const expiresAt = addMinutes(now(), settings.sessionTtlDays * 24 * 60);
    const statement = db
      .prepare(
        "INSERT INTO sessions (token_hash, user_id, tenant_id, created_at, expires_at, user_agent) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(await sha256Hex(token), principal.userId, principal.tenantId, now().toISOString(), expiresAt, userAgent);
    return { token, expiresAt, statement };
  };

  const validInvite = async (codeHash: string, email: string) => {
    const invite = await db
      .prepare("SELECT email FROM invites WHERE code_hash = ? AND redeemed_at IS NULL AND expires_at > ?")
      .bind(codeHash, now().toISOString())
      .first<{ email: string | null }>();
    return invite !== null && (invite.email === null || invite.email.toLowerCase() === email);
  };

  return {
    /** Step 1 of sign-up. Checks the invite and returns WebAuthn options for a new passkey. */
    async startRegistration(input: RegistrationInput) {
      const parsed = registrationInputSchema.safeParse(input);
      if (!parsed.success) throw new IdentityError("invalid_input");
      const { inviteCode, email, displayName, timeZone } = parsed.data;

      const codeHash = await sha256Hex(inviteCode);
      if (!(await validInvite(codeHash, email))) throw new IdentityError("invite_invalid");
      const taken = await db.prepare("SELECT 1 AS taken FROM users WHERE email = ?").bind(email).first();
      if (taken) throw new IdentityError("email_taken");

      const webauthnUserId = randomToken(32);
      const { options, challenge } = await verifier.registrationOptions({ webauthnUserId, userName: email, displayName });
      const challengeId = await saveChallenge("register", challenge, {
        codeHash,
        email,
        displayName,
        timeZone,
        webauthnUserId,
      });
      return { challengeId, options };
    },

    /** Step 2 of sign-up. Verifies the passkey, then makes the tenant, the user, and a session in one batch. */
    async finishRegistration(input: { challengeId: unknown; response: unknown; userAgent: string | null }): Promise<NewSession> {
      const row = await takeChallenge("register", input.challengeId);
      const payload = registerPayloadSchema.parse(JSON.parse(row.payload));
      const passkey = await verifier.verifyRegistration({ response: input.response, challenge: row.challenge });
      if (!passkey) throw new IdentityError("verification_failed");

      const at = now().toISOString();
      const tenantId = `t_${randomCode(16)}`;
      const userId = `u_${randomCode(16)}`;
      const principal: Principal = {
        userId,
        tenantId,
        email: payload.email,
        displayName: payload.displayName,
        timeZone: payload.timeZone,
      };
      const event = createEvent(
        "TenantCreated",
        { userId, email: payload.email, displayName: payload.displayName, timeZone: payload.timeZone },
        { clock, ids: { next: () => `tenant/${tenantId}` }, tenantId },
      );
      const session = await sessionStatement(principal, input.userAgent);
      // Each insert runs only if this batch redeemed the invite. D1 runs a batch as one transaction.
      const redeemed = "EXISTS (SELECT 1 FROM invites WHERE code_hash = ? AND redeemed_by = ?)";

      let results: D1Result[];
      try {
        results = await db.batch([
          db
            .prepare(
              "UPDATE invites SET redeemed_at = ?, redeemed_by = ? WHERE code_hash = ? AND redeemed_at IS NULL AND expires_at > ?",
            )
            .bind(at, userId, payload.codeHash, at),
          db
            .prepare(
              `INSERT INTO tenants (tenant_id, time_zone, confidence_threshold, invite_address_token, created_at)
               SELECT ?, ?, ?, ?, ? WHERE ${redeemed}`,
            )
            .bind(tenantId, payload.timeZone, settings.defaultConfidenceThreshold, randomCode(10), at, payload.codeHash, userId),
          db
            .prepare(
              `INSERT INTO users (user_id, tenant_id, email, display_name, webauthn_user_id, created_at)
               SELECT ?, ?, ?, ?, ?, ? WHERE ${redeemed}`,
            )
            .bind(userId, tenantId, payload.email, payload.displayName, payload.webauthnUserId, at, payload.codeHash, userId),
          db
            .prepare(
              `INSERT INTO passkeys (credential_id, user_id, public_key, counter, transports, device_type, backed_up, created_at)
               SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE ${redeemed}`,
            )
            .bind(
              passkey.credentialId,
              userId,
              passkey.publicKey,
              passkey.counter,
              JSON.stringify(passkey.transports),
              passkey.deviceType,
              passkey.backedUp ? 1 : 0,
              at,
              payload.codeHash,
              userId,
            ),
          db
            .prepare(
              `INSERT INTO events (id, tenant_id, type, version, occurred_at, source, payload)
               SELECT ?, ?, ?, ?, ?, ?, ? WHERE ${redeemed}`,
            )
            .bind(
              event.id,
              tenantId,
              event.type,
              event.version,
              event.occurredAt,
              event.source,
              JSON.stringify(event.payload),
              payload.codeHash,
              userId,
            ),
          db
            .prepare(
              `INSERT INTO sessions (token_hash, user_id, tenant_id, created_at, expires_at, user_agent)
               SELECT token_hash, user_id, tenant_id, created_at, expires_at, user_agent
               FROM (SELECT ? AS token_hash, ? AS user_id, ? AS tenant_id, ? AS created_at, ? AS expires_at, ? AS user_agent)
               WHERE ${redeemed}`,
            )
            .bind(await sha256Hex(session.token), userId, tenantId, at, session.expiresAt, input.userAgent, payload.codeHash, userId),
        ]);
      } catch (error) {
        if (String(error).includes("UNIQUE") && String(error).includes("users.email")) throw new IdentityError("email_taken");
        throw error;
      }
      if (results[2]?.meta.changes !== 1) throw new IdentityError("invite_invalid");
      return { token: session.token, expiresAt: session.expiresAt, principal };
    },

    /** Step 1 of sign-in. The browser shows the passkeys it has for this site. */
    async startLogin() {
      const { options, challenge } = await verifier.authenticationOptions();
      const challengeId = await saveChallenge("login", challenge, {});
      return { challengeId, options };
    },

    async finishLogin(input: { challengeId: unknown; response: unknown; userAgent: string | null }): Promise<NewSession> {
      const row = await takeChallenge("login", input.challengeId);
      const credentialId = verifier.credentialIdOf(input.response);
      if (!credentialId) throw new IdentityError("verification_failed");

      const stored = await db
        .prepare(
          `SELECT p.credential_id, p.public_key, p.counter, p.transports,
                  u.user_id, u.tenant_id, u.email, u.display_name, t.time_zone
           FROM passkeys p JOIN users u ON u.user_id = p.user_id JOIN tenants t ON t.tenant_id = u.tenant_id
           WHERE p.credential_id = ?`,
        )
        .bind(credentialId)
        .first<PrincipalRow & { credential_id: string; public_key: string; counter: number; transports: string }>();
      if (!stored) throw new IdentityError("unknown_passkey");

      const verified = await verifier.verifyAuthentication({
        response: input.response,
        challenge: row.challenge,
        passkey: {
          credentialId: stored.credential_id,
          publicKey: stored.public_key,
          counter: stored.counter,
          transports: JSON.parse(stored.transports) as string[],
        },
      });
      if (!verified) throw new IdentityError("verification_failed");

      const principal = toPrincipal(stored);
      const session = await sessionStatement(principal, input.userAgent);
      await db.batch([
        db
          .prepare("UPDATE passkeys SET counter = ?, last_used_at = ? WHERE credential_id = ?")
          .bind(verified.newCounter, now().toISOString(), credentialId),
        session.statement,
      ]);
      return { token: session.token, expiresAt: session.expiresAt, principal };
    },

    /** Finds the person for a session token. Returns null for an unknown or expired session. */
    async authenticate(token: string | null): Promise<Principal | null> {
      if (!token) return null;
      const row = await db
        .prepare(
          `SELECT u.user_id, u.tenant_id, u.email, u.display_name, t.time_zone
           FROM sessions s JOIN users u ON u.user_id = s.user_id JOIN tenants t ON t.tenant_id = s.tenant_id
           WHERE s.token_hash = ? AND s.expires_at > ?`,
        )
        .bind(await sha256Hex(token), now().toISOString())
        .first<PrincipalRow>();
      return row ? toPrincipal(row) : null;
    },

    async signOut(token: string | null): Promise<void> {
      if (!token) return;
      await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256Hex(token)).run();
    },
  };
}

export type Identity = ReturnType<typeof createIdentity>;
