import type { WorkflowState } from "@sydeso/domain";
import { workflowStates } from "@sydeso/domain";

import { stateLabels } from "../lib/workflow";

// The run as a PCB trace: the main line carries the seven working states plus
// released; escalated hangs off the line and only lights when the run is there.
const lineStates: WorkflowState[] = [...workflowStates, "released"];

export function RunTrace({ currentState, visited }: { currentState: WorkflowState; visited: WorkflowState[] }) {
  const width = 1000;
  const step = (width - 120) / (lineStates.length - 1);
  const nodes = lineStates.map((state, index) => ({
    state,
    x: 60 + index * step,
    y: index % 2 === 0 ? 48 : 96,
  }));
  const escalated = { x: width - 60, y: 152 };

  const segment = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dy = Math.abs(b.y - a.y);
    const flat = b.x - a.x - dy;
    return `L${a.x + flat / 2} ${a.y} L${a.x + flat / 2 + dy} ${b.y} L${b.x} ${b.y}`;
  };
  const pathThrough = (points: Array<{ x: number; y: number }>) =>
    points.map((point, index) => (index === 0 ? `M${point.x} ${point.y}` : segment(points[index - 1], point))).join(" ");

  const currentIndex = lineStates.indexOf(currentState);
  const litCount = currentState === "escalated" ? Math.max(...visited.map(state => lineStates.indexOf(state)), 0) + 1 : currentIndex + 1;
  const bed = pathThrough(nodes);
  const live = pathThrough(nodes.slice(0, Math.max(1, litCount)));
  const lastLit = nodes[Math.max(0, litCount - 1)];
  const escalatedPath = `M${lastLit.x} ${lastLit.y} ${segment(lastLit, escalated)}`;

  return (
    <div className="trace" data-ui>
      <svg viewBox={`0 0 ${width} 176`} role="img" aria-label={`Workflow run, currently ${stateLabels[currentState]}`}>
        <path d={bed} fill="none" stroke="var(--surface-2)" strokeWidth="10" strokeLinejoin="miter" />
        {litCount > 1 && <path d={live} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinejoin="miter" />}
        {currentState === "escalated" && (
          <path d={escalatedPath} fill="none" stroke="var(--alert)" strokeWidth="4" strokeLinejoin="miter" />
        )}
        {nodes.map((node, index) => {
          const on = visited.includes(node.state) || index < litCount;
          const current = node.state === currentState;
          const last = index === nodes.length - 1;
          const labelY = node.y === 48 || last ? node.y - 20 : node.y + 30;
          return (
            <g key={node.state} className={`node ${on ? "is-on" : ""} ${current ? "is-current" : ""}`}>
              <rect
                x={node.x - 10}
                y={node.y - 10}
                width="20"
                height="20"
                fill="var(--bg)"
                stroke={current ? "var(--accent)" : on ? "var(--accent)" : "var(--line-strong)"}
                strokeWidth="1.5"
              />
              <rect x={node.x - 4} y={node.y - 4} width="8" height="8" fill={on ? "var(--accent)" : "var(--surface-2)"}>
                {current && <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite" />}
              </rect>
              <text x={node.x} y={labelY} textAnchor="middle">
                {stateLabels[node.state]}
              </text>
            </g>
          );
        })}
        <g className={`node ${currentState === "escalated" ? "is-escalated" : ""}`}>
          <rect
            x={escalated.x - 10}
            y={escalated.y - 10}
            width="20"
            height="20"
            fill="var(--bg)"
            stroke={currentState === "escalated" ? "var(--alert)" : "var(--line-strong)"}
            strokeWidth="1.5"
          />
          <rect
            x={escalated.x - 4}
            y={escalated.y - 4}
            width="8"
            height="8"
            fill={currentState === "escalated" ? "var(--alert)" : "var(--surface-2)"}
          />
          <text x={escalated.x - 18} y={escalated.y + 4} textAnchor="end">
            {stateLabels.escalated}
          </text>
        </g>
      </svg>
    </div>
  );
}
