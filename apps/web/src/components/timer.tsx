"use client";

import { useEffect, useState } from "react";

function format(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  return `${hours > 0 ? `${hours}:` : ""}${mm}:${String(seconds).padStart(2, "0")}`;
}

/**
 * A work timer in h:mm:ss, or m:ss under an hour. Ticks every second while `until` is null;
 * otherwise shows the fixed duration between the two instants. The server renders the value at
 * request time and the client takes over without a hydration complaint.
 */
export function Timer({ since, until = null }: { since: string; until?: string | null }) {
  const start = new Date(since).getTime();
  const [now, setNow] = useState(() => (until ? new Date(until).getTime() : Date.now()));

  useEffect(() => {
    if (until) {
      setNow(new Date(until).getTime());
      return;
    }
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [until]);

  return (
    <span className="timer" suppressHydrationWarning>
      {format(now - start)}
    </span>
  );
}
