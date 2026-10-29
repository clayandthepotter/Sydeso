import { D1EventStore, D1Inbox, QueuePublisher, SecretBox } from "@desk/cloudflare";
import { deliver, parseEvent, type AnyEvent, type Clock } from "@desk/domain";
import { D1LinearConnections, D1PlannerPending } from "./connections.js";
import { createPlanner, LinearNotConnectedError, PLANNER_CONSUMER } from "./index.js";
import { LinearIssueTracker, LinearSetupError } from "./linear.js";

export interface PlannerEnv {
  readonly DB: D1Database;
  readonly TRIAGE_QUEUE: Queue;
  readonly DESK_SECRETS_KEY: string;
}

export interface PlannerRuntimeDeps {
  readonly env: PlannerEnv;
  readonly clock: Clock;
  readonly fetch?: typeof globalThis.fetch;
}

/** Handles one event for desk-planner. Exported for tests. */
export function createPlannerRuntime(deps: PlannerRuntimeDeps) {
  const { env, clock } = deps;
  const connections = new D1LinearConnections(env.DB, new SecretBox(env.DESK_SECRETS_KEY), clock);
  const pending = new D1PlannerPending(env.DB, clock);
  const publisher = new QueuePublisher((tenantId) => new D1EventStore(env.DB, tenantId), { "desk-triage": env.TRIAGE_QUEUE });
  const inbox = new D1Inbox(env.DB, () => clock.now());
  const planner = createPlanner({
    clock,
    issueTracker: async (tenantId) => {
      const connection = await connections.get(tenantId);
      return connection ? new LinearIssueTracker(connection, deps.fetch ?? globalThis.fetch.bind(globalThis)) : null;
    },
  });

  return async (event: AnyEvent): Promise<void> => {
    try {
      await deliver(planner, event, { inbox, publish: (events) => publisher.publish(events) });
      await pending.remove(event.tenantId, event.id);
    } catch (error) {
      // A setup problem does not fix itself. Park the event. It is replayed after the person fixes Linear.
      if (error instanceof LinearNotConnectedError || error instanceof LinearSetupError) {
        await pending.add(event, error.message);
        return;
      }
      throw error;
    }
  };
}

const systemClock = { now: () => new Date() };

export default {
  async queue(batch, env) {
    const handle = createPlannerRuntime({ env, clock: systemClock });
    for (const message of batch.messages) {
      const parsed = parseEvent(message.body);
      if (!parsed.ok) {
        console.error(`${PLANNER_CONSUMER}: dropped a message that is not a valid event`, parsed.errors);
        message.ack();
        continue;
      }
      try {
        await handle(parsed.event);
        message.ack();
      } catch (error) {
        console.error(`${PLANNER_CONSUMER}: event ${parsed.event.id} failed`, error);
        message.retry({ delaySeconds: Math.min(300, 10 * 2 ** message.attempts) });
      }
    }
  },
} satisfies ExportedHandler<PlannerEnv>;
