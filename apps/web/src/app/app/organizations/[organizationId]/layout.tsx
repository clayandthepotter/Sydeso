import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "../../../../components/app-shell";
import { api } from "../../../../lib/api";

export default async function OrganizationLayout({
  params,
  children,
}: {
  params: Promise<{ organizationId: string }>;
  children: ReactNode;
}) {
  const { organizationId } = await params;
  const organizations = await api.listOrganizations();
  const organization = organizations.find(item => item.id === organizationId);
  if (!organization) notFound();

  const base = `/app/organizations/${organizationId}`;

  return (
    <AppShell
      context={{ kind: "Organization", name: organization.name }}
      groups={[
        {
          label: "Organization",
          items: [
            { href: base, label: "Projects", exact: true },
            { href: `${base}/runners`, label: "Runners" },
            { href: `${base}/audit`, label: "Audit log" },
          ],
        },
        { label: "Sydeso", items: [{ href: "/app", label: "Organizations", exact: true }, { href: "/app/design-lock", label: "Design lock" }] },
      ]}
      crumbs={[{ href: "/app", label: "Organizations" }, { href: base, label: organization.name }]}
    >
      {children}
    </AppShell>
  );
}
