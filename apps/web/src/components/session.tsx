import Link from "next/link";

import type { Artifact } from "../lib/types";
import type { SessionBlock } from "../lib/run-session";
import { formatDateTime, formatRelative } from "../lib/format";
import { DecisionRow } from "./decision-row";
import { Fold } from "./fold";
import { Icon } from "./icons";
import { JsonView } from "./json-view";
import { StateGlyph } from "./state-glyph";
import { Timer } from "./timer";
import type { Decision } from "../lib/workflow";

function documentHref(projectId: string, document: Artifact) {
  return `/app/projects/${projectId}/documents/${document.id}`;
}

/** Plain-language fields a document may carry; anything else sits behind the full document. */
function Evidence({ document, projectId, label }: { document: Artifact; projectId: string; label: string }) {
  const content = (document.content ?? {}) as Record<string, unknown>;
  const summary = typeof content.summary === "string" ? content.summary : null;
  const list = (key: string) => (Array.isArray(content[key]) ? (content[key] as unknown[]).filter(item => typeof item === "string") : []);
  const criteria = list("acceptanceCriteria");
  const risks = list("risks");
  const touches = list("files").length > 0 ? list("files") : list("touches");
  const hasPlain = summary || criteria.length || risks.length || touches.length;

  return (
    <div className="evidence">
      {summary && <p className="prose">{summary}</p>}
      {touches.length > 0 && (
        <div className="evidence__group">
          <p className="hint">Touches</p>
          <ul className="evidence__list mono-text">
            {touches.map(item => (
              <li key={item as string}>{item as string}</li>
            ))}
          </ul>
        </div>
      )}
      {criteria.length > 0 && (
        <div className="evidence__group">
          <p className="hint">Checked by</p>
          <ul className="evidence__list">
            {criteria.map(item => (
              <li key={item as string}>{item as string}</li>
            ))}
          </ul>
        </div>
      )}
      {risks.length > 0 && (
        <div className="evidence__group">
          <p className="hint">Flagged</p>
          <ul className="evidence__list">
            {risks.map(item => (
              <li key={item as string}>{item as string}</li>
            ))}
          </ul>
        </div>
      )}
      <Fold label={label} open={!hasPlain}>
        {document.storageKey ? (
          <p className="muted">
            A file. <Link className="link" href={documentHref(projectId, document)}>Open it</Link>.
          </p>
        ) : (
          <JsonView value={document.content} />
        )}
        <p className="hint">
          <Link className="link" href={documentHref(projectId, document)}>
            {document.title}
          </Link>{" "}
          · v{document.version}
        </p>
      </Fold>
    </div>
  );
}

/**
 * The body of a request page: one block per step, read top to bottom. The current block is
 * expanded; finished ones collapse to a header and a line.
 */
export function Session({
  blocks,
  projectId,
  requestId,
  workflowRunId,
  decisions,
  evidence,
  openDetails,
}: {
  blocks: SessionBlock[];
  projectId: string;
  requestId: string;
  workflowRunId: string;
  decisions: { primary: Decision[]; overflow: Decision[] };
  /** The documents a gate judges, by gate state. */
  evidence: Partial<Record<string, { document: Artifact; label: string }[]>>;
  openDetails?: boolean;
}) {
  return (
    <section className="session" aria-label="Session">
      {blocks.map(block => {
        const running = block.current && block.kind === "agent" && block.job?.status !== "failed" && block.job?.status !== "cancelled";
        const expanded = block.current || block.lines.some(line => line.tone === "danger");
        const summary = block.lines.length > 0 ? block.lines[block.lines.length - 1]!.text : block.documents.length > 0 ? `${block.documents.length} document${block.documents.length === 1 ? "" : "s"}` : null;
        return (
          <article className={`block block--${block.kind} ${block.current ? "block--current" : ""}`} key={block.key}>
            <header className="block__head">
              <StateGlyph state={block.state} />
              <span className="block__actor">{block.actor}</span>
              <span className="block__step">{block.step}</span>
              <span className="block__time">
                {block.kind === "agent" ? (
                  <Timer since={block.startedAt} until={running ? null : (block.endedAt ?? block.startedAt)} />
                ) : (
                  <span className="muted" title={formatDateTime(block.startedAt)}>
                    {formatRelative(block.startedAt)}
                  </span>
                )}
              </span>
            </header>

            {expanded ? (
              <>
                {block.lines.length > 0 && (
                  <ul className="block__lines">
                    {block.lines.map((line, index) => (
                      <li className={`line ${line.tone ? `line--${line.tone}` : ""}`} key={`${line.at}-${index}`}>
                        <span>{line.text}</span>
                        <span className="muted mono-text">{formatRelative(line.at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {block.current && block.kind === "gate" && (evidence[block.state] ?? []).map(({ document, label }) => (
                  <Evidence key={document.id} document={document} projectId={projectId} label={label} />
                ))}
                {block.current && block.kind === "gate" && (evidence[block.state] ?? []).length === 0 && (
                  <p className="muted">No document to judge. Add one below or reject.</p>
                )}
                {block.documents.length > 0 && (
                  <Fold label="Documents" count={block.documents.length} open={openDetails}>
                    <ul className="evidence__list">
                      {block.documents.map(document => (
                        <li key={document.id}>
                          <Link className="link" href={documentHref(projectId, document)}>
                            {document.title}
                          </Link>{" "}
                          <span className="mono-text muted">{document.type} · v{document.version}</span>
                        </li>
                      ))}
                    </ul>
                  </Fold>
                )}
                {block.job && (block.job.error !== null && block.job.error !== undefined) && (
                  <Fold label="Raw log" open={openDetails}>
                    <JsonView value={block.job.error} />
                  </Fold>
                )}
                {block.job && (
                  <Fold label="Details" open={openDetails}>
                    <ul className="evidence__list mono-text muted">
                      <li>job {block.job.id}</li>
                      <li>attempt {block.job.attempt}</li>
                      <li>status {block.job.status}</li>
                      {block.job.requiredCapabilities.length > 0 && <li>needs {block.job.requiredCapabilities.join(", ")}</li>}
                    </ul>
                  </Fold>
                )}
                {block.current && decisions.primary.length > 0 && (
                  <DecisionRow
                    workflowRunId={workflowRunId}
                    requestId={requestId}
                    projectId={projectId}
                    primary={decisions.primary}
                    overflow={decisions.overflow}
                  />
                )}
              </>
            ) : (
              summary && (
                <div className="block__summary muted">
                  <span>{summary}</span>
                  {block.lines.length > 1 && (
                    <Fold label="Activity" count={block.lines.length}>
                      <ul className="block__lines">
                        {block.lines.map((line, index) => (
                          <li className={`line ${line.tone ? `line--${line.tone}` : ""}`} key={`${line.at}-${index}`}>
                            <span>{line.text}</span>
                            <span className="muted mono-text">{formatRelative(line.at)}</span>
                          </li>
                        ))}
                      </ul>
                    </Fold>
                  )}
                </div>
              )
            )}
          </article>
        );
      })}
      {blocks.length === 0 && (
        <p className="muted">
          <Icon name="circle" size={14} /> Not started.
        </p>
      )}
    </section>
  );
}
