import { subscribersOf, type AnyEvent, type AppendResult, type ConsumerName, type EventStorePort } from "@desk/domain";

/** The queue of each consumer. */
export type ConsumerQueues = Partial<Record<ConsumerName, Queue>>;

/**
 * Stores events in the log, then sends each one to the queue of every consumer that reads it.
 * It sends a duplicate again on purpose: if an earlier send failed, the retry completes it.
 * Consumers are idempotent on the event ID, so a repeat is safe.
 */
export class QueuePublisher {
  constructor(
    private readonly store: (tenantId: string) => EventStorePort,
    private readonly queues: ConsumerQueues,
  ) {}

  async publish(events: readonly AnyEvent[]): Promise<AppendResult[]> {
    const results: AppendResult[] = [];
    for (const event of events) results.push(await this.store(event.tenantId).append(event));
    const batches = new Map<Queue, MessageSendRequest[]>();
    for (const event of events) {
      for (const consumer of subscribersOf(event.type)) {
        const queue = this.queues[consumer];
        if (!queue) throw new Error(`No queue binding for ${consumer}`);
        const batch = batches.get(queue) ?? [];
        batch.push({ body: event, contentType: "json" });
        batches.set(queue, batch);
      }
    }
    for (const [queue, batch] of batches) await queue.sendBatch(batch);
    return results;
  }
}
