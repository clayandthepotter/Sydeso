import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "../../../../components/app-shell";
import { api, ApiError } from "../../../../lib/api";
import { can, roleLabel } from "../../../../lib/roles";

export default async function OrganizationLayout({
  params,
  children,
}: {
  params: Promise<{ organizationId: string }>;
  children: ReactNode;
}) {
  const { organizationId } = await params;
  let organization;
  try {
    organization = await api.getOrganization(organizationId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const base = `/app/organizations/${organizationId}`;
  const items = [
    { href: base, label: "Projects", exact: true },
    { href: `${base}/members`, label: "Members" },
    ...(can(organization.role, "runner.read") ? [{ href: `${base}/runners`, label: "Runners" }] : []),
    ...(can(organization.role, "audit.read") ? [{ href: `${base}/audit`, label: "Audit log" }] : []),
  ];

  return (
    <AppShell
      context={{ kind: `Organization · ${roleLabel(organization.role)}`, name: organization.name }}
      groups={[
        { label: "Organization", items },
        { label: "Sydeso", items: [{ href: "/app", label: "Organizations", exact: true }, { href: "/app/design-lock", label: "Design lock" }] },
      ]}
      crumbs={[{ href: "/app", label: "Organizations" }, { href: base, label: organization.name }]}
    >
      {children}
    </AppShell>
  );
}
