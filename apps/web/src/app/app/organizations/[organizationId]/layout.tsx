import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell, sydesoGroup, type NavItem } from "../../../../components/app-shell";
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
  const items: NavItem[] = [
    { href: base, label: "Projects", icon: "project", exact: true },
    { href: `${base}/members`, label: "Members", icon: "members" },
    ...(can(organization.role, "runner.read") ? [{ href: `${base}/machines`, label: "Machines", icon: "runner" as const }] : []),
    ...(can(organization.role, "audit.read") ? [{ href: `${base}/audit`, label: "Audit log", icon: "audit" as const }] : []),
  ];

  return (
    <AppShell
      switchLabel={organization.name}
      context={{ kind: roleLabel(organization.role), name: organization.name }}
      groups={[{ label: "Organization", items }, sydesoGroup]}
      crumbs={[{ href: "/app", label: "Home" }, { href: "/app/organizations", label: "Organizations" }, { href: base, label: organization.name }]}
    >
      {children}
    </AppShell>
  );
}
