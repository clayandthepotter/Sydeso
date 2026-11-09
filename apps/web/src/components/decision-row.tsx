"use client";

import { useActionState, useState, type ReactNode } from "react";

import { transitionAction, type ActionState } from "../app/app/actions";
import type { Decision } from "../lib/workflow";
import { Icon } from "./icons";

interface Props {
  workflowRunId: string;
  requestId: string;
  projectId: string;
  primary: Decision[];
  overflow: Decision[];
}

function Hidden({ workflowRunId, requestId, projectId }: Pick<Props, "workflowRunId" | "requestId" | "projectId">) {
  return (
    <>
      <input type="hidden" name="workflowRunId" value={workflowRunId} />
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="projectId" value={projectId} />
    </>
  );
}

/**
 * The decision row at a gate: at most two buttons of equal weight, one note field, and an
 * overflow menu for the rest. Reject needs a note before it enables.
 */
export function DecisionRow({ workflowRunId, requestId, projectId, primary, overflow }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(transitionAction, {});
  const [note, setNote] = useState("");
  const needsNote = primary.some(decision => decision.noteRequired);

  if (primary.length === 0) return null;

  return (
    <form className="decision" action={formAction}>
      <Hidden workflowRunId={workflowRunId} requestId={requestId} projectId={projectId} />
      {needsNote && (
        <div className="field">
          <label htmlFor={`note-${workflowRunId}`}>{note ? "Note" : "Note, required to reject"}</label>
          <input
            id={`note-${workflowRunId}`}
            className="input"
            name="reason"
            value={note}
            onChange={event => setNote(event.target.value)}
            maxLength={500}
            autoComplete="off"
          />
        </div>
      )}
      <div className="decision__row">
        {primary.map(decision => (
          <span className="decision__choice" key={decision.to + decision.kind}>
            <button
              className="btn"
              type="submit"
              name="decision"
              value={`${decision.to}|${decision.kind}`}
              disabled={pending || (decision.noteRequired && note.trim().length === 0)}
            >
              {decision.label}
            </button>
            {decision.consequence && <span className="hint">{decision.consequence}</span>}
          </span>
        ))}
        {overflow.length > 0 && (
          <details className="more">
            <summary className="btn btn--icon" aria-label="More">
              <Icon name="menu" />
            </summary>
            <div className="more__menu" role="menu">
              {overflow.map(decision => (
                <button
                  key={decision.to + decision.kind}
                  className="menu__item"
                  type="submit"
                  role="menuitem"
                  name="decision"
                  value={`${decision.to}|${decision.kind}`}
                  disabled={pending}
                >
                  {decision.label}
                </button>
              ))}
            </div>
          </details>
        )}
      </div>
      {state.error && <p className="notice notice--error">{state.error}</p>}
    </form>
  );
}

/**
 * The page header's overflow menu: copy link, the repository, and the decisions that have no
 * row of their own (Stop while an agent works, Mark released).
 */
export function HeaderMenu({ workflowRunId, requestId, projectId, decisions, children }: Omit<Props, "primary" | "overflow"> & { decisions: Decision[]; children?: ReactNode }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(transitionAction, {});
  return (
    <details className="more">
      <summary className="btn btn--icon" aria-label="More">
        <Icon name="menu" />
      </summary>
      <div className="more__menu" role="menu">
        {children}
        {decisions.length > 0 && (
          <form action={formAction}>
            <Hidden workflowRunId={workflowRunId} requestId={requestId} projectId={projectId} />
            {decisions.map(decision => (
              <button
                key={decision.to + decision.kind}
                className="menu__item"
                type="submit"
                role="menuitem"
                name="decision"
                value={`${decision.to}|${decision.kind}`}
                disabled={pending}
              >
                {decision.label}
              </button>
            ))}
          </form>
        )}
        {state.error && <p className="hint hint--error">{state.error}</p>}
      </div>
    </details>
  );
}
