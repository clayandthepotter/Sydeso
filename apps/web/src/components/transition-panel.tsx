"use client";

import { useActionState } from "react";

import { transitionAction, type ActionState } from "../app/app/actions";

export interface TransitionOption {
  to: string;
  label: string;
  kind: "approve" | "escalate" | "job" | "move";
  agentType?: string;
  requiredCapabilities?: string[];
}

export function TransitionPanel({
  workflowRunId,
  featureId,
  projectId,
  options,
}: {
  workflowRunId: string;
  featureId: string;
  projectId: string;
  options: TransitionOption[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(transitionAction, {});

  if (options.length === 0) {
    return <p className="muted">This run has no further transitions.</p>;
  }

  return (
    <form className="actions" action={formAction}>
      <input type="hidden" name="workflowRunId" value={workflowRunId} />
      <input type="hidden" name="featureId" value={featureId} />
      <input type="hidden" name="projectId" value={projectId} />
      <div className="field">
        <label className="mono" htmlFor="transition-reason">
          Reason
        </label>
        <textarea id="transition-reason" className="input" name="reason" rows={3} placeholder="Recorded on the transition" />
      </div>
      {options.map(option => (
        <button
          key={option.to}
          className={`btn ${option.kind === "approve" ? "btn--accent" : option.kind === "escalate" ? "btn--alert" : "btn--ghost"}`}
          type="submit"
          name="toState"
          value={option.to}
          disabled={pending}
          title={option.agentType ? `Queues a ${option.agentType} job` : undefined}
        >
          {option.label}
          {option.agentType && <span className="mono">· {option.agentType} job</span>}
        </button>
      ))}
      {state.error && <p className="notice notice--error mono-text">{state.error}</p>}
    </form>
  );
}
