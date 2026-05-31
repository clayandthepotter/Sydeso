export type WorkflowState =
  | "backlog"
  | "design"
  | "design_approval"
  | "development"
  | "automated_qa"
  | "manual_review"
  | "ready"
  | "released"
  | "escalated";

export type ArtifactType =
  | "feature_request"
  | "prd"
  | "research_report"
  | "design_package"
  | "implementation_package"
  | "qa_report"
  | "review_report"
  | "release_candidate"
  | "skill_file"
  | "workflow_template"
  | "policy_definition";

export type ActorType = "user" | "agent" | "system" | "runner";

export type AgentType = "pm" | "architect" | "developer" | "qa";

export interface WorkflowTransitionRule {
  from: WorkflowState;
  to: WorkflowState;
  requiresApproval?: boolean;
  createsJob?: boolean;
  agentType?: AgentType;
  requiredArtifactTypes?: ArtifactType[];
  requiredCapabilities?: string[];
}
