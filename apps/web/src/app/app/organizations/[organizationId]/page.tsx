import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectForm, WorkspaceForm } from "../../../../components/forms";
import { Icon } from "../../../../components/icons";
import { api } from "../../../../lib/api";
import { formatDateTime, formatRelative } from "../../../../lib/format";

export const metadata = { title: "Projects" };

function repositoryPath(url: string | null | undefined) {
  if (!url) return null;
  try {
    return new URL(url).pathname.slice(1);
  } catch {
    return url;
  }
}

export default async function OrganizationPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const organizations = await api.listOrganizations();
  const organization = organizations.find(item => item.id === organizationId);
  if (!organization) notFound();

  const workspaces = await api.listWorkspaces(organizationId);
  const projectsByWorkspace = await Promise.all(workspaces.map(workspace => api.listProjects(workspace.id)));
  const total = projectsByWorkspace.reduce((sum, list) => sum + list.length, 0);

  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="display">{organization.name}</h1>
          <p className="muted">
            {workspaces.length} workspace{workspaces.length === 1 ? "" : "s"} · {total} project{total === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="tree">
        {workspaces.length === 0 && <div className="empty">No workspaces yet. Add one to hold projects.</div>}
        {workspaces.map((workspace, index) => {
          const projects = projectsByWorkspace[index];
          return (
            <section className="rows" key={workspace.id} aria-label={workspace.name}>
              <header className="rows__group">
                <Icon name="workspace" />
                <span>{workspace.name}</span>
                <span className="mono-text muted">{workspace.slug}</span>
                <span className="mono" style={{ marginLeft: "auto" }}>
                  {projects.length}
                </span>
              </header>
              {projects.length === 0 && <div className="row muted">No projects in this workspace.</div>}
              {projects.map(project => {
                const repository = repositoryPath(project.repositoryUrl);
                return (
                  <Link className="row" href={`/app/projects/${project.id}/requests`} key={project.id}>
                    <span className="row__glyph">
                      <Icon name="project" />
                    </span>
                    <span className="row__title">
                      <strong>{project.name}</strong>{" "}
                      <span className="muted">{repository ?? "no repository"}</span>
                    </span>
                    <span className="row__meta">
                      <span className="mono-text muted">{project.defaultBranch}</span>
                      <span className="muted" title={formatDateTime(project.createdAt)}>
                        {formatRelative(project.createdAt)}
                      </span>
                    </span>
                  </Link>
                );
              })}
              <details>
                <summary className="mono">Add a project to {workspace.name}</summary>
                <div className="panel__body">
                  <ProjectForm organizationId={organizationId} workspaceId={workspace.id} />
                </div>
              </details>
            </section>
          );
        })}
      </div>

      <section className="panel">
        <div className="panel__head">
          <h2 className="title">New workspace</h2>
        </div>
        <div className="panel__body">
          <WorkspaceForm organizationId={organizationId} />
        </div>
      </section>
    </>
  );
}
