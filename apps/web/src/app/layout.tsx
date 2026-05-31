import "./globals.css";

import type { ReactNode } from "react";

export const metadata = {
  title: "Sydeso",
  description: "Workflow operating system for AI-native software teams.",
};

const navItems = ["Dashboard", "Projects", "Features", "Workflows", "Runners", "Memory", "Settings"];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <div className="brand">Sydeso</div>
            <nav className="nav" aria-label="Primary navigation">
              {navItems.map(item => (
                <a href="#" key={item}>
                  {item}
                </a>
              ))}
            </nav>
          </aside>
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}
