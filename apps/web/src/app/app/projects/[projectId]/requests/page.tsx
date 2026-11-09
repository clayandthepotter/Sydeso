import Link from "next/link";

import { Icon } from "../../../../../components/icons";
import { StateGlyph } from "../../../../../components/state-glyph";
import { Timer } from "../../../../../components/timer";
import { api } from "../../../../../lib/api";
import { formatDateTime, formatRelative } from "../../../../../lib/format";
import { stepStartedAt } from "../../../../../lib/inbox";
import { boardStates, humanGates, stateLabels, workingStates } from "../../../../../lib/workflow";

export const metadata = { title: "Requests" };

export default async function RequestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const [{ projectId }, { view }] = await Promise.all([params, searchParams]);
  const requests = await api.listFeatures(projectId);
  const stepStarts = await stepStartedAt(requests);
  const board = view === "board";
  const stateOf = (request: (typeof requests)[number]) => request.workflowRuns[0]?.currentState ?? request.status;
  const groups = boardStates.map(state => ({ state, requests: requests.filter(request => stateOf(request) === state) }));
  const base = `/app/projects/${projectId}/requests`;

  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="display">Requests</h1>
        </div>
        <div className="seg" role="group" aria-label="View">
          <Link className="btn btn--sm" href={base} aria-current={board ? undefined : "page"}>
            <Icon name="feature" size={14} />
            List
          </Link>
          <Link className="btn btn--sm" href={`${base}?view=board`} aria-current={board ? "page" : undefined}>
            <Icon name="project" size={14} />
            Board
          </Link>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="empty">
          No requests yet. <Link href={`${base}/new`}>Describe what you want built</Link>.
        </div>
      ) : board ? (
        <div className="board" role="list" aria-label="Requests by status">
          {groups.map(({ state, requests: column }) => {
            const modifier = state === "escalated" ? "board__col--alert" : humanGates.includes(state) ? "board__col--gate" : "";
            return (
              <section className={`board__col ${modifier}`} key={state} aria-label={stateLabels[state]}>
                <header className="board__head">
                  <span>{stateLabels[state]}</span>
                  <span>{column.length}</span>
                </header>
                <div className="board__cards">
                  {column.map(request => {
                    const run = request.workflowRuns[0];
                    return (
                      <Link className="card" href={`${base}/${request.id}`} key={request.id} role="listitem">
                        <span className="card__title">{request.title}</span>
                        <span className="card__meta">
                          <span>{formatRelative(run?.startedAt ?? request.createdAt)}</span>
                        </span>
                        {run && run.remediationCount > 0 && <span className="hint">Fix attempts {run.remediationCount}</span>}
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="rows" role="list" aria-label="Requests by status">
          {groups
            .filter(group => group.requests.length > 0)
            .map(({ state, requests: group }) => (
              <section key={state} aria-label={stateLabels[state]}>
                <header className="rows__group">
                  <StateGlyph state={state} />
                  <span>{stateLabels[state]}</span>
                  <span className="mono">{group.length}</span>
                </header>
                {group.map(request => {
                  const run = request.workflowRuns[0];
                  const since = stepStarts.get(request.id) ?? run?.completedAt ?? run?.startedAt ?? request.createdAt;
                  return (
                    <Link className="row" href={`${base}/${request.id}`} key={request.id} role="listitem">
                      <StateGlyph state={state} />
                      <span className="row__title">{request.title}</span>
                      <span className="row__meta">
                        {run && run.remediationCount > 0 && <span className="muted">Fix attempts {run.remediationCount}</span>}
                        {workingStates.includes(state) ? (
                          <Timer since={since} />
                        ) : (
                          <span className="muted" title={formatDateTime(since)}>
                            {formatRelative(since)}
                          </span>
                        )}
                      </span>
                    </Link>
                  );
                })}
              </section>
            ))}
        </div>
      )}
    </>
  );
}
