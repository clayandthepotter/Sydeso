import Link from "next/link";

import { AppShell } from "../../components/app-shell";
import { OrganizationForm } from "../../components/forms";
import { api } from "../../lib/api";
import { formatDateTime } from "../../lib/format";

export const metadata = { title: "Organizations" };

export default async function OrganizationsPage() {
  const organizations = await api.listOrganizations();

  return (
    <AppShell
      groups={[{ label: "Sydeso", items: [{ href: "/app", label: "Organizations", exact: true }, { href: "/app/design-lock", label: "Design lock" }] }]}
      crumbs={[{ label: "Organizations" }]}
    >
      <div className="page__head">
        <div>
          <h1 className="display">Organizations</h1>
          <p className="muted">Every workspace, project, runner and artifact belongs to one organization.</p>
        </div>
      </div>

      {organizations.length === 0 ? (
        <div className="empty mono-text">No organizations yet. Create the first one below.</div>
      ) : (
        <div className="panel">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Plan</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map(organization => (
                  <tr key={organization.id}>
                    <td>
                      <Link href={`/app/organizations/${organization.id}`}>{organization.name}</Link>
                    </td>
                    <td className="mono-text muted">{organization.slug}</td>
                    <td>
                      <span className="badge mono badge--muted">{organization.plan}</span>
                    </td>
                    <td className="muted">{formatDateTime(organization.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
