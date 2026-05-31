import { workflowStates } from "@sydeso/domain";

import { WorkflowTimeline } from "../components/workflow-timeline";

const metrics = [
  ["Active features", "12"],
  ["Awaiting approval", "3"],
  ["Runner health", "2 online"],
];

export default function Home() {
  return (
    <section>
      <div className="hero">
        <div className="eyebrow">Workflow-first application platform</div>
        <h1>Move software requests from idea to verified implementation.</h1>
        <p>
          Sydeso coordinates product, architecture, development, QA, and human approval through auditable workflow state.
        </p>
      </div>

      <div className="grid" aria-label="Workspace metrics">
        {metrics.map(([label, value]) => (
          <div className="card" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <WorkflowTimeline states={workflowStates} currentState="design_approval" />
    </section>
  );
}
