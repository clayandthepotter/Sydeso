import Link from "next/link";
import type { WorkflowState } from "@sydeso/domain";

import { AppShell, sydesoGroup } from "../../components/app-shell";
import { RequestForm } from "../../components/forms";
import { Icon } from "../../components/icons";
import { StateGlyph } from "../../components/state-glyph";
import { Timer } from "../../components/timer";
import { api } from "../../lib/api";
import { listAllProjects } from "../../lib/catalog";
import { stepStartedAt } from "../../lib/inbox";
import { formatDateTime, formatRelative } from "../../lib/format";
import type { FeatureWithLatestRun } from "../../lib/types";
import { inboxGroup, inboxGroupLabels, stateLabels, type InboxGroup } from "../../lib/workflow";

export const metadata = { title: "Home" };

interface InboxRow {
  request: FeatureWithLatestRun;
  projectId: string;
  projectName: string;
  state: WorkflowState;
  group: InboxGroup;
  /** When the current state began, as closely as the list endpoint tells it. */
  since: string;
}

const groupOrder: InboxGroup[] = ["waiting", "progress", "unstarted", "recent"];
const recentWindowMs = 14 * 24 * 60 * 60 * 1000;

export default async function HomePage() {
  const projects = await listAllProjects();
  const lists = await Promise.all(projects.map(entry => api.listFeatures(entry.project.id)));
  const stepStarts = await stepStartedAt(lists.flat());
  const rows: InboxRow[] = projects.flatMap((entry, index) =>
    lists[index].map(request => {
      const run = request.workflowRuns[0];
      const state = run?.currentState ?? request.status;
      return {
        request,
        projectId: entry.project.id,
        projectName: entry.project.name,
        state,
        group: inboxGroup(state),
        since: stepStarts.get(request.id) ?? run?.completedAt ?? run?.startedAt ?? request.createdAt,
      };
    }),
  );
  const cutoff = Date.now() - recentWindowMs;
  const visible = rows.filter(row => row.group !== "recent" || new Date(row.since).getTime() >= cutoff);
  const groups = groupOrder
    .map(group => ({ group, rows: visible.filter(row => row.group === group).sort((a, b) => b.since.localeCompare(a.since)) }))
    .filter(group => group.rows.length > 0);
  const onlyProject = projects.length === 1 ? projects[0] : null;
  const showProject = projects.length > 1;

  return (
    <AppShell
      groups={[
        ...(projects.length > 0
          ? [
              {
                label: "Projects",
                items: projects.map(entry => ({
                  href: `/app/projects/${entry.project.id}/requests`,
                  label: entry.project.name,
                  icon: "project" as const,
                })),
              },
            ]
          : []),
        sydesoGroup,
      ]}
      crumbs={[{ label: "Home" }]}
      primary={onlyProject ? { href: `/app/projects/${onlyProject.project.id}/requests/new`, label: "New request" } : undefined}
    >
      {projects.length === 0 ? (
        <>
          <div className="page__head">
            <div>
              <h1 className="display">Home</h1>
            </div>
          </div>
          <div className="empty">
            No projects yet. <Link href="/app/organizations">Create an organization and a project</Link>.
          </div>
        </>
      ) : groups.length === 0 ? (
        <>
          <div className="page__head">
            <div>
              <h1 className="display">Describe what you want built.</h1>
            </div>
          </div>
          {onlyProject ? (
            <section className="panel panel--form">
              <div className="panel__body">
                <RequestForm projectId={onlyProject.project.id} repositoryMissing={!onlyProject.project.repositoryUrl} />
              </div>
            </section>
          ) : (
            <div className="rows" role="list">
              {projects.map(entry => (
                <Link className="row" href={`/app/projects/${entry.project.id}/requests/new`} key={entry.project.id} role="listitem">
                  <span className="row__glyph">
                    <Icon name="project" />
                  </span>
                  <span className="row__title">{entry.project.name}</span>
                  <span className="row__meta">
                    <span className="muted">New request</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="page__head">
            <div>
              <h1 className="display">Home</h1>
            </div>
          </div>
          {groups.map(({ group, rows: list }) => (
            <section className="rows" key={group} aria-label={inboxGroupLabels[group]}>
              <header className="rows__group">
                <span>{inboxGroupLabels[group]}</span>
                <span className="mono">{list.length}</span>
              </header>
              {list.map(row => (
                <Link
                  className="row"
                  href={`/app/projects/${row.projectId}/requests/${row.request.id}`}
                  key={row.request.id}
                  role="listitem"
                >
                  <StateGlyph state={row.state} />
                  <span className="row__title">
                    {row.request.title}
                    {showProject && <span className="muted"> · {row.projectName}</span>}
                  </span>
                  <span className="row__meta">
                    <span className={row.group === "waiting" ? "" : "muted"}>{stateLabels[row.state]}</span>
                    {row.group === "progress" ? (
                      <Timer since={row.since} />
                    ) : (
                      <span className="muted" title={formatDateTime(row.since)}>
                        {formatRelative(row.since)}
                      </span>
                    )}
                  </span>
                </Link>
              ))}
            </section>
          ))}
        </>
      )}
    </AppShell>
  );
}
