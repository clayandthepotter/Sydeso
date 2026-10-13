import { JsonView } from "../../../../../components/json-view";
import { api } from "../../../../../lib/api";
import { formatDateTime } from "../../../../../lib/format";
import { shortId } from "../../../../../lib/workflow";

export const metadata = { title: "Audit log" };

export default async function AuditPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const entries = await api.listAuditLogs(organizationId);

  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="display">Audit log</h1>
          <p className="muted">Every transition, job and artifact, with the actor that caused it. Latest {entries.length}.</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="empty mono-text">Nothing recorded yet. The first feature request writes the first entry.</div>
      ) : (
        <div className="panel">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Entity</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id}>
                    <td className="muted">{formatDateTime(entry.createdAt)}</td>
                    <td className="mono-text">{entry.action}</td>
                    <td>
                      <span className="badge mono badge--muted">{entry.actorType}</span>{" "}
                      {entry.actorId && <span className="mono-text muted">{shortId(entry.actorId)}</span>}
                    </td>
                    <td className="mono-text">
                      {entry.entityType}
                      {entry.entityId && <span className="muted"> · {shortId(entry.entityId)}</span>}
                    </td>
                    <td className="wrap">
                      <details>
                        <summary className="mono muted">before / after</summary>
                        <div className="grid-2" style={{ paddingTop: "0.5rem" }}>
                          <JsonView value={entry.before} />
                          <JsonView value={entry.after} />
                        </div>
                      </details>
                    </td>
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
