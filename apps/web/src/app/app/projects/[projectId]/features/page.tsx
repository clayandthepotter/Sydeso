import Link from "next/link";

import { Icon } from "../../../../../components/icons";
import { StateBadge } from "../../../../../components/state-badge";
import { StateGlyph } from "../../../../../components/state-glyph";
import { api } from "../../../../../lib/api";
import { formatDateTime, formatRelative } from "../../../../../lib/format";
import { boardStates, humanGates, shortId, stateLabels } from "../../../../../lib/workflow";

export const metadata = { title: "Features" };

export default async function FeaturesPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const [{ projectId }, { view }] = await Promise.all([params, searchParams]);
  const features = await api.listFeatures(projectId);
  const board = view === "board";
  const stateOf = (feature: (typeof features)[number]) => feature.workflowRuns[0]?.currentState ?? feature.status;
  const groups = boardStates.map(state => ({ state, features: features.filter(feature => stateOf(feature) === state) }));

  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="display">Features</h1>
          <p className="muted">
            {features.length} feature{features.length === 1 ? "" : "s"}, each with one active workflow run. The record
            moves them between states, not people.
          </p>
        </div>
        <div className="seg" role="group" aria-label="View">
          <Link className="btn btn--sm" href={`/app/projects/${projectId}/features`} aria-current={board ? undefined : "page"}>
            <Icon name="feature" size={14} />
            List
          </Link>
          <Link className="btn btn--sm" href={`/app/projects/${projectId}/features?view=board`} aria-current={board ? "page" : undefined}>
            <Icon name="project" size={14} />
            Board
          </Link>
        </div>
      </div>

      {features.length === 0 ? (
        <div className="empty">
          No features yet. <Link href={`/app/projects/${projectId}/features/new`}>Create the first feature request</Link>.
        </div>
      ) : board ? (
        <div className="board" role="list" aria-label="Features by workflow state">
          {groups.map(({ state, features: column }) => {
            const modifier = state === "escalated" ? "board__col--alert" : humanGates.includes(state) ? "board__col--gate" : "";
            return (
              <section className={`board__col ${modifier}`} key={state} aria-label={stateLabels[state]}>
                <header className="board__head">
                  <span>{stateLabels[state]}</span>
                  <span>{column.length}</span>
                </header>
                <div className="board__cards">
                  {column.map(feature => {
                    const run = feature.workflowRuns[0];
                    return (
                      <Link className="card" href={`/app/projects/${projectId}/features/${feature.id}`} key={feature.id} role="listitem">
                        <span className="card__title">{feature.title}</span>
                        <span className="card__meta">
                          <span className="mono-text">{shortId(feature.id)}</span>
                          <span>{formatRelative(run?.startedAt ?? feature.createdAt)}</span>
                        </span>
                        {run && run.remediationCount > 0 && <span className="hint">Remediation {run.remediationCount}</span>}
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="rows" role="list" aria-label="Features by workflow state">
          {groups
            .filter(group => group.features.length > 0)
            .map(({ state, features: group }) => (
              <section key={state} aria-label={stateLabels[state]}>
                <header className="rows__group">
                  <StateGlyph state={state} />
                  <span>{stateLabels[state]}</span>
                  <span className="mono">{group.length}</span>
                </header>
                {group.map(feature => {
                  const run = feature.workflowRuns[0];
                  return (
                    <Link className="row" href={`/app/projects/${projectId}/features/${feature.id}`} key={feature.id} role="listitem">
                      <StateGlyph state={state} />
                      <span className="row__id mono-text">{shortId(feature.id)}</span>
                      <span className="row__title">{feature.title}</span>
                      <span className="row__meta">
                        {run && run.remediationCount > 0 && (
                          <span className="badge mono badge--warn">Remediation {run.remediationCount}</span>
                        )}
                        {run && run.status !== "active" && <StateBadge state={run.currentState} />}
                        <span className="muted" title={formatDateTime(run?.startedAt ?? feature.createdAt)}>
                          {formatRelative(run?.startedAt ?? feature.createdAt)}
                        </span>
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
