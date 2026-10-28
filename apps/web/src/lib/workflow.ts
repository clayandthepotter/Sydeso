import { defaultWorkflowRules, workflowStates, type WorkflowState, type WorkflowTransitionRule } from "@sydeso/domain";

export const boardStates: WorkflowState[] = [...workflowStates, "released", "escalated"];

/** Short labels, in the user's words, for lists, badges and notifications. */
export const stateLabels: Record<WorkflowState, string> = {
  backlog: "Submitted",
  design: "Designing",
  design_approval: "Approve design",
  development: "Building",
  automated_qa: "Testing",
  manual_review: "Approve result",
  ready: "Ready",
  released: "Released",
  escalated: "Needs you",
};

/** The one-line explanation shown only on the request page. */
export const stateLines: Record<WorkflowState, string> = {
  backlog: "Submitted. Starts when you press Start.",
  design: "The Architect is writing the technical design.",
  design_approval: "The design is ready. Approve it to start the build.",
  development: "The Developer is writing the code.",
  automated_qa: "The Tester is running the checks.",
  manual_review: "The checks passed. Review the result to finish.",
  ready: "Done.",
  released: "Merged.",
  escalated: "Stopped. See why below.",
};

/** Agents by role, capitalised, as the session names them. */
export const agentLabels: Record<string, string> = {
  research: "Researcher",
  pm: "Planner",
  architect: "Architect",
  developer: "Developer",
  qa: "Tester",
};

export function agentLabel(agentType: string | null | undefined) {
  if (!agentType) return "Agent";
  return agentLabels[agentType] ?? agentType.charAt(0).toUpperCase() + agentType.slice(1);
}

/** Which agent works a state, when one does. */
export const stateAgents: Partial<Record<WorkflowState, string>> = {
  design: "architect",
  development: "developer",
  automated_qa: "qa",
};

/** States where a person decides. */
export const humanGates: WorkflowState[] = ["design_approval", "manual_review"];

/** States where an agent is working. */
export const workingStates: WorkflowState[] = ["design", "development", "automated_qa"];

export type InboxGroup = "waiting" | "progress" | "unstarted" | "recent";

/** Where a request sits on Home. */
export function inboxGroup(state: WorkflowState): InboxGroup {
  if (state === "escalated" || humanGates.includes(state)) return "waiting";
  if (workingStates.includes(state)) return "progress";
  if (state === "backlog") return "unstarted";
  return "recent";
}

export const inboxGroupLabels: Record<InboxGroup, string> = {
  waiting: "Waiting on you",
  progress: "In progress",
  unstarted: "Not started",
  recent: "Recent",
};

export function transitionsFrom(state: WorkflowState): WorkflowTransitionRule[] {
  return defaultWorkflowRules.filter(rule => rule.from === state);
}

export type DecisionKind = "approve" | "reject" | "start" | "stop" | "escalate" | "regenerate" | "release";

export interface Decision {
  to: WorkflowState;
  label: string;
  kind: DecisionKind;
  /** The note is required before the button enables. */
  noteRequired?: boolean;
  /** One line under the button, only where the verb does not say it. */
  consequence?: string;
  /** The reason recorded on the transition when the user gives no note. */
  defaultReason?: string;
  agentType?: string;
}

/**
 * The decision row for a state: at most two primary buttons of equal weight, the rest in the
 * overflow. Only decisions the engine's rules allow are returned.
 */
export function decisionsFor(state: WorkflowState): { primary: Decision[]; overflow: Decision[] } {
  const rules = transitionsFrom(state);
  const rule = (to: WorkflowState) => rules.find(candidate => candidate.to === to);
  const primary: Decision[] = [];
  const overflow: Decision[] = [];
  const add = (list: Decision[], decision: Omit<Decision, "agentType">) => {
    const found = rule(decision.to);
    if (found) list.push({ ...decision, agentType: found.agentType });
  };

  switch (state) {
    case "backlog":
      add(primary, { to: "design", label: "Start", kind: "start", consequence: "Starts the design." });
      add(overflow, { to: "escalated", label: "Escalate", kind: "escalate", defaultReason: "Escalated" });
      break;
    case "design_approval":
      add(primary, { to: "development", label: "Approve", kind: "approve", consequence: "Starts the build." });
      add(primary, { to: "design", label: "Reject", kind: "reject", noteRequired: true });
      add(overflow, { to: "design", label: "Regenerate design", kind: "regenerate", defaultReason: "Regenerate" });
      add(overflow, { to: "escalated", label: "Escalate", kind: "escalate", defaultReason: "Escalated" });
      break;
    case "manual_review":
      add(primary, { to: "ready", label: "Approve", kind: "approve", consequence: "Marks the request done." });
      add(primary, { to: "development", label: "Reject", kind: "reject", noteRequired: true });
      add(overflow, { to: "escalated", label: "Escalate", kind: "escalate", defaultReason: "Escalated" });
      break;
    case "design":
    case "development":
    case "automated_qa":
      add(overflow, { to: "escalated", label: "Stop", kind: "stop", defaultReason: "Stopped" });
      break;
    case "ready":
      add(overflow, { to: "released", label: "Mark released", kind: "release" });
      break;
    default:
      break;
  }
  return { primary, overflow };
}

/** What a recorded human decision was, from the transition it produced. */
export function decisionLabel(from: WorkflowState | null, to: WorkflowState) {
  if (to === "escalated") return from && workingStates.includes(from) ? "Stopped" : "Escalated";
  if (from === "backlog" && to === "design") return "Started";
  if (from === "design_approval" && to === "development") return "Approved";
  if (from === "design_approval" && to === "design") return "Asked for changes";
  if (from === "manual_review" && to === "ready") return "Approved";
  if (from === "manual_review" && to === "development") return "Asked for changes";
  if (to === "released") return "Released";
  return `Moved to ${stateLabels[to]}`;
}

export function shortId(id: string) {
  return id.slice(0, 8);
}
