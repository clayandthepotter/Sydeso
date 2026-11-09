import type { WorkflowState } from "@sydeso/domain";
import { workflowStates } from "@sydeso/domain";

import { stateLabels } from "../lib/workflow";

// The run as a PCB trace, drawn the way sydeso.com draws it: a wide bed, a narrow live line in
// the theme's strong colour, square pads with a core, mono capitals for the labels, on a dot grid.
// Escalated hangs off the line and only lights, in red, when the run is there.
const lineStates: WorkflowState[] = [...workflowStates, "released"];

export function RunTrace({ currentState, visited }: { currentState: WorkflowState; visited: WorkflowState[] }) {
  const width = 1000;
  const step = (width - 120) / (lineStates.length - 1);
  const nodes = lineStates.map((state, index) => ({
    state,
    x: 60 + index * step,
    y: index % 2 === 0 ? 52 : 104,
  }));
  const escalated = { x: width - 60, y: 160 };

  const segment = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dy = Math.abs(b.y - a.y);
    const flat = b.x - a.x - dy;
    return `L${a.x + flat / 2} ${a.y} L${a.x + flat / 2 + dy} ${b.y} L${b.x} ${b.y}`;
  };
  const pathThrough = (points: Array<{ x: number; y: number }>) =>
    points.map((point, index) => (index === 0 ? `M${point.x} ${point.y}` : segment(points[index - 1], point))).join(" ");

  const isEscalated = currentState === "escalated";
  const currentIndex = lineStates.indexOf(currentState);
  const litCount = isEscalated ? Math.max(...visited.map(state => lineStates.indexOf(state)), 0) + 1 : currentIndex + 1;
  const bed = pathThrough(nodes);
  const live = pathThrough(nodes.slice(0, Math.max(1, litCount)));
  const lastLit = nodes[Math.max(0, litCount - 1)];
  // Leave the line downward first, then run along the bottom, so the branch never rides the bed.
  const drop = escalated.y - lastLit.y;
  const escalatedPath = `M${lastLit.x} ${lastLit.y} L${lastLit.x + drop} ${escalated.y} L${escalated.x} ${escalated.y}`;

  return (
    <div className="trace" data-ui>
      <svg viewBox={`0 0 ${width} 206`} role="img" aria-label={`Request status: ${stateLabels[currentState]}`}>
        <path className="trace__bed" d={bed} />
        {litCount > 1 && <path className="trace__live" d={live} />}
        {isEscalated && <path className="trace__live trace__live--alert" d={escalatedPath} />}
        {nodes.map((node, index) => {
          const on = visited.includes(node.state) || index < litCount;
          const current = node.state === currentState;
          const last = index === nodes.length - 1;
          const labelY = node.y === 52 || last ? node.y - 24 : node.y + 34;
          return (
            <g key={node.state} className={`node ${on ? "is-on" : ""} ${current ? "is-current" : ""}`}>
              <rect className="node__pad" x={node.x - 12} y={node.y - 12} width="24" height="24" />
              <rect className="node__core" x={node.x - 4.5} y={node.y - 4.5} width="9" height="9" />
              <text x={node.x} y={labelY} textAnchor="middle">
                {stateLabels[node.state]}
              </text>
            </g>
          );
        })}
        <g className={`node node--alert ${isEscalated ? "is-on is-current" : ""}`}>
          <rect className="node__pad" x={escalated.x - 12} y={escalated.y - 12} width="24" height="24" />
          <rect className="node__core" x={escalated.x - 4.5} y={escalated.y - 4.5} width="9" height="9" />
          <text x={escalated.x} y={escalated.y + 34} textAnchor="middle">
            {stateLabels.escalated}
          </text>
        </g>
      </svg>
    </div>
  );
}
