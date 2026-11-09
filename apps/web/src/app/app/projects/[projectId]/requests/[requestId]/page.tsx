import Link from "next/link";
import { notFound } from "next/navigation";

import { ArtifactForm } from "../../../../../../components/artifact-forms";
import { CopyLink } from "../../../../../../components/copy-link";
import { HeaderMenu } from "../../../../../../components/decision-row";
import { Fold } from "../../../../../../components/fold";
import { Icon } from "../../../../../../components/icons";
import { JsonView } from "../../../../../../components/json-view";
import { Prop, Props } from "../../../../../../components/props";
import { RunTrace } from "../../../../../../components/run-trace";
import { Session } from "../../../../../../components/session";
import { StateGlyph } from "../../../../../../components/state-glyph";
import { Timer } from "../../../../../../components/timer";
import { api, ApiError } from "../../../../../../lib/api";
import { formatDateTime, formatRelative } from "../../../../../../lib/format";
import { can } from "../../../../../../lib/roles";
import { buildSession, currentEntry, escalationCause } from "../../../../../../lib/run-session";
import type { Artifact } from "../../../../../../lib/types";
import { decisionsFor, stateLabels, stateLines, workingStates } from "../../../../../../lib/workflow";

export const metadata = { title: "Request" };

function hasKeys(value: unknown): boolean {
  return typeof value === "object" && value !== null && Object.keys(value as object).length > 0;
}

function latestOfType(artifacts: Artifact[], type: Artifact["type"]) {
  return [...artifacts].filter(artifact => artifact.type === type).sort((a, b) => b.version - a.version || b.createdAt.localeCompare(a.createdAt))[0];
}

export default async function RequestPage({ params }: { params: Promise<{ projectId: string; requestId: string }> }) {
  const { projectId, requestId } = await params;
  let request;
  try {
    request = await api.getFeature(requestId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  if (request.projectId !== projectId) notFound();

  const [organization, project] = await Promise.all([api.getOrganization(request.organizationId), api.getProject(projectId)]);
  const canAddDocument = can(organization.role, "artifact.create");
  const run = request.workflowRuns[0];
  const state = run?.currentState ?? request.status;
  const visited = run ? Array.from(new Set(run.transitions.map(transition => transition.toState))) : [];
  const blocks = run ? buildSession(run, request.artifacts, project.maxRemediationIterations) : [];
  const decisions = run ? decisionsFor(state) : { primary: [], overflow: [] };
  const design = latestOfType(request.artifacts, "design_package");
  const report = latestOfType(request.artifacts, "qa_report");
  const code = latestOfType(request.artifacts, "implementation_package");
  const evidence = {
    design_approval: design ? [{ document: design, label: "Full design" }] : [],
    manual_review: [
      ...(report ? [{ document: report, label: "Test results" }] : []),
      ...(code ? [{ document: code, label: "Code changes" }] : []),
    ],
  };
  const current = run ? blocks.find(block => block.current) : undefined;
  const running = run ? workingStates.includes(state) && current?.job?.status !== "failed" && current?.job?.status !== "cancelled" : false;
  const entry = run ? currentEntry(run) : null;
  const failedJob = run ? run.jobs.filter(job => job.status === "failed").sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] : undefined;
  const documentHref = (id: string) => `/app/projects/${projectId}/documents/${id}`;

  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="display">{request.title}</h1>
          <p className="status-line">
            <StateGlyph state={state} />
            <span>{stateLabels[state]}</span>
            {running && current && <Timer since={current.startedAt} />}
            <span className="muted">{stateLines[state]}</span>
          </p>
        </div>
        <div className="page__actions">
          <HeaderMenu
            workflowRunId={run?.id ?? ""}
            requestId={request.id}
            projectId={projectId}
            decisions={run && decisions.primary.length === 0 ? decisions.overflow : []}
          >
            <CopyLink />
            {project.repositoryUrl && (
              <a className="menu__item" role="menuitem" href={project.repositoryUrl} target="_blank" rel="noreferrer">
                Open repository
              </a>
            )}
          </HeaderMenu>
        </div>
      </div>

      <p className="request-text prose">{request.description}</p>

      {run && <RunTrace currentState={state} visited={visited} />}

      {run && state === "escalated" && (
        <section className="needs" aria-label="Needs you">
          <p className="needs__cause">
            <Icon name="alert" size={16} />
            <span>{escalationCause(run)}</span>
          </p>
          {(Boolean(failedJob?.error) || hasKeys(entry?.metadata)) && (
            <Fold label="Raw detail">
              {failedJob?.error ? <JsonView value={failedJob.error} /> : null}
              {hasKeys(entry?.metadata) ? <JsonView value={entry?.metadata} /> : null}
            </Fold>
          )}
        </section>
      )}

      <div className="detail">
        <div className="detail__main">
          {run ? (
            <Session
              blocks={blocks}
              projectId={projectId}
              requestId={request.id}
              workflowRunId={run.id}
              decisions={decisions}
              evidence={evidence}
            />
          ) : (
            <p className="muted">Not started.</p>
          )}

          {run && canAddDocument && (
            <Fold label="Add a document by hand">
              <ArtifactForm workflowRunId={run.id} projectId={projectId} requestId={request.id} />
            </Fold>
          )}
        </div>

        <aside className="detail__side">
          <section className="panel">
            <div className="panel__head">
              <h2 className="title">Properties</h2>
            </div>
            <div className="panel__body">
              <Props>
                <Prop label="Status">
                  <span className="props__value">
                    <StateGlyph state={state} />
                    {stateLabels[state]}
                  </span>
                </Prop>
                <Prop label="Submitted">
                  <span title={formatDateTime(request.createdAt)}>{formatRelative(request.createdAt)}</span>
                </Prop>
                {run?.completedAt && (
                  <Prop label="Finished">
                    <span title={formatDateTime(run.completedAt)}>{formatRelative(run.completedAt)}</span>
                  </Prop>
                )}
                {run && (
                  <Prop label="Fix attempts">
                    {run.remediationCount === 0 ? <span className="muted">None</span> : `${run.remediationCount} of ${project.maxRemediationIterations}`}
                  </Prop>
                )}
                <Prop label="Documents">
                  {request.artifacts.length === 0 ? (
                    <span className="muted">None</span>
                  ) : (
                    <Link className="link" href={`/app/projects/${projectId}/documents`}>
                      {request.artifacts.length}
                    </Link>
                  )}
                </Prop>
                <Prop label="Project">
                  <Link className="link" href={`/app/projects/${projectId}/requests`}>
                    {project.name}
                  </Link>
                </Prop>
              </Props>
              <Fold label="Details">
                <ul className="evidence__list mono-text muted">
                  <li>request {request.id}</li>
                  {run && <li>run {run.id}</li>}
                  {run && <li>{run.status}</li>}
                </ul>
              </Fold>
            </div>
          </section>

          {request.artifacts.length > 0 && (
            <section className="panel">
              <div className="panel__head">
                <h2 className="title">Documents</h2>
                <span className="muted">{request.artifacts.length}</span>
              </div>
              <div className="rows" role="list" aria-label="Documents">
                {request.artifacts.map(artifact => (
                  <Link className="row" href={documentHref(artifact.id)} key={artifact.id} role="listitem">
                    <span className="row__glyph">
                      <Icon name="artifact" />
                    </span>
                    <span className="row__title">
                      {artifact.title}
                      <span className="muted mono-text"> · {artifact.type}</span>
                    </span>
                    <span className="row__meta">
                      <span className="mono-text muted">v{artifact.version}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
