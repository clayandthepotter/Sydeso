import Link from "next/link";
import type { ReactNode } from "react";

import { Mark } from "./mark";

/** The frame around sign-in, sign-up and invitation pages: the mark, one title, one form. */
export function AuthLayout({
  title,
  lead,
  children,
  footer,
}: {
  title: string;
  lead?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="auth">
      <div className="auth__card">
        <Link className="auth__mark" href="/" aria-label="Sydeso">
          <Mark size={28} />
        </Link>
        <h1 className="display">{title}</h1>
        {lead && <p className="muted">{lead}</p>}
        {children}
        {footer && <p className="auth__foot mono-text muted">{footer}</p>}
      </div>
    </main>
  );
}
