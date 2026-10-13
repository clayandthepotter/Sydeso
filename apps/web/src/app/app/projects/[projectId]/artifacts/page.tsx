import Link from "next/link";

import { api } from "../../../../../lib/api";
import { formatDateTime } from "../../../../../lib/format";
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
            The system of record. {artifacts.length} immutable, versioned, checksummed. {types.length} type{types.length === 1 ? "" : "s"} in use.
          </p>
        </div>
      </div>

      {artifacts.length === 0 ? (
        <div className="empty mono-text">No artifacts yet. The first feature request creates one.</div>
      ) : (
        <div className="panel">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Version</th>
                  <th>Feature</th>
                  <th>Created by</th>
                  <th>Created</th>
                  <th>Checksum</th>
                </tr>
              </thead>
              <tbody>
                {artifacts.map(artifact => (
                  <tr key={artifact.id}>
                    <td>
                      <Link className="mono-text" href={`/app/projects/${projectId}/artifacts/${artifact.id}`}>
                        {artifact.type}
                      </Link>
                    </td>
                    <td className="wrap">{artifact.title}</td>
                    <td className="mono-text">v{artifact.version}</td>
                    <td className="wrap">
                      {artifact.feature ? (
                        <Link href={`/app/projects/${projectId}/features/${artifact.feature.id}`}>{artifact.feature.title}</Link>
                      ) : (
                        <span className="muted">project</span>
                      )}
                    </td>
                    <td>
                      <span className="badge mono badge--muted">{artifact.createdByType}</span>
                    </td>
                    <td className="muted">{formatDateTime(artifact.createdAt)}</td>
                    <td className="mono-text muted">{shortId(artifact.checksum)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
