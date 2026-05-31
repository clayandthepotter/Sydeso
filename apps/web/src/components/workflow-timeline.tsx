import type { WorkflowState } from "@sydeso/domain";

const labels: Record<WorkflowState, string> = {
  backlog: "Backlog",
  design: "Design",
  design_approval: "Design Approval",
  development: "Development",
  automated_qa: "Automated QA",
  manual_review: "Manual Review",
  ready: "Ready",
  released: "Released",
  escalated: "Escalated",
};

export function WorkflowTimeline({
  states,
  currentState,
}: {
  states: WorkflowState[];
  currentState: WorkflowState;
}) {
  return (
    <div className="card" style={{ marginTop: "1rem" }}>
      <strong>Default workflow</strong>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" }}>
        {states.map(state => (
          <span
            key={state}
            style={{
              border: "1px solid var(--border)",
              borderRadius: "999px",
              color: state === currentState ? "#06120f" : "var(--muted)",
              background: state === currentState ? "var(--accent)" : "transparent",
              padding: "0.5rem 0.75rem",
            }}
          >
            {labels[state]}
          </span>
        ))}
      </div>
    </div>
  );
}
