import type { Metadata } from "next";

import { AppShell } from "../../../components/app-shell";
import { DesignLockGenerator } from "../../../components/design-lock-generator";

export const metadata: Metadata = {
  title: "Design lock",
  description: "Generate a design lock artifact that defines tone, tokens, components and QA rules for a project UI.",
};

export default function DesignLockPage() {
  return (
    <AppShell
      groups={[{ label: "Sydeso", items: [{ href: "/app", label: "Organizations", exact: true }, { href: "/app/design-lock", label: "Design lock" }] }]}
      crumbs={[{ href: "/app", label: "Sydeso" }, { label: "Design lock" }]}
    >
      <div className="page__head">
        <div>
          <h1 className="display">Design lock</h1>
          <p className="muted">A project-specific design guide that sets tone, tokens, motion and governance before the first screen.</p>
        </div>
      </div>
      <DesignLockGenerator />
    </AppShell>
  );
}
