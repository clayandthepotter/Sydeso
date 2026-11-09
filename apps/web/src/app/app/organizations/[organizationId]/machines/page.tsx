import { MachineForm } from "../../../../../components/forms";
import { JobBadge, RunnerBadge, StateBadge } from "../../../../../components/state-badge";
import { api } from "../../../../../lib/api";
import { formatDateTime, formatRelative } from "../../../../../lib/format";
import { shortId } from "../../../../../lib/workflow";

export const metadata = { title: "Machines" };

export default async function RunnersPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const runners = await api.listRunners(organizationId);
  const online = runners.filter(runner => runner.status === "online" || runner.status === "busy").length;

  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="display">Machines</h1>
          <p className="muted">
            {runners.length} connected · {online} online. Machines run the agents; each one claims the jobs whose capabilities it
            advertise.
          </p>
        </div>
      </div>

      {runners.length === 0 ? (
        <div className="empty">No machines connected. Add one below, then start it with the token.</div>
      ) : (
        <div className="panel">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Machine</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Version</th>
                  <th>Capabilities</th>
                  <th>Last seen</th>
                  <th>Recent jobs</th>
                </tr>
              </thead>
              <tbody>
                {runners.map(runner => (
                  <tr key={runner.id}>
                    <td>
                      <strong>{runner.name}</strong>
                      <div className="mono-text muted">{shortId(runner.id)}</div>
                    </td>
                    <td className="mono-text">{runner.type}</td>
                    <td>
                      <RunnerBadge status={runner.status} />
                    </td>
                    <td className="mono-text">{runner.version}</td>
                    <td className="wrap">
                      <div className="chips">
                        {runner.capabilities.length === 0 && <span className="muted">none</span>}
                        {runner.capabilities.map(capability => (
                          <span className="badge mono badge--muted" key={capability}>
                            {capability}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="muted" title={formatDateTime(runner.lastSeenAt)}>
                      {formatRelative(runner.lastSeenAt)}
                    </td>
                    <td className="wrap">
                      {runner.jobs.length === 0 ? (
                        <span className="muted">—</span>
                      ) : (
                        <div className="chips">
                          {runner.jobs.map(job => (
                            <span className="form__row" key={job.id} style={{ gap: "0.35rem" }}>
                              <StateBadge state={job.state} />
                              <JobBadge status={job.status} />
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <section className="panel panel--form">
        <div className="panel__head">
          <h2 className="title">Add a machine</h2>
          <span className="muted">Returns a bearer token once</span>
        </div>
        <MachineForm organizationId={organizationId} />
      </section>
    </>
  );
}
