import type { WorkflowState } from "@sydeso/domain";

import { Icon, type IconName } from "./icons";
import { stateLabels } from "../lib/workflow";

/**
 * The 16px status glyph at the start of a feature row: an open circle for backlog, a half
 * circle while work is in progress, a check when ready or released, a warning when escalated.
 * Colour follows the state; the label is always beside it or in the tooltip.
 */
const glyphs: Record<WorkflowState, { icon: IconName; tone: string }> = {
  backlog: { icon: "circle", tone: "var(--muted)" },
  design: { icon: "circle-dot", tone: "var(--ink-2)" },
  design_approval: { icon: "circle-half", tone: "var(--accent)" },
  development: { icon: "circle-half", tone: "var(--ink-2)" },
  automated_qa: { icon: "circle-half", tone: "var(--ink-2)" },
  manual_review: { icon: "circle-half", tone: "var(--accent)" },
  ready: { icon: "circle-check", tone: "var(--ink)" },
  released: { icon: "circle-check", tone: "var(--accent)" },
  escalated: { icon: "alert", tone: "var(--danger)" },
};

export function StateGlyph({ state }: { state: WorkflowState }) {
  const glyph = glyphs[state];
  return (
    <span className="row__glyph" style={{ color: glyph.tone }} title={stateLabels[state]}>
      <Icon name={glyph.icon} />
    </span>
  );
}
