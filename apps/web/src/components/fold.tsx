import type { ReactNode } from "react";

import { Icon } from "./icons";

/** A borderless accordion: a chevron and a label, nothing else. */
export function Fold({ label, count, open = false, children }: { label: string; count?: number | string; open?: boolean; children: ReactNode }) {
  return (
    <details className="fold" open={open}>
      <summary className="fold__head">
        <Icon name="chevron-right" size={12} />
        <span>{label}</span>
        {count !== undefined && <span className="muted">{count}</span>}
      </summary>
      <div className="fold__body">{children}</div>
    </details>
  );
}
