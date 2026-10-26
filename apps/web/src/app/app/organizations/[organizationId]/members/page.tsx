import { InviteForm, RemoveMemberButton, RevokeInvitationButton, RoleSelect } from "../../../../../components/member-forms";
import { api } from "../../../../../lib/api";
import { formatDateTime, formatRelative } from "../../../../../lib/format";
import { can, roleLabel } from "../../../../../lib/roles";

export const metadata = { title: "Members" };

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function MembersPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const [me, organization, { members, assignableRoles }] = await Promise.all([
    api.me(),
    api.getOrganization(organizationId),
    api.listMembers(organizationId),
  ]);
  const manage = can(organization.role, "organization.members.manage");
  const invitations = manage ? await api.listInvitations(organizationId) : [];
  const owners = members.filter(member => member.role === "owner").length;

  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="display">Members</h1>
          <p className="muted">
            {members.length} member{members.length === 1 ? "" : "s"} · you are {roleLabel(organization.role)}. Roles grant
            permissions across every workspace and project in the organization.
          </p>
        </div>
      </div>

      <div className="rows" role="list" aria-label="Members">
        {members.map(member => {
          const self = member.user.id === me?.user.id;
          const lastOwner = member.role === "owner" && owners <= 1;
          return (
            <div className="row" key={member.id} role="listitem">
              <span className="avatar" aria-hidden="true">
                {initials(member.user.name)}
              </span>
              <span className="row__title">
                <strong>{member.user.name}</strong>
                {self && <span className="badge mono badge--muted row__tag">you</span>}
                <span className="muted"> · {member.user.email}</span>
              </span>
              <span className="row__meta">
                <RoleSelect
                  organizationId={organizationId}
                  userId={member.user.id}
                  role={member.role}
                  roles={assignableRoles}
                  disabled={!manage || lastOwner}
                />
                <span className="muted" title={formatDateTime(member.createdAt)}>
                  joined {formatRelative(member.createdAt)}
                </span>
                {(self || (manage && assignableRoles.includes(member.role))) && !lastOwner && (
                  <RemoveMemberButton organizationId={organizationId} userId={member.user.id} self={self} />
                )}
              </span>
            </div>
          );
        })}
      </div>

      {manage && (
        <>
          <section className="panel panel--form">
            <div className="panel__head">
              <h2 className="title">Invite someone</h2>
              <span className="muted">Creates a link to send them</span>
            </div>
            <InviteForm organizationId={organizationId} roles={assignableRoles} />
          </section>

          {invitations.length > 0 && (
            <section className="panel">
              <div className="panel__head">
                <h2 className="title">Open invitations</h2>
                <span className="muted">{invitations.length}</span>
              </div>
              <div className="rows" role="list" aria-label="Open invitations">
                {invitations.map(invitation => (
                  <div className="row" key={invitation.id} role="listitem">
                    <span className="row__title">
                      {invitation.email}
                      <span className="muted"> · invited by {invitation.invitedBy?.name ?? "someone who has since left"}</span>
                    </span>
                    <span className="row__meta">
                      <span className="badge mono badge--muted">{roleLabel(invitation.role)}</span>
                      <span className="muted" title={formatDateTime(invitation.expiresAt)}>
                        expires {formatRelative(invitation.expiresAt)}
                      </span>
                      <RevokeInvitationButton organizationId={organizationId} invitationId={invitation.id} />
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
