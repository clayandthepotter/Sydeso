import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "../../../../components/app-shell";
import { api, ApiError } from "../../../../lib/api";

export default async function ProjectLayout({
  params,
  children,
}: {
  params: Promise<{ projectId: string }>;
  children: ReactNode;
}) {
  const { projectId } = await params;
  let project;
  try {
    project = await api.getProject(projectId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const [organizations, workspaces] = await Promise.all([api.listOrganizations(), api.listWorkspaces(project.organizationId)]);
  const organization = organizations.find(item => item.id === project.organizationId);
  const workspace = workspaces.find(item => item.id === project.workspaceId);

  const base = `/app/projects/${projectId}`;
  const orgBase = `/app/organizations/${project.organizationId}`;

  return (
    <AppShell
      projectId={projectId}
      context={{ kind: workspace ? `${organization?.name ?? "Organization"} / ${workspace.name}` : "Project", name: project.name }}
      groups={[
        {
          label: "Project",
          items: [
            { href: "/app", label: "Home", icon: "menu", exact: true },
            { href: `${base}/requests`, label: "Requests", icon: "feature", meta: String(project.features.length) },
            { href: `${base}/documents`, label: "Documents", icon: "artifact" },
          ],
        },
        {
          label: "Settings",
          items: [
            { href: orgBase, label: "Organization", icon: "organization", exact: true },
            { href: `${orgBase}/members`, label: "Members", icon: "members" },
            { href: `${orgBase}/machines`, label: "Machines", icon: "runner" },
            { href: `${orgBase}/audit`, label: "Audit log", icon: "audit" },
            { href: "/app/design-lock", label: "Design lock", icon: "design" },
          ],
        },
      ]}
      crumbs={[
        { href: "/app", label: "Home" },
        { href: `${base}/requests`, label: project.name },
      ]}
      primary={{ href: `${base}/requests/new`, label: "New request" }}
    >
      {children}
    </AppShell>
  );
}
