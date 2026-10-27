import Link from "next/link";
import { notFound } from "next/navigation";

import { ArtifactForm } from "../../../../../../components/artifact-forms";
import { Icon } from "../../../../../../components/icons";
import { JsonView } from "../../../../../../components/json-view";
import { Prop, Props } from "../../../../../../components/props";
import { RunTrace } from "../../../../../../components/run-trace";
import { JobBadge, StateBadge } from "../../../../../../components/state-badge";
import { StateGlyph } from "../../../../../../components/state-glyph";
import { TransitionPanel, type TransitionOption } from "../../../../../../components/transition-panel";
import { api, ApiError } from "../../../../../../lib/api";
import { formatDateTime, formatDuration, formatRelative } from "../../../../../../lib/format";
import { can } from "../../../../../../lib/roles";
import { describeTransition, shortId, stateLabels, transitionsFrom } from "../../../../../../lib/workflow";

export const metadata = { title: "Feature" };

export default async function FeaturePage({ params }: { params: Promise<{ projectId: string; featureId: string }> }) {
  const { projectId, featureId } = await params;
  let feature;
  try {
    feature = await api.getFeature(featureId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  if (feature.projectId !== projectId) notFound();

  const organization = await api.getOrganization(feature.organizationId);
  const canAttach = can(organization.role, "artifact.create");
  const run = feature.workflowRuns[0];
  const visited = run ? Array.from(new Set(run.transitions.map(transition => transition.toState))) : [];
  const options: TransitionOption[] = run
    ? transitionsFrom(run.currentState).map(rule => ({
        to: rule.to,
        label: describeTransition(rule),
        kind: rule.to === "escalated" ? "escalate" : rule.requiresApproval ? "approve" : rule.createsJob ? "job" : "move",
        agentType: rule.agentType,
        requiredCapabilities: rule.requiredCapabilities,
      }))
    : [];
  const request = feature.artifacts.find(artifact => artifact.type === "feature_request");
  const artifactHref = (id: string) => `/app/projects/${projectId}/artifacts/${id}`;
  const transitions = run ? [...run.transitions].reverse() : [];
  const failedJobs = run ? run.jobs.filter(job => job.error) : [];

  return (
    <>
      <div className="page__head">
        <div>
          <p className="hint">
            Feature <span className="mono-text">{shortId(feature.id)}</span>
          </p>
          <h1 className="display">{feature.title}</h1>
        </div>
        {run && <StateBadge state={run.currentState} live={run.status === "active"} />}
      </div>

      {run && <RunTrace currentState={run.currentState} visited={visited} />}

      <div className="detail">
        <div className="detail__main">
          <section className="panel">
            <div className="panel__head">
              <h2 className="title">Request</h2>
              {request && (
                <Link className="link" href={artifactHref(request.id)}>
                  <span className="mono-text">{request.type}</span> v{request.version}
                </Link>
              )}
            </div>
            <div className="panel__body">
              <p className="prose">{feature.description}</p>
            </div>
          </section>

          {run && (
            <section className="panel">
              <div className="panel__head">
                <h2 className="title">Transitions</h2>
                <span className="muted">
                  {transitions.length} recorded, newest first
                </span>
              </div>
              <div className="rows" role="list" aria-label="Transitions">
                {transitions.map(transition => (
                  <div className="row" key={transition.id} role="listitem">
                    <StateGlyph state={transition.toState} />
                    <span className="row__title">
                      {transition.fromState && (
                        <span className="muted">
                          {stateLabels[transition.fromState]}
                          <Icon name="chevron-right" size={12} />
                        </span>
                      )}
                      <strong>{stateLabels[transition.toState]}</strong>
                      {transition.reason && <span className="muted"> · {transition.reason}</span>}
                    </span>
                    <span className="row__meta">
                      <span className="badge mono badge--muted">{transition.triggeredByType}</span>
                      <span className="muted" title={formatDateTime(transition.createdAt)}>
                        {formatRelative(transition.createdAt)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {run && (
            <section className="panel">
              <div className="panel__head">
                <h2 className="title">Jobs</h2>
                <span className="muted">
                  {run.jobs.length} queued or run
                </span>
              </div>
              {run.jobs.length === 0 ? (
                <div className="panel__body">
                  <p className="muted">No jobs yet. Moving the run to Design queues the first architect job.</p>
                </div>
              ) : (
                <div className="rows" role="list" aria-label="Jobs">
                  {run.jobs.map(job => (
                    <div className="row" key={job.id} role="listitem">
                      <span className="row__glyph">
                        <Icon name="runner" />
                      </span>
                      <span className="row__title">
                        <strong>{job.agentType}</strong>
                        <span className="muted"> · {stateLabels[job.state]}</span>
                        {job.requiredCapabilities.length > 0 && (
                          <span className="muted mono-text"> · {job.requiredCapabilities.join(", ")}</span>
                        )}
                      </span>
                      <span className="row__meta">
                        <JobBadge status={job.status} />
                        <span className="muted">attempt {job.attempt}</span>
                        <span className="mono-text muted">{job.runnerId ? shortId(job.runnerId) : "unassigned"}</span>
                        <span className="muted">{formatDuration(job.startedAt, job.completedAt)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {failedJobs.length > 0 && (
                <div className="panel__body">
                  {failedJobs.map(job => (
                    <div key={job.id}>
                      <p className="hint">Error, attempt {job.attempt}</p>
                      <JsonView value={job.error} />
                    </div>
                  ))}
                </div>
              )}
            </section>
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
                  {run ? (
                    <span className="props__value">
                      <StateGlyph state={run.currentState} />
                      {stateLabels[run.currentState]}
                    </span>
                  ) : (
                    <span className="muted">No run</span>
                  )}
                </Prop>
                {run && (
                  <Prop label="Run">
                    <span className="mono-text">{shortId(run.id)}</span>
                    <span className="muted"> · {run.status}</span>
                  </Prop>
                )}
                {run && (
                  <Prop label="Remediation">
                    {run.remediationCount === 0 ? <span className="muted">None</span> : run.remediationCount}
                  </Prop>
                )}
                <Prop label="Created">
                  <span title={formatDateTime(feature.createdAt)}>{formatRelative(feature.createdAt)}</span>
                </Prop>
                {run && (
                  <Prop label="Started">
                    <span title={formatDateTime(run.startedAt)}>{formatRelative(run.startedAt)}</span>
                  </Prop>
                )}
                <Prop label="Artifacts">{feature.artifacts.length}</Prop>
                <Prop label="Id" wrap>
                  <span className="mono-text muted">{feature.id}</span>
                </Prop>
              </Props>
            </div>
          </section>

          <section className="panel">
            <div className="panel__head">
              <h2 className="title">Next</h2>
              {run && <span className="muted">from {stateLabels[run.currentState]}</span>}
            </div>
            <div className="panel__body">
              {run ? (
                <TransitionPanel workflowRunId={run.id} featureId={feature.id} projectId={projectId} options={options} />
              ) : (
                <p className="muted">No workflow run exists for this feature.</p>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel__head">
              <h2 className="title">Artifacts</h2>
              <span className="muted">{feature.artifacts.length}</span>
            </div>
            {feature.artifacts.length === 0 ? (
              <div className="panel__body">
                <p className="muted">None yet.</p>
              </div>
            ) : (
              <div className="rows" role="list" aria-label="Feature artifacts">
                {feature.artifacts.map(artifact => (
                  <Link className="row" href={artifactHref(artifact.id)} key={artifact.id} role="listitem">
                    <span className="row__glyph">
                      <Icon name="artifact" />
                    </span>
                    <span className="row__title">
                      <span className="mono-text">{artifact.type}</span>
                      <span className="muted"> · {artifact.title}</span>
                    </span>
                    <span className="row__meta">
                      <span className="mono-text muted">v{artifact.version}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
            {run && canAttach && (
              <details>
                <summary className="mono">Attach an artifact to this run</summary>
                <div className="panel__body">
                  <ArtifactForm workflowRunId={run.id} projectId={projectId} featureId={feature.id} />
                </div>
              </details>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
