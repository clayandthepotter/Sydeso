import type { AnyEvent } from "./events/envelope.js";
import type { EventConsumer, InboxPort } from "./ports.js";

export type DeliveryOutcome = "handled" | "duplicate" | "ignored";

export interface DeliveryDeps {
  readonly inbox: InboxPort;
  /** Stores the output events and sends them to their subscribers. */
  readonly publish: (events: readonly AnyEvent[]) => Promise<unknown>;
}

/**
 * Delivers one event to one consumer. Queues deliver at least once, so the order matters:
 * check the inbox, handle, publish the output, and mark the event last.
 * A failure before the mark leaves the event unmarked, and the retry does the work again.
 * Output event IDs come from the cause, so a repeated publish adds no duplicates.
 */
export async function deliver(consumer: EventConsumer, event: AnyEvent, deps: DeliveryDeps): Promise<DeliveryOutcome> {
  if (!consumer.consumes.includes(event.type)) return "ignored";
  if (await deps.inbox.hasProcessed(consumer.name, event.id)) return "duplicate";
  const output = await consumer.handle(event);
  if (output.length > 0) await deps.publish(output);
  await deps.inbox.markProcessed(consumer.name, event.id);
  return "handled";
}
