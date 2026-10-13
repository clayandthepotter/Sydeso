import type { WorkflowState } from "@sydeso/domain";

import type { JobStatus, RunnerStatus } from "../lib/types";
import { humanGates, stateLabels } from "../lib/workflow";

export function StateBadge({ state, live = false }: { state: WorkflowState; live?: boolean }) {
  const variant =
    state === "escalated"
      ? "badge--alert"
      : state === "released"
        ? "badge--filled"
        : humanGates.includes(state)
          ? "badge--accent"
          : "";
  return (
    <span className={`badge mono ${variant}`}>
      {live && <span className="dot dot--pulse" aria-hidden="true" />}
      {stateLabels[state]}
    </span>
  );
}

export function JobBadge({ status }: { status: JobStatus }) {
  const variant =
    status === "failed" || status === "cancelled"
      ? "badge--alert"
      : status === "succeeded"
        ? "badge--filled"
        : status === "running"
          ? "badge--accent"
          : "badge--muted";
  return (
    <span className={`badge mono ${variant}`}>
      {status === "running" && <span className="dot dot--pulse" aria-hidden="true" />}
      {status}
    </span>
  );
}

export function RunnerBadge({ status }: { status: RunnerStatus }) {
  const variant =
    status === "online" ? "badge--filled" : status === "busy" ? "badge--accent" : status === "disabled" ? "badge--alert" : "badge--muted";
  return (
    <span className={`badge mono ${variant}`}>
      <span className={`dot ${status === "busy" ? "dot--pulse" : ""}`} aria-hidden="true" />
      {status}
    </span>
  );
}
