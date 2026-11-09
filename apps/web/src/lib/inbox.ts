import type { WorkflowState } from "@sydeso/domain";

import { api } from "./api";
import type { FeatureWithLatestRun } from "./types";
import { humanGates, workingStates } from "./workflow";

/**
 * When the current step began. The list endpoint only carries the run's start, so for the rows
 * where the moment matters (a step running, a decision waiting) the detail is fetched and the
 * last transition's time is used. Everything else keeps the run's own timestamps.
 */
export async function stepStartedAt(requests: FeatureWithLatestRun[]): Promise<Map<string, string>> {
  const wanted = requests.filter(request => {
    const state = request.workflowRuns[0]?.currentState ?? request.status;
    return workingStates.includes(state) || humanGates.includes(state) || state === "escalated";
  });
  const details = await Promise.all(wanted.map(request => api.getFeature(request.id).catch(() => null)));
  const map = new Map<string, string>();
  details.forEach((detail, index) => {
    const request = wanted[index]!;
    const run = detail?.workflowRuns[0];
    const last = run ? [...run.transitions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] : null;
    map.set(request.id, last?.createdAt ?? run?.startedAt ?? request.createdAt);
  });
  return map;
}

export function stateOf(request: FeatureWithLatestRun): WorkflowState {
  return request.workflowRuns[0]?.currentState ?? request.status;
}
