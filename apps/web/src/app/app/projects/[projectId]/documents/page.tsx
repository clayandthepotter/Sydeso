import Link from "next/link";

import { Icon } from "../../../../../components/icons";
import { api } from "../../../../../lib/api";
import { formatDateTime, formatRelative } from "../../../../../lib/format";
import { shortId } from "../../../../../lib/workflow";

export const metadata = { title: "Documents" };

export default async function DocumentsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const documents = await api.listProjectArtifacts(projectId);

  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="display">Documents</h1>
          <p className="muted">Everything the agents and people wrote for this project. Each version is kept.</p>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="empty">No documents yet. The first request writes the first one.</div>
      ) : (
        <div className="rows" role="list">
          {documents.map(document => (
            <Link className="row" href={`/app/projects/${projectId}/documents/${document.id}`} key={document.id} role="listitem">
              <span className="row__glyph">
                <Icon name="artifact" />
              </span>
              <span className="mono-text muted" style={{ flex: "none", width: "18ch" }}>
                {document.type}
              </span>
              <span className="row__title">
                {document.title}
                {document.feature && <span className="muted"> · {document.feature.title}</span>}
              </span>
              <span className="row__meta">
                <span className="mono-text">v{document.version}</span>
                <span className="badge mono badge--muted">{document.createdByType}</span>
                <span className="mono-text muted" title={document.checksum}>
                  {shortId(document.checksum)}
                </span>
                <span className="muted" title={formatDateTime(document.createdAt)}>
                  {formatRelative(document.createdAt)}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
