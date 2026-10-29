import { D1EventStore, D1Inbox, QueuePublisher } from "@desk/cloudflare";
import { deliver, parseEvent, type AnyEvent, type Clock, type ExtractionPort, type TenantDirectoryPort } from "@desk/domain";
import { D1TenantDirectory } from "@desk/identity";
import { ClaudeExtraction } from "./claude.js";
import { D1TriageProjects, TriageProjection } from "./d1.js";
import { createTriage, TRIAGE_CONSUMER } from "./index.js";

export interface TriageEnv {
  readonly DB: D1Database;
  readonly PLANNER_QUEUE: Queue;
  readonly ANTHROPIC_API_KEY: string;
  /** https://gateway.ai.cloudflare.com/v1/ACCOUNT_ID/GATEWAY/anthropic */
  readonly AI_GATEWAY_URL: string;
  readonly CLAUDE_MODEL: string;
  readonly CLAUDE_EFFORT: "low" | "medium" | "high" | "xhigh" | "max";
  /** "on" or "off". */
  readonly CLAUDE_FALLBACKS: string;
}

export interface TriageRuntimeDeps {
  readonly db: D1Database;
  readonly plannerQueue: Queue;
  readonly extraction: ExtractionPort;
  readonly tenants: TenantDirectoryPort;
  readonly clock: Clock;
}

/** Handles one event for desk-triage. Exported for tests. */
export function createTriageRuntime(deps: TriageRuntimeDeps) {
  const { db, clock } = deps;
  const projection = new TriageProjection(db);
  const publisher = new QueuePublisher((tenantId) => new D1EventStore(db, tenantId), { "desk-planner": deps.plannerQueue });
  const inbox = new D1Inbox(db, () => clock.now());
  const triage = createTriage({
    extraction: deps.extraction,
    projects: (tenantId) => new D1TriageProjects(db, tenantId),
    clock,
    tenants: deps.tenants,
  });

  return async (event: AnyEvent): Promise<void> => {
    switch (event.type) {
      case "ProjectsSynced":
        await new D1TriageProjects(db, event.tenantId).apply(event);
        return;
      case "WorkItemCreated":
        await projection.apply(event);
        return;
      case "NoteCaptured":
        await deliver(triage, event, {
          inbox,
          publish: async (events) => {
            await publisher.publish(events);
            for (const output of events) await projection.apply(output);
          },
        });
        return;
      default:
        return;
    }
  };
}

const systemClock = { now: () => new Date() };

/** Wait this long before a retry while the Claude API key is not set. */
const MISSING_KEY_RETRY_SECONDS = 1800;

export default {
  async queue(batch, env) {
    if (!env.ANTHROPIC_API_KEY) {
      // Keep the notes in the queue. They run after the operator adds the secret.
      console.warn(`${TRIAGE_CONSUMER}: ANTHROPIC_API_KEY is not set. The batch waits.`);
      batch.retryAll({ delaySeconds: MISSING_KEY_RETRY_SECONDS });
      return;
    }
    const handle = createTriageRuntime({
      db: env.DB,
      plannerQueue: env.PLANNER_QUEUE,
      tenants: new D1TenantDirectory(env.DB),
      clock: systemClock,
      extraction: new ClaudeExtraction({
        apiKey: env.ANTHROPIC_API_KEY,
        baseURL: env.AI_GATEWAY_URL,
        model: env.CLAUDE_MODEL,
        effort: env.CLAUDE_EFFORT,
        fallbacks: env.CLAUDE_FALLBACKS === "on",
      }),
    });
    for (const message of batch.messages) {
      const parsed = parseEvent(message.body);
      if (!parsed.ok) {
        console.error(`${TRIAGE_CONSUMER}: dropped a message that is not a valid event`, parsed.errors);
        message.ack();
        continue;
      }
      try {
        await handle(parsed.event);
        message.ack();
      } catch (error) {
        console.error(`${TRIAGE_CONSUMER}: event ${parsed.event.id} failed`, error);
        message.retry({ delaySeconds: Math.min(300, 10 * 2 ** message.attempts) });
      }
    }
  },
} satisfies ExportedHandler<TriageEnv>;
