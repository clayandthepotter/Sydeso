import "./globals.css";

import type { ReactNode } from "react";

export const metadata = {
  title: "Sydeso | AI-native software delivery platform",
  description:
    "Join the Sydeso waitlist for an AI-native software delivery platform that transforms ideas into verified software through structured, agent-driven workflows.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
