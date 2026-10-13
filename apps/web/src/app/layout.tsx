import "./globals.css";

import type { Metadata } from "next";
import { Archivo, Azeret_Mono } from "next/font/google";
import type { ReactNode } from "react";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const azeret = Azeret_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-azeret",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Sydeso", template: "%s · Sydeso" },
  description: "Sydeso: a state-driven, AI-native software delivery platform.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${azeret.variable}`}>
      <body>{children}</body>
    </html>
  );
}
