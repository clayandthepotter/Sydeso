import type { ReactNode } from "react";

/**
 * The properties panel on a detail page: a label column and a value column, one 32px row per
 * property. Values stay on one line unless `wrap` is set (checksums, ids).
 */
export function Props({ children, label = "Properties" }: { children: ReactNode; label?: string }) {
  return (
    <dl className="props" aria-label={label}>
      {children}
    </dl>
  );
}

export function Prop({ label, children, wrap = false }: { label: string; children: ReactNode; wrap?: boolean }) {
  return (
    <div className="props__row">
      <dt>{label}</dt>
      <dd className={wrap ? "wrap" : undefined}>{children}</dd>
    </div>
  );
}
