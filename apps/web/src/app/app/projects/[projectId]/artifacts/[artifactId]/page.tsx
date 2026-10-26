import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonView } from "../../../../../../components/json-view";
import { JobBadge, StateBadge } from "../../../../../../components/state-badge";
import { api, ApiError } from "../../../../../../lib/api";
import { formatBytes, formatDateTime } from "../../../../../../lib/format";
import { shortId } from "../../../../../../lib/workflow";

export const metadata = { title: "Artifact" };

export default async function ArtifactPage({ params }: { params: Promise<{ projectId: string; artifactId: string }> }) {
  const { projectId, artifactId } = await params;
  let artifact;
  try {
    artifact = await api.getArtifact(artifactId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  if (artifact.projectId !== projectId) notFound();

  const [versions, lineage] = await Promise.all([api.getArtifactVersions(artifactId), api.getArtifactLineage(artifactId)]);
  const artifactHref = (id: string) => `/app/projects/${projectId}/artifacts/${id}`;
  const filename = (artifact.metadata as { filename?: string } | null)?.filename;

  return (
    <>
      <div className="page__head">
        <div>
          <p className="hint">
            <Link href={`/app/projects/${projectId}/artifacts`}>Artifacts</Link> / <span className="mono-text">{artifact.type}</span> v{artifact.version}
          </p>
          <h1 className="display">{artifact.title}</h1>
        </div>
        <div className="form__row">
          {artifact.workflowRun && <StateBadge state={artifact.workflowRun.currentState} />}
          <a className="btn btn--ghost" href={`/api/artifacts/${artifact.id}/content`} download>
            Download {artifact.storageKey ? "file" : "JSON"}
          </a>
        </div>
      </div>

      <div className="detail">
        <div className="detail__main">
          <section className="panel">
            <div className="panel__head">
              <h2 className="title">Content</h2>
              {artifact.storageKey ? (
                <span className="mono muted">
                  {filename ?? "object"} · {artifact.contentType ?? "application/octet-stream"} · {formatBytes(artifact.sizeBytes)}
                </span>
              ) : (
                <span className="mono muted">inline JSON</span>
              )}
            </div>
            <div className="panel__body">
              {artifact.storageKey ? (
                <p className="muted">
                  Stored in object storage at <code className="mono-text">{artifact.storageKey}</code>. The download carries the
                  SHA-256 in its headers so the bytes can be verified.
                </p>
              ) : (
                <JsonView value={artifact.content} />
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel__head">
              <h2 className="title">Lineage</h2>
              <span className="mono muted">
                {lineage.sources.length} source{lineage.sources.length === 1 ? "" : "s"} · {lineage.derived.length} derived
              </span>
            </div>
            <div className="panel__body">
              <dl className="kv mono-text">
                <dt>Produced by</dt>
                <dd>
                  {lineage.producedByJob ? (
                    <span className="form__row" style={{ gap: "0.4rem" }}>
                      <StateBadge state={lineage.producedByJob.state} />
                      <span>{lineage.producedByJob.agentType} job {shortId(lineage.producedByJob.id)}</span>
                      <JobBadge status={lineage.producedByJob.status} />
                    </span>
                  ) : (
                    <span>
                      {artifact.createdByType}
                      {artifact.createdById ? ` · ${shortId(artifact.createdById)}` : ""}
                    </span>
                  )}
                </dd>
                <dt>Sources</dt>
                <dd>
                  {lineage.sources.length === 0 ? (
                    <span className="muted">none, an original</span>
                  ) : (
                    <ul className="stack">
                      {lineage.sources.map(source => (
                        <li key={source.id}>
                          <Link href={artifactHref(source.id)}>
                            {source.type} v{source.version}
                          </Link>{" "}
                          <span className="muted">{source.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </dd>
                <dt>Derived</dt>
                <dd>
                  {lineage.derived.length === 0 ? (
                    <span className="muted">nothing yet</span>
                  ) : (
                    <ul className="stack">
                      {lineage.derived.map(child => (
                        <li key={child.id}>
                          <Link href={artifactHref(child.id)}>
                            {child.type} v{child.version}
                          </Link>{" "}
                          <span className="muted">{child.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </dd>
              </dl>
            </div>
          </section>
        </div>

        <aside className="detail__side">
          <section className="panel">
            <div className="panel__head">
              <h2 className="title">Record</h2>
            </div>
            <div className="panel__body">
              <dl className="kv mono-text">
                <dt>Type</dt>
                <dd>{artifact.type}</dd>
                <dt>Version</dt>
                <dd>
                  {artifact.version} of {versions.length}
                </dd>
                <dt>Created by</dt>
                <dd>
                  {artifact.createdByType}
                  {artifact.createdById ? ` · ${shortId(artifact.createdById)}` : ""}
                </dd>
                <dt>Created</dt>
                <dd>{formatDateTime(artifact.createdAt)}</dd>
                <dt>Feature</dt>
                <dd>
                  {artifact.feature ? (
                    <Link href={`/app/projects/${projectId}/features/${artifact.feature.id}`}>{artifact.feature.title}</Link>
                  ) : (
                    "—"
                  )}
                </dd>
                <dt>Run</dt>
                <dd>{artifact.workflowRun ? `${shortId(artifact.workflowRun.id)} · ${artifact.workflowRun.status}` : "—"}</dd>
                <dt>SHA-256</dt>
                <dd className="wrap">{artifact.checksum}</dd>
                <dt>Id</dt>
                <dd>{artifact.id}</dd>
              </dl>
            </div>
          </section>

          <section className="panel">
            <div className="panel__head">
              <h2 className="title">Versions</h2>
              <span className="mono muted">immutable</span>
            </div>
            <div className="table-wrap">
              <table className="table">
                <tbody>
                  {versions.map(version => (
                    <tr key={version.id}>
                      <td className="mono-text">
                        {version.id === artifact.id ? (
                          <strong>v{version.version}</strong>
                        ) : (
                          <Link href={artifactHref(version.id)}>v{version.version}</Link>
                        )}
                      </td>
                      <td className="wrap">
                        {version.title}
                        <div className="mono-text muted">
                          {version.createdByType} · {formatDateTime(version.createdAt)}
                        </div>
                      </td>
                      <td className="mono-text muted">{shortId(version.checksum)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
