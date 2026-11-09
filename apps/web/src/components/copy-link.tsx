"use client";

import { useState } from "react";

/** Copies the current page address. Falls back to selecting nothing; the address bar is there. */
export function CopyLink({ className = "menu__item" }: { className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className={className}
      type="button"
      role="menuitem"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setDone(true);
          window.setTimeout(() => setDone(false), 1500);
        } catch {
          setDone(false);
        }
      }}
    >
      {done ? "Copied" : "Copy link"}
    </button>
  );
}
