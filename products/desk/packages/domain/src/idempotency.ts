import type { AnyEvent } from "./events/envelope.js";
import type { EventType } from "./events/catalog.js";

/**
 * Queues deliver at least once. These pure functions make consumers
 * idempotent on the event ID.
 */

export type AppendOutcome = "appended" | "duplicate";

export interface AppendOnceResult {
  readonly log: readonly AnyEvent[];
  readonly outcome: AppendOutcome;
}

/** Adds the event to the log only if its ID is new. The log is append only. */
export function appendOnce(log: readonly AnyEvent[], event: AnyEvent): AppendOnceResult {
  if (log.some((existing) => existing.id === event.id)) return { log, outcome: "duplicate" };
  return { log: [...log, event], outcome: "appended" };
}

/** Keeps the first copy of each event ID. Order does not change. */
export function dedupeById<E extends { readonly id: string }>(events: readonly E[]): E[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
}

/** True if a consumer has not processed this event ID. */
export function shouldProcess(processedIds: ReadonlySet<string>, event: Pick<AnyEvent, "id">): boolean {
  return !processedIds.has(event.id);
}

/**
 * Derives a stable ID for an event that another event caused.
 * A redelivered cause gives the same ID, so the event store ignores the copy.
 */
export function causedEventId(causeId: string, type: EventType, key?: string): string {
  return key === undefined ? `${causeId}/${type}` : `${causeId}/${type}/${key}`;
}
