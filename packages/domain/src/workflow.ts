import type { WorkflowState, WorkflowTransitionRule } from "./types";

export const workflowStates: WorkflowState[] = [
  "backlog",
  "design",
  "design_approval",
  "development",
  "automated_qa",
  "manual_review",
  "ready",
];

export const defaultWorkflowRules: WorkflowTransitionRule[] = [
  {
    from: "backlog",
    to: "design",
    createsJob: true,
    agentType: "architect",
    requiredArtifactTypes: ["feature_request"],
  },
  {
    from: "design",
    to: "design_approval",
    requiredArtifactTypes: ["design_package"],
  },
  { from: "design", to: "escalated" },
  {
    from: "design_approval",
    to: "design",
    createsJob: true,
    agentType: "architect",
    requiredArtifactTypes: ["feature_request"],
  },
  {
    from: "design_approval",
    to: "development",
    requiresApproval: true,
    createsJob: true,
    agentType: "developer",
    requiredArtifactTypes: ["design_package"],
    requiredCapabilities: ["git", "filesystem", "terminal", "node"],
  },
  { from: "design_approval", to: "escalated" },
  {
    from: "development",
    to: "automated_qa",
    createsJob: true,
    agentType: "qa",
    requiredArtifactTypes: ["implementation_package"],
    requiredCapabilities: ["docker", "node", "playwright", "browser_automation"],
  },
  { from: "development", to: "escalated" },
  {
    from: "automated_qa",
    to: "manual_review",
    requiredArtifactTypes: ["qa_report"],
  },
  {
    from: "automated_qa",
    to: "development",
    createsJob: true,
    agentType: "developer",
    requiredArtifactTypes: ["qa_report"],
    requiredCapabilities: ["git", "filesystem", "terminal", "node"],
  },
  { from: "automated_qa", to: "escalated" },
  { from: "manual_review", to: "ready", requiresApproval: true },
  { from: "manual_review", to: "escalated" },
  {
    from: "manual_review",
    to: "development",
    createsJob: true,
    agentType: "developer",
    requiredCapabilities: ["git", "filesystem", "terminal", "node"],
  },
  { from: "ready", to: "released" },
];

export function hasRequiredCapabilities(runnerCapabilities: string[], requiredCapabilities: string[]) {
  const runnerCapabilitySet = new Set(runnerCapabilities);
  return requiredCapabilities.every(capability => runnerCapabilitySet.has(capability));
}
