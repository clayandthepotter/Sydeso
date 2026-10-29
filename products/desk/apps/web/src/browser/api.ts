/** Calls to desk-api for sign-up, sign-in, and the account. */

export interface User {
  readonly email: string;
  readonly displayName: string;
  readonly timeZone: string;
}

export interface TriageItem {
  readonly itemId: string;
  readonly action: string;
  readonly project: string | null;
  readonly dueDate: string | null;
  readonly priority: "P1" | "P2" | "P3";
  readonly status: "extracted" | "routed" | "needs_review" | "created";
  readonly state: "Today" | "Next" | "Later" | null;
  readonly issueKey: string | null;
  readonly reviewReason: string | null;
}

export interface NoteTriage {
  readonly items: readonly TriageItem[];
  readonly noteReview: string | null;
}

export interface ServerNote {
  readonly noteId: string;
  readonly text: string;
  readonly capturedAt: string;
  readonly triage: NoteTriage | null;
}

export type LinearStatus = { connected: false } | { connected: true; teamName: string };

export type LinearConnectResult =
  | { kind: "choose_team"; teams: Array<{ id: string; name: string }> }
  | { kind: "connected"; teamName: string; projects: string[]; missingStates: string[] };

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

async function call<T>(method: "GET" | "POST" | "DELETE", path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    ...(body !== undefined && { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new ApiError(response.status, data.error ?? "unknown_error");
  return data as T;
}

export const api = {
  me: () => call<{ user: User }>("GET", "/api/me"),
  notes: () => call<{ notes: ServerNote[] }>("GET", "/api/notes"),
  registerOptions: (input: { inviteCode: string; email: string; displayName: string; timeZone: string }) =>
    call<{ challengeId: string; options: unknown }>("POST", "/api/auth/register/options", input),
  registerVerify: (challengeId: string, response: unknown) =>
    call<{ user: User }>("POST", "/api/auth/register/verify", { challengeId, response }),
  loginOptions: () => call<{ challengeId: string; options: unknown }>("POST", "/api/auth/login/options", {}),
  loginVerify: (challengeId: string, response: unknown) =>
    call<{ user: User }>("POST", "/api/auth/login/verify", { challengeId, response }),
  logout: () => call<{ ok: true }>("POST", "/api/auth/logout", {}),
  linearStatus: () => call<LinearStatus>("GET", "/api/integrations/linear"),
  linearConnect: (apiKey: string, teamId?: string) =>
    call<LinearConnectResult>("POST", "/api/integrations/linear", { apiKey, ...(teamId && { teamId }) }),
  linearRefresh: () => call<LinearConnectResult>("POST", "/api/integrations/linear/refresh", {}),
  linearDisconnect: () => call<LinearStatus>("DELETE", "/api/integrations/linear"),
};

/** Text for each error code from the API. */
export const ERROR_TEXT: Record<string, string> = {
  invite_invalid: "This invite does not work. It can be used, expired, or for a different email.",
  email_taken: "An account with this email exists. Sign in with your passkey.",
  challenge_expired: "The request expired. Try again.",
  verification_failed: "The passkey was not accepted. Try again.",
  unknown_passkey: "Desk does not know this passkey. Use the passkey that you made for Desk.",
  invalid_input: "Check the fields and try again.",
  rate_limited: "Too many attempts. Wait one minute and try again.",
  signed_out: "Your session ended. Sign in again.",
  linear_invalid_key: "Linear did not accept this API key. Check the key and try again.",
  linear_no_teams: "This Linear key has no teams.",
  linear_unknown_team: "That team is not available for this key.",
  linear_not_connected: "Connect Linear first.",
  linear_error: "Linear did not answer. Try again.",
};
