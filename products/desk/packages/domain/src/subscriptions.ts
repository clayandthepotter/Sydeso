import type { EventType } from "./events/catalog.js";

/**
 * Which consumer reads which events. Each consumer has its own queue.
 * A publisher sends each event to the queue of every consumer that reads it.
 */
export const SUBSCRIPTIONS = {
  "desk-triage": ["NoteCaptured", "ProjectsSynced", "WorkItemCreated"],
  "desk-planner": ["ItemRouted"],
} as const satisfies Record<string, readonly EventType[]>;

export type ConsumerName = keyof typeof SUBSCRIPTIONS;

export const CONSUMERS = Object.keys(SUBSCRIPTIONS) as ConsumerName[];

/** The consumers that read this event type. */
export function subscribersOf(type: EventType): ConsumerName[] {
  return CONSUMERS.filter((consumer) => (SUBSCRIPTIONS[consumer] as readonly EventType[]).includes(type));
}
