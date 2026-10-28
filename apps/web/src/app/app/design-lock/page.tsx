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
      groups={[
        {
          label: "Sydeso",
          items: [
            { href: "/app", label: "Home", icon: "menu", exact: true },
            { href: "/app/organizations", label: "Organizations", icon: "organization", exact: true },
            { href: "/app/design-lock", label: "Design lock", icon: "design" },
          ],
        },
      ]}
      crumbs={[{ href: "/app", label: "Home" }, { label: "Design lock" }]}
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
