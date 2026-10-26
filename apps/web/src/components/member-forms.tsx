"use client";

import type { OrganizationRole } from "@sydeso/domain";
import { useActionState } from "react";

import {
  inviteMemberAction,
  removeMemberAction,
  revokeInvitationAction,
  updateMemberRoleAction,
  type ActionState,
  type InviteActionState,
} from "../app/app/actions";
import { roleLabel } from "../lib/roles";

function ErrorNotice({ error }: { error?: string }) {
  return error ? <p className="notice notice--error mono-text">{error}</p> : null;
}

export function InviteForm({ organizationId, roles }: { organizationId: string; roles: OrganizationRole[] }) {
  const [state, action, pending] = useActionState<InviteActionState, FormData>(inviteMemberAction, {});
  return (
    <div className="panel__body">
      {state.inviteUrl ? (
        <div className="token">
          <span className="mono">Invite link for {state.email}. Shown once.</span>
          <code>{state.inviteUrl}</code>
          <span className="mono-text">
            Send this link to them. It expires in 7 days and is revoked if you invite the same address again.
          </span>
        </div>
      ) : null}
      <form className="form" action={action}>
        <input type="hidden" name="organizationId" value={organizationId} />
        <div className="form__row">
          <div className="field" style={{ flex: "1 1 240px" }}>
            <label className="mono" htmlFor="invite-email">
              Email
            </label>
            <input id="invite-email" className="input" name="email" type="email" required autoComplete="off" />
          </div>
          <div className="field">
            <label className="mono" htmlFor="invite-role">
              Role
            </label>
            <select id="invite-role" className="input" name="role" defaultValue={roles.includes("engineer") ? "engineer" : roles[0]}>
              {roles.map(role => (
                <option key={role} value={role}>
                  {roleLabel(role)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <ErrorNotice error={state.error} />
        <div className="form__row">
          <button className="btn btn--accent" type="submit" disabled={pending || roles.length === 0}>
            {pending ? "Creating link…" : "Create invite link"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function RoleSelect({
  organizationId,
  userId,
  role,
  roles,
  disabled,
}: {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  roles: OrganizationRole[];
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateMemberRoleAction, {});
  const editable = !disabled && roles.includes(role);

  if (!editable) {
    return <span className="badge mono badge--muted">{roleLabel(role)}</span>;
  }

  return (
    <form className="form__row" action={action}>
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="userId" value={userId} />
      <select className="input" name="role" defaultValue={role} disabled={pending} style={{ minHeight: 34, width: "auto" }}>
        {roles.map(option => (
          <option key={option} value={option}>
            {roleLabel(option)}
          </option>
        ))}
      </select>
      <button className="btn btn--ghost" type="submit" disabled={pending}>
        Save
      </button>
      {state.error && <span className="mono-text" style={{ color: "var(--alert)" }}>{state.error}</span>}
      {state.ok && <span className="hint">Saved</span>}
    </form>
  );
}

export function RemoveMemberButton({ organizationId, userId, self }: { organizationId: string; userId: string; self: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(removeMemberAction, {});
  return (
    <form className="form__row" action={action}>
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="userId" value={userId} />
      <button className="btn btn--ghost" type="submit" disabled={pending}>
        {self ? "Leave" : "Remove"}
      </button>
      {state.error && <span className="mono-text" style={{ color: "var(--alert)" }}>{state.error}</span>}
    </form>
  );
}

export function RevokeInvitationButton({ organizationId, invitationId }: { organizationId: string; invitationId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(revokeInvitationAction, {});
  return (
    <form className="form__row" action={action}>
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="invitationId" value={invitationId} />
      <button className="btn btn--ghost" type="submit" disabled={pending}>
        Revoke
      </button>
      {state.error && <span className="mono-text" style={{ color: "var(--alert)" }}>{state.error}</span>}
    </form>
  );
}
