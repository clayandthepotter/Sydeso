import Link from "next/link";

import { StateBadge } from "../../../../../components/state-badge";
import { api } from "../../../../../lib/api";
import { formatRelative } from "../../../../../lib/format";
import { boardStates, humanGates, shortId, stateLabels } from "../../../../../lib/workflow";

export const metadata = { title: "Features" };

export default async function FeaturesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const features = await api.listFeatures(projectId);

  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="display">Features</h1>
          <p className="muted">
            {features.length} feature{features.length === 1 ? "" : "s"}, each with one active workflow run. Columns are
            the workflow states; the record moves cards, not people.
          </p>
        </div>
      </div>

      {features.length === 0 ? (
        <div className="empty mono-text">
          No features yet.{" "}
          <Link href={`/app/projects/${projectId}/features/new`} style={{ textDecoration: "underline" }}>
            Create the first feature request
          </Link>
          .
        </div>
      ) : (
        <div className="board" role="list" aria-label="Features by workflow state">
          {boardStates.map(state => {
            const column = features.filter(feature => (feature.workflowRuns[0]?.currentState ?? feature.status) === state);
            const modifier = state === "escalated" ? "board__col--alert" : humanGates.includes(state) ? "board__col--gate" : "";
            return (
              <section className={`board__col ${modifier}`} key={state} aria-label={stateLabels[state]}>
                <header className="board__head mono">
                  <span>{stateLabels[state]}</span>
                  <span>{column.length}</span>
                </header>
                <div className="board__cards">
                  {column.map(feature => {
                    const run = feature.workflowRuns[0];
                    return (
                      <Link className="card" href={`/app/projects/${projectId}/features/${feature.id}`} key={feature.id} role="listitem">
                        <span className="card__title">{feature.title}</span>
                        <span className="card__meta mono">
                          <span>{shortId(feature.id)}</span>
                          <span>{formatRelative(run?.startedAt ?? feature.createdAt)}</span>
                        </span>
                        {run && run.remediationCount > 0 && (
                          <span className="mono-text muted">
                            Remediation {run.remediationCount}
                          </span>
                        )}
                        {run?.status !== "active" && run && <StateBadge state={run.currentState} />}
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
