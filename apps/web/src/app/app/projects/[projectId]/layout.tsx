import Link from "next/link";
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
      context={{ kind: workspace ? `${organization?.name ?? "Organization"} / ${workspace.name}` : "Project", name: project.name }}
      groups={[
        {
          label: "Project",
          items: [
            { href: `${base}/features`, label: "Features", meta: String(project.features.length) },
            { href: `${base}/artifacts`, label: "Artifacts" },
          ],
        },
        {
          label: "Organization",
          items: [
            { href: orgBase, label: "Projects", exact: true },
            { href: `${orgBase}/runners`, label: "Runners" },
            { href: `${orgBase}/audit`, label: "Audit log" },
          ],
        },
        { label: "Sydeso", items: [{ href: "/app", label: "Organizations", exact: true }, { href: "/app/design-lock", label: "Design lock" }] },
      ]}
      crumbs={[
        { href: "/app", label: "Organizations" },
        { href: orgBase, label: organization?.name ?? "Organization" },
        { href: `${base}/features`, label: project.name },
      ]}
      actions={
        <Link className="btn btn--accent" href={`${base}/features/new`}>
          New feature request
        </Link>
      }
    >
      {children}
    </AppShell>
  );
}
