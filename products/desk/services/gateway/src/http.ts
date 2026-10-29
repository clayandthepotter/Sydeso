/** Small HTTP helpers for desk-api. */

export const SESSION_COOKIE = "__Host-desk_session";

const SECURITY_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin",
} as const;

export function json(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  const response = new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...SECURITY_HEADERS },
  });
  new Headers(headers).forEach((value, key) => response.headers.append(key, value));
  return response;
}

export const problem = (status: number, code: string) => json({ error: code }, status);

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=") || null;
  }
  return null;
}

export function sessionCookie(token: string, expiresAt: string, now: Date): string {
  const maxAge = Math.max(0, Math.floor((Date.parse(expiresAt) - now.getTime()) / 1000));
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export const clearedSessionCookie = () => `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

/** The largest JSON body the API accepts. */
export const MAX_BODY_BYTES = 64 * 1024;

export class BodyError extends Error {
  constructor(readonly status: number) {
    super(`Body error ${status}`);
  }
}

export async function readJson(request: Request): Promise<unknown> {
  if (!(request.headers.get("Content-Type") ?? "").startsWith("application/json")) throw new BodyError(415);
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) throw new BodyError(413);
  try {
    return JSON.parse(text);
  } catch {
    throw new BodyError(400);
  }
}
