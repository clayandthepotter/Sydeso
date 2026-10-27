import Link from "next/link";
import { notFound } from "next/navigation";

import { Icon } from "../../../../../../components/icons";
import { JsonView } from "../../../../../../components/json-view";
import { Prop, Props } from "../../../../../../components/props";
import { JobBadge, StateBadge } from "../../../../../../components/state-badge";
import { StateGlyph } from "../../../../../../components/state-glyph";
import { api, ApiError } from "../../../../../../lib/api";
import { formatBytes, formatDateTime, formatRelative } from "../../../../../../lib/format";
import { shortId, stateLabels } from "../../../../../../lib/workflow";

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
  const related = [
    ...lineage.sources.map(item => ({ ...item, relation: "Source" })),
    ...lineage.derived.map(item => ({ ...item, relation: "Derived" })),
  ];

  return (
    <>
      <div className="page__head">
        <div>
          <p className="hint">
            <Link className="link" href={`/app/projects/${projectId}/artifacts`}>
              Artifacts
            </Link>{" "}
            / <span className="mono-text">{artifact.type}</span> v{artifact.version}
          </p>
          <h1 className="display">{artifact.title}</h1>
        </div>
        <div className="page__actions">
          {artifact.workflowRun && <StateBadge state={artifact.workflowRun.currentState} />}
          <a className="btn" href={`/api/artifacts/${artifact.id}/content`} download>
            <Icon name="download" size={14} />
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
                <span className="muted">
                  {filename ?? "object"} · {artifact.contentType ?? "application/octet-stream"} · {formatBytes(artifact.sizeBytes)}
                </span>
              ) : (
                <span className="muted">Inline JSON</span>
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
              <span className="muted">
                {lineage.sources.length} source{lineage.sources.length === 1 ? "" : "s"} · {lineage.derived.length} derived
              </span>
            </div>
            <div className="panel__body">
              <Props label="Lineage">
                <Prop label="Produced by">
                  {lineage.producedByJob ? (
                    <span className="props__value">
                      <StateGlyph state={lineage.producedByJob.state} />
                      {lineage.producedByJob.agentType} job <span className="mono-text">{shortId(lineage.producedByJob.id)}</span>
                      <JobBadge status={lineage.producedByJob.status} />
                    </span>
                  ) : (
                    <span className="props__value">
                      <span className="badge mono badge--muted">{artifact.createdByType}</span>
                      {artifact.createdById && <span className="mono-text muted">{shortId(artifact.createdById)}</span>}
                    </span>
                  )}
                </Prop>
              </Props>
            </div>
            {related.length === 0 ? (
              <div className="panel__body">
                <p className="muted">An original. Nothing derives from it yet.</p>
              </div>
            ) : (
              <div className="rows" role="list" aria-label="Related artifacts">
                {related.map(item => (
                  <Link className="row" href={artifactHref(item.id)} key={`${item.relation}-${item.id}`} role="listitem">
                    <span className="row__glyph">
                      <Icon name="artifact" />
                    </span>
                    <span className="row__id">{item.relation}</span>
                    <span className="row__title">
                      <span className="mono-text">{item.type}</span>
                      <span className="muted"> · {item.title}</span>
                    </span>
                    <span className="row__meta">
                      <span className="mono-text muted">v{item.version}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="detail__side">
          <section className="panel">
            <div className="panel__head">
              <h2 className="title">Properties</h2>
            </div>
            <div className="panel__body">
              <Props>
                <Prop label="Type">
                  <span className="mono-text">{artifact.type}</span>
                </Prop>
                <Prop label="Version">
                  v{artifact.version} <span className="muted">of {versions.length}</span>
                </Prop>
                <Prop label="Created by">
                  <span className="props__value">
                    <span className="badge mono badge--muted">{artifact.createdByType}</span>
                    {artifact.createdById && <span className="mono-text muted">{shortId(artifact.createdById)}</span>}
                  </span>
                </Prop>
                <Prop label="Created">
                  <span title={formatDateTime(artifact.createdAt)}>{formatRelative(artifact.createdAt)}</span>
                </Prop>
                <Prop label="Feature">
                  {artifact.feature ? (
                    <Link className="link" href={`/app/projects/${projectId}/features/${artifact.feature.id}`}>
                      {artifact.feature.title}
                    </Link>
                  ) : (
                    <span className="muted">None</span>
                  )}
                </Prop>
                <Prop label="Run">
                  {artifact.workflowRun ? (
                    <span className="props__value">
                      <StateGlyph state={artifact.workflowRun.currentState} />
                      {stateLabels[artifact.workflowRun.currentState]}
                      <span className="mono-text muted">{shortId(artifact.workflowRun.id)}</span>
                    </span>
                  ) : (
                    <span className="muted">None</span>
                  )}
                </Prop>
                {artifact.storageKey && <Prop label="Size">{formatBytes(artifact.sizeBytes)}</Prop>}
                <Prop label="SHA-256" wrap>
                  <span className="mono-text muted">{artifact.checksum}</span>
                </Prop>
                <Prop label="Id" wrap>
                  <span className="mono-text muted">{artifact.id}</span>
                </Prop>
              </Props>
            </div>
          </section>

          <section className="panel">
            <div className="panel__head">
              <h2 className="title">Versions</h2>
              <span className="muted">Immutable</span>
            </div>
            <div className="rows" role="list" aria-label="Versions">
              {versions.map(version => {
                const current = version.id === artifact.id;
                const body = (
                  <>
                    <span className="row__id">v{version.version}</span>
                    <span className="row__title">
                      {current ? <strong>{version.title}</strong> : version.title}
                      <span className="muted"> · {version.createdByType}</span>
                    </span>
                    <span className="row__meta">
                      <span className="muted" title={`${formatDateTime(version.createdAt)} · ${version.checksum}`}>
                        {formatRelative(version.createdAt)}
                      </span>
                    </span>
                  </>
                );
                return current ? (
                  <div className="row row--current" key={version.id} role="listitem" aria-current="true">
                    {body}
                  </div>
                ) : (
                  <Link className="row" href={artifactHref(version.id)} key={version.id} role="listitem">
                    {body}
                  </Link>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
