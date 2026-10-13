import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonView } from "../../../../../../components/json-view";
import { StateBadge } from "../../../../../../components/state-badge";
import { api, ApiError } from "../../../../../../lib/api";
import { formatDateTime } from "../../../../../../lib/format";

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

  return (
    <>
      <div className="page__head">
        <div>
          <p className="mono muted">
            <Link href={`/app/projects/${projectId}/artifacts`}>Artifacts</Link> / {artifact.type} v{artifact.version}
          </p>
          <h1 className="display">{artifact.title}</h1>
        </div>
        {artifact.workflowRun && <StateBadge state={artifact.workflowRun.currentState} />}
      </div>

      <div className="detail">
        <section className="panel detail__main">
          <div className="panel__head">
            <h2 className="title">Content</h2>
            {artifact.storageKey && <span className="mono muted">stored at {artifact.storageKey}</span>}
          </div>
          <div className="panel__body">
            <JsonView value={artifact.content} />
          </div>
        </section>

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
                <dd>{artifact.version}</dd>
                <dt>Created by</dt>
                <dd>
                  {artifact.createdByType}
                  {artifact.createdById ? ` · ${artifact.createdById}` : ""}
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
                <dd>{artifact.workflowRun ? `${artifact.workflowRun.id} · ${artifact.workflowRun.status}` : "—"}</dd>
                <dt>SHA-256</dt>
                <dd>{artifact.checksum}</dd>
                <dt>Id</dt>
                <dd>{artifact.id}</dd>
              </dl>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
