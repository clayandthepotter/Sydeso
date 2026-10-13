import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectForm, WorkspaceForm } from "../../../../components/forms";
import { api } from "../../../../lib/api";
import { formatDateTime } from "../../../../lib/format";

export const metadata = { title: "Projects" };

export default async function OrganizationPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const organizations = await api.listOrganizations();
  const organization = organizations.find(item => item.id === organizationId);
  if (!organization) notFound();

  const workspaces = await api.listWorkspaces(organizationId);
  const projectsByWorkspace = await Promise.all(workspaces.map(workspace => api.listProjects(workspace.id)));

  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="display">{organization.name}</h1>
          <p className="muted">
            {workspaces.length} workspace{workspaces.length === 1 ? "" : "s"} ·{" "}
            {projectsByWorkspace.reduce((sum, list) => sum + list.length, 0)} projects
          </p>
        </div>
      </div>

      <div className="tree">
        {workspaces.length === 0 && <div className="empty mono-text">No workspaces yet. Add one to hold projects.</div>}
        {workspaces.map((workspace, index) => {
          const projects = projectsByWorkspace[index];
          return (
            <section className="tree__workspace panel" key={workspace.id}>
              <div className="panel__head">
                <h2 className="title">{workspace.name}</h2>
                <span className="mono muted">{workspace.slug}</span>
              </div>
              <div className="panel__body">
                {projects.length === 0 ? (
                  <p className="muted">No projects in this workspace.</p>
                ) : (
                  <ul className="tree__projects">
                    {projects.map(project => (
                      <li key={project.id}>
                        <Link className="card" href={`/app/projects/${project.id}/features`}>
                          <span className="card__title">{project.name}</span>
                          <span className="card__meta mono">
                            <span>{project.repositoryUrl ? new URL(project.repositoryUrl).pathname.slice(1) : "no repository"}</span>
                            <span>{project.defaultBranch}</span>
                          </span>
                          <span className="mono-text muted">Created {formatDateTime(project.createdAt)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <details>
                  <summary className="mono muted">Add a project to {workspace.name}</summary>
                  <div style={{ paddingTop: "0.75rem" }}>
                    <ProjectForm organizationId={organizationId} workspaceId={workspace.id} />
                  </div>
                </details>
              </div>
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
