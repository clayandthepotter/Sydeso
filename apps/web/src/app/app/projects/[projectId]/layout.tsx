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
      organizationId={project.organizationId}
      context={{ kind: workspace ? `${organization?.name ?? "Organization"} / ${workspace.name}` : "Project", name: project.name }}
      groups={[
        {
          label: "Project",
          items: [
            { href: `${base}/features`, label: "Features", icon: "feature", meta: String(project.features.length) },
            { href: `${base}/artifacts`, label: "Artifacts", icon: "artifact" },
          ],
        },
        {
          label: "Organization",
          items: [
            { href: orgBase, label: "Projects", icon: "project", exact: true },
            { href: `${orgBase}/members`, label: "Members", icon: "members" },
            { href: `${orgBase}/runners`, label: "Runners", icon: "runner" },
            { href: `${orgBase}/audit`, label: "Audit log", icon: "audit" },
          ],
        },
        {
          label: "Sydeso",
          items: [
            { href: "/app", label: "Organizations", icon: "organization", exact: true },
            { href: "/app/design-lock", label: "Design lock", icon: "design" },
          ],
        },
      ]}
      crumbs={[
        { href: "/app", label: "Organizations" },
        { href: orgBase, label: organization?.name ?? "Organization" },
        { href: `${base}/features`, label: project.name },
      ]}
      primary={{ href: `${base}/features/new`, label: "New feature" }}
    >
      {children}
    </AppShell>
  );
}
