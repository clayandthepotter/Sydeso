import { deliver, type AnyEvent, type EventConsumer, type EventStorePort, type InboxPort } from "@desk/domain";

/**
 * A fake for the consumer queues. It appends each event to the store,
 * then delivers it to each consumer that declares its type.
 * It delivers a repeated event again, so the inbox must stop the repeat.
 */
export class InMemoryBus {
  constructor(
    private readonly store: EventStorePort,
    private readonly consumers: readonly EventConsumer[],
    private readonly inbox: InboxPort,
  ) {}

  async publish(event: AnyEvent): Promise<void> {
    const pending: AnyEvent[] = [event];
    for (let next = pending.shift(); next !== undefined; next = pending.shift()) {
      await this.store.append(next);
      const current = next;
      for (const consumer of this.consumers) {
        await deliver(consumer, current, {
          inbox: this.inbox,
          publish: async (events) => {
            pending.push(...events);
          },
        });
      }
    }
  }
}
