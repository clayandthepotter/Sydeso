import Link from "next/link";

import { AppShell } from "../../components/app-shell";
import { OrganizationForm } from "../../components/forms";
import { Icon } from "../../components/icons";
import { api } from "../../lib/api";
import { formatDateTime, formatRelative } from "../../lib/format";

export const metadata = { title: "Organizations" };

export default async function OrganizationsPage() {
  const organizations = await api.listOrganizations();

  return (
    <AppShell
      groups={[
        {
          label: "Sydeso",
          items: [
            { href: "/app", label: "Organizations", icon: "organization", exact: true },
            { href: "/app/design-lock", label: "Design lock", icon: "design" },
          ],
        },
      ]}
      crumbs={[{ label: "Organizations" }]}
    >
      <div className="page__head">
        <div>
          <h1 className="display">Organizations</h1>
          <p className="muted">Every workspace, project, runner and artifact belongs to one organization.</p>
        </div>
      </div>

      {organizations.length === 0 ? (
        <div className="empty">No organizations yet. Create the first one below.</div>
      ) : (
        <div className="rows" role="list">
          {organizations.map(organization => (
            <Link className="row" href={`/app/organizations/${organization.id}`} key={organization.id} role="listitem">
              <span className="row__glyph">
                <Icon name="organization" />
              </span>
              <span className="row__title">
                <strong>{organization.name}</strong> <span className="mono-text muted">{organization.slug}</span>
              </span>
              <span className="row__meta">
                <span className="badge mono badge--muted">{organization.plan}</span>
                <span className="muted" title={formatDateTime(organization.createdAt)}>
                  {formatRelative(organization.createdAt)}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}

      <section className="panel">
        <div className="panel__head">
          <h2 className="title">New organization</h2>
        </div>
        <div className="panel__body">
          <OrganizationForm />
        </div>
      </section>
    </AppShell>
  );
}
