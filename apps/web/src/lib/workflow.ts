import { defaultWorkflowRules, workflowStates, type WorkflowState, type WorkflowTransitionRule } from "@sydeso/domain";

export const boardStates: WorkflowState[] = [...workflowStates, "released", "escalated"];

export const stateLabels: Record<WorkflowState, string> = {
  backlog: "Backlog",
  design: "Design",
  design_approval: "Design approval",
  development: "Development",
  automated_qa: "Automated QA",
  manual_review: "Manual review",
  ready: "Ready",
  released: "Released",
  escalated: "Escalated",
};

export const humanGates: WorkflowState[] = ["design_approval", "manual_review"];

export function transitionsFrom(state: WorkflowState): WorkflowTransitionRule[] {
  return defaultWorkflowRules.filter(rule => rule.from === state);
}

export function describeTransition(rule: WorkflowTransitionRule) {
  if (rule.to === "escalated") return "Escalate";
  if (rule.requiresApproval) return `Approve → ${stateLabels[rule.to]}`;
  if (rule.createsJob) return `Send to ${stateLabels[rule.to]}`;
  return `Move to ${stateLabels[rule.to]}`;
}

export function shortId(id: string) {
  return id.slice(0, 8);
}
