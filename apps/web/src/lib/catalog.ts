import { cache } from "react";

import { api } from "./api";
import type { Organization, OrganizationWithRole, Project, Workspace } from "./types";

export interface ProjectEntry {
  project: Project;
  workspace: Workspace;
  organization: OrganizationWithRole;
}

/**
 * Every project the signed-in user can see, with its workspace and organization. Cached for
 * the length of one server render so the shell and the page share the same fetch.
 */
export const listAllProjects = cache(async (): Promise<ProjectEntry[]> => {
  const organizations = await api.listOrganizations();
  const entries: ProjectEntry[] = [];
  await Promise.all(
    organizations.map(async organization => {
      const workspaces = await api.listWorkspaces(organization.id);
      await Promise.all(
        workspaces.map(async workspace => {
          const projects = await api.listProjects(workspace.id);
          for (const project of projects) {
            if (!project.archivedAt) entries.push({ project, workspace, organization });
          }
        }),
      );
    }),
  );
  return entries.sort((a, b) => a.project.name.localeCompare(b.project.name));
});

export function organizationName(organization: Pick<Organization, "name">) {
  return organization.name;
}
