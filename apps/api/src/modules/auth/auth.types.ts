export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

/** What the auth guard attaches to the request once a session token checks out. */
export interface AuthContext {
  user: SessionUser;
  sessionId: string;
}

export const SESSION_COOKIE = "sydeso_session";
