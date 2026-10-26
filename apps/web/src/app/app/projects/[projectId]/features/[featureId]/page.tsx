import Link from "next/link";
import { notFound } from "next/navigation";

import { ArtifactForm } from "../../../../../../components/artifact-forms";
import { JsonView } from "../../../../../../components/json-view";
import { RunTrace } from "../../../../../../components/run-trace";
import { JobBadge, StateBadge } from "../../../../../../components/state-badge";
import { TransitionPanel, type TransitionOption } from "../../../../../../components/transition-panel";
import { api, ApiError } from "../../../../../../lib/api";
import { formatDateTime, formatDuration } from "../../../../../../lib/format";
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

  return (
    <>
      <div className="page__head">
        <div>
          <p className="hint">
            Feature <span className="mono-text">{shortId(feature.id)}</span> · created {formatDateTime(feature.createdAt)}
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
                <Link className="mono muted" href={`/app/projects/${projectId}/artifacts/${request.id}`}>
                  feature_request v{request.version}
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
                <span className="mono muted">
                  run {shortId(run.id)} · {run.status} · remediation {run.remediationCount}
                </span>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Actor</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {run.transitions.map(transition => (
                      <tr key={transition.id}>
                        <td className="muted">{formatDateTime(transition.createdAt)}</td>
                        <td className="mono-text muted">{transition.fromState ? stateLabels[transition.fromState] : "—"}</td>
                        <td>
                          <StateBadge state={transition.toState} />
                        </td>
                        <td>
                          <span className="badge mono badge--muted">{transition.triggeredByType}</span>
                        </td>
                        <td className="wrap muted">{transition.reason ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {run && (
            <section className="panel">
              <div className="panel__head">
                <h2 className="title">Jobs</h2>
                <span className="mono muted">{run.jobs.length} queued or run</span>
              </div>
              {run.jobs.length === 0 ? (
                <div className="panel__body">
                  <p className="muted">No jobs yet. Moving the run to Design queues the first architect job.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>State</th>
                        <th>Agent</th>
                        <th>Status</th>
                        <th>Attempt</th>
                        <th>Runner</th>
                        <th>Needs</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {run.jobs.map(job => (
                        <tr key={job.id}>
                          <td>
                            <StateBadge state={job.state} />
                          </td>
                          <td className="mono-text">{job.agentType}</td>
                          <td>
                            <JobBadge status={job.status} />
                          </td>
                          <td className="mono-text">{job.attempt}</td>
                          <td className="mono-text muted">{job.runnerId ? shortId(job.runnerId) : "unassigned"}</td>
                          <td className="wrap">
                            <div className="chips">
                              {job.requiredCapabilities.map(capability => (
                                <span className="badge mono badge--muted" key={capability}>
                                  {capability}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="muted">{formatDuration(job.startedAt, job.completedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {run.jobs.some(job => job.error) && (
                <div className="panel__body">
                  {run.jobs
                    .filter(job => job.error)
                    .map(job => (
                      <div key={job.id}>
                        <p className="hint">Error · attempt {job.attempt}</p>
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
              <h2 className="title">Next</h2>
              {run && <span className="mono muted">from {stateLabels[run.currentState]}</span>}
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
              <span className="mono muted">{feature.artifacts.length}</span>
            </div>
            {feature.artifacts.length === 0 ? (
              <div className="panel__body">
                <p className="muted">None yet.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <tbody>
                    {feature.artifacts.map(artifact => (
                      <tr key={artifact.id}>
                        <td>
                          <Link href={`/app/projects/${projectId}/artifacts/${artifact.id}`}>
                            <span className="mono-text">{artifact.type}</span>
                          </Link>
                          <div className="muted">{artifact.title}</div>
                        </td>
                        <td className="mono-text muted">v{artifact.version}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {run && canAttach && (
              <details className="panel__body">
                <summary className="mono muted">Attach an artifact to this run</summary>
                <div style={{ paddingTop: "0.75rem" }}>
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
