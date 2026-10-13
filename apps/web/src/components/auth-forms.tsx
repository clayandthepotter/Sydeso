"use client";

import { useActionState } from "react";

import { acceptInvitationAction, signInAction, signUpAction, type AuthActionState } from "../app/auth-actions";

function ErrorNotice({ error }: { error?: string }) {
  return error ? <p className="notice notice--error mono-text">{error}</p> : null;
}

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(signInAction, {});
  return (
    <form className="form" action={action}>
      {next && <input type="hidden" name="next" value={next} />}
      <div className="field">
        <label className="mono" htmlFor="email">
          Email
        </label>
        <input id="email" className="input" name="email" type="email" required autoComplete="email" autoFocus />
      </div>
      <div className="field">
        <label className="mono" htmlFor="password">
          Password
        </label>
        <input id="password" className="input" name="password" type="password" required autoComplete="current-password" />
      </div>
      <ErrorNotice error={state.error} />
      <div className="form__row">
        <button className="btn btn--accent" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </form>
  );
}

export function SignUpForm({ invitationToken, email }: { invitationToken?: string; email?: string }) {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(signUpAction, {});
  return (
    <form className="form" action={action}>
      {invitationToken && <input type="hidden" name="invitationToken" value={invitationToken} />}
      <div className="field">
        <label className="mono" htmlFor="name">
          Your name
        </label>
        <input id="name" className="input" name="name" required autoComplete="name" autoFocus maxLength={120} />
      </div>
      <div className="field">
        <label className="mono" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="input"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={email}
          readOnly={Boolean(email)}
        />
      </div>
      <div className="field">
        <label className="mono" htmlFor="password">
          Password, at least 10 characters
        </label>
        <input id="password" className="input" name="password" type="password" required minLength={10} autoComplete="new-password" />
      </div>
      <ErrorNotice error={state.error} />
      <div className="form__row">
        <button className="btn btn--accent" type="submit" disabled={pending}>
          {pending ? "Creating account…" : invitationToken ? "Create account and join" : "Create account"}
        </button>
      </div>
    </form>
  );
}

export function AcceptInvitationForm({ token, organizationName }: { token: string; organizationName: string }) {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(acceptInvitationAction, {});
  return (
    <form className="form" action={action}>
      <input type="hidden" name="token" value={token} />
      <ErrorNotice error={state.error} />
      <div className="form__row">
        <button className="btn btn--accent" type="submit" disabled={pending}>
          {pending ? "Joining…" : `Join ${organizationName}`}
        </button>
      </div>
    </form>
  );
}
