import { cookies } from "next/headers";

/** The web app keeps the API session token in its own httpOnly cookie and forwards it as a bearer token. */
export const SESSION_COOKIE = "sydeso_session";

export async function getSessionToken() {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

export async function setSessionCookie(token: string, expiresAt: string | Date) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
