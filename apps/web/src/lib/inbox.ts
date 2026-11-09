import type { WorkflowState } from "@sydeso/domain";

import type { FeatureWithLatestRun } from "./types";

/** When each request's current step began, as the list endpoint reports it. */
export function stepStartedAt(requests: FeatureWithLatestRun[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const request of requests) {
    const run = request.workflowRuns[0];
    map.set(request.id, run?.stateEnteredAt ?? run?.startedAt ?? request.createdAt);
  }
  return map;
}

export function stateOf(request: FeatureWithLatestRun): WorkflowState {
  return request.workflowRuns[0]?.currentState ?? request.status;
}

/** A closed request keeps its last state but is no longer active work. */
export function isClosed(request: FeatureWithLatestRun) {
  return request.workflowRuns[0]?.status === "closed";
}
