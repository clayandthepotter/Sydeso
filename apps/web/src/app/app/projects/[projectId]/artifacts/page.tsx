import Link from "next/link";

import { Icon } from "../../../../../components/icons";
import { api } from "../../../../../lib/api";
import { formatDateTime, formatRelative } from "../../../../../lib/format";
import { shortId } from "../../../../../lib/workflow";

export const metadata = { title: "Artifacts" };

export default async function ArtifactsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const artifacts = await api.listProjectArtifacts(projectId);
  const types = Array.from(new Set(artifacts.map(artifact => artifact.type))).sort();

  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="display">Artifacts</h1>
          <p className="muted">
            The system of record. {artifacts.length} immutable, versioned, checksummed. {types.length} type
            {types.length === 1 ? "" : "s"} in use.
          </p>
        </div>
      </div>

      {artifacts.length === 0 ? (
        <div className="empty">No artifacts yet. The first feature request creates one.</div>
      ) : (
        <div className="rows" role="list">
          {artifacts.map(artifact => (
            <Link className="row" href={`/app/projects/${projectId}/artifacts/${artifact.id}`} key={artifact.id} role="listitem">
              <span className="row__glyph">
                <Icon name="artifact" />
              </span>
              <span className="mono-text muted" style={{ flex: "none", width: "18ch" }}>
                {artifact.type}
              </span>
              <span className="row__title">
                {artifact.title}
                {artifact.feature && <span className="muted"> · {artifact.feature.title}</span>}
              </span>
              <span className="row__meta">
                <span className="mono-text">v{artifact.version}</span>
                <span className="badge mono badge--muted">{artifact.createdByType}</span>
                <span className="mono-text muted" title={artifact.checksum}>
                  {shortId(artifact.checksum)}
                </span>
                <span className="muted" title={formatDateTime(artifact.createdAt)}>
                  {formatRelative(artifact.createdAt)}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
