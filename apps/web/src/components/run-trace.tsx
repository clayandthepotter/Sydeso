import type { WorkflowState } from "@sydeso/domain";
import { workflowStates } from "@sydeso/domain";

import { stateLabels } from "../lib/workflow";

// The request's progress as a plain left-to-right line with a circle per stage: filled with a
// check when done, a ring with a dot for the current stage, hollow for what is still ahead.
// When the request needs a person, the stage it stopped at turns red and says so.
const lineStates: WorkflowState[] = [...workflowStates, "released"];

export function RunTrace({ currentState, visited }: { currentState: WorkflowState; visited: WorkflowState[] }) {
  const escalated = currentState === "escalated";
  const reached = escalated
    ? Math.max(...visited.map(state => lineStates.indexOf(state)), 0)
    : lineStates.indexOf(currentState);
  const finished = currentState === "released";

  return (
    <ol className="steps" aria-label={`Request status: ${stateLabels[currentState]}`}>
      {lineStates.map((state, index) => {
        const status =
          index < reached || (finished && index === reached)
            ? "done"
            : index === reached
              ? escalated
                ? "alert"
                : "current"
              : "todo";
        return (
          <li className={`step step--${status}`} key={state} aria-current={status === "current" || status === "alert" ? "step" : undefined}>
            <span className="step__dot" aria-hidden="true">
              {status === "done" && (
                <svg viewBox="0 0 16 16" width="10" height="10">
                  <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {status === "alert" && <span className="step__bang">!</span>}
            </span>
            <span className="step__label">
              {stateLabels[state]}
              {status === "alert" && <span className="step__note">{stateLabels.escalated}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
