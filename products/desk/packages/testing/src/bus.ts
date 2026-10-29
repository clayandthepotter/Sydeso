import type { AnyEvent, EventConsumer, EventStorePort } from "@desk/domain";

/**
 * A fake for the desk-bus queue. It appends each event to the store,
 * then delivers it to each consumer that declares its type.
 * It delivers a repeated event again, so consumers must be idempotent.
 */
export class InMemoryBus {
  constructor(
    private readonly store: EventStorePort,
    private readonly consumers: readonly EventConsumer[],
  ) {}

  async publish(event: AnyEvent): Promise<void> {
    const pending: AnyEvent[] = [event];
    for (let next = pending.shift(); next !== undefined; next = pending.shift()) {
      await this.store.append(next);
      for (const consumer of this.consumers) {
        if (!consumer.consumes.includes(next.type)) continue;
        pending.push(...(await consumer.handle(next)));
      }
    }
  }
}
