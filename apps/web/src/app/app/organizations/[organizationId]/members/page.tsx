import { InviteForm, RemoveMemberButton, RevokeInvitationButton, RoleSelect } from "../../../../../components/member-forms";
import { api } from "../../../../../lib/api";
import { formatDateTime, formatRelative } from "../../../../../lib/format";
import { can, roleLabel } from "../../../../../lib/roles";

export const metadata = { title: "Members" };

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

      <div className="panel">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => {
                const self = member.user.id === me?.user.id;
                const lastOwner = member.role === "owner" && owners <= 1;
                return (
                  <tr key={member.id}>
                    <td>
                      <strong>{member.user.name}</strong>
                      {self && <span className="mono muted"> · you</span>}
                      <div className="mono-text muted">{member.user.email}</div>
                    </td>
                    <td>
                      <RoleSelect
                        organizationId={organizationId}
                        userId={member.user.id}
                        role={member.role}
                        roles={assignableRoles}
                        disabled={!manage || lastOwner}
                      />
                    </td>
                    <td className="muted" title={formatDateTime(member.createdAt)}>
                      {formatRelative(member.createdAt)}
                    </td>
                    <td>
                      {(self || (manage && assignableRoles.includes(member.role))) && !lastOwner && (
                        <RemoveMemberButton organizationId={organizationId} userId={member.user.id} self={self} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {manage && (
        <>
          <section className="panel">
            <div className="panel__head">
              <h2 className="title">Invite someone</h2>
              <span className="mono muted">Creates a link to send them</span>
            </div>
            <InviteForm organizationId={organizationId} roles={assignableRoles} />
          </section>

          {invitations.length > 0 && (
            <section className="panel">
              <div className="panel__head">
                <h2 className="title">Open invitations</h2>
                <span className="mono muted">{invitations.length}</span>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Invited by</th>
                      <th>Expires</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map(invitation => (
                      <tr key={invitation.id}>
                        <td className="mono-text">{invitation.email}</td>
                        <td>
                          <span className="badge mono badge--muted">{roleLabel(invitation.role)}</span>
                        </td>
                        <td className="muted">{invitation.invitedBy?.name ?? "—"}</td>
                        <td className="muted" title={formatDateTime(invitation.expiresAt)}>
                          {formatRelative(invitation.expiresAt)}
                        </td>
                        <td>
                          <RevokeInvitationButton organizationId={organizationId} invitationId={invitation.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
