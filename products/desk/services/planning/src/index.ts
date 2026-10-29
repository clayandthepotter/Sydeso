import {
  causedEventId,
  createEvent,
  limitTodayP1,
  type Clock,
  type EventConsumer,
  type IssueTrackerPort,
} from "@desk/domain";

export const PLANNER_CONSUMER = "desk-planner";

/** The tenant has not connected Linear. The queue retries, then keeps the message in the dead letter queue. */
export class LinearNotConnectedError extends Error {
  override readonly name = "LinearNotConnectedError";

  constructor(readonly tenantId: string) {
    super(`Tenant ${tenantId} has not connected Linear.`);
  }
}

export interface PlanningDeps {
  /** The Linear team of one tenant, or null when the tenant has not connected Linear. */
  readonly issueTracker: (tenantId: string) => Promise<IssueTrackerPort | null>;
  readonly clock: Clock;
}

/**
 * desk-planner. Reads ItemRouted. Creates the Linear issue.
 * Publishes WorkItemCreated. Keeps at most 3 P1 issues in Today.
 */
export function createPlanner(deps: PlanningDeps): EventConsumer {
  return {
    name: PLANNER_CONSUMER,
    consumes: ["ItemRouted"],
    async handle(event) {
      if (event.type !== "ItemRouted") return [];
      const tracker = await deps.issueTracker(event.tenantId);
      if (!tracker) throw new LinearNotConnectedError(event.tenantId);

      const { item } = event.payload;
      const p1InToday =
        event.payload.state === "Today" && item.priority === "P1"
          ? await tracker.countIssues({ state: "Today", priority: "P1" })
          : 0;
      const state = limitTodayP1(event.payload.state, item.priority, p1InToday);
      // The item ID is the idempotency key. A retry finds the issue instead of making a second one.
      const issue = await tracker.createIssue({
        idempotencyKey: item.itemId,
        title: item.action,
        project: item.project,
        state,
        priority: item.priority,
        dueDate: item.dueDate,
      });

      const created = createEvent(
        "WorkItemCreated",
        { itemId: item.itemId, issueId: issue.issueId, issueKey: issue.issueKey, project: item.project, state, priority: item.priority },
        {
          clock: deps.clock,
          ids: { next: () => causedEventId(event.id, "WorkItemCreated") },
          tenantId: event.tenantId,
          causationId: event.id,
          correlationId: event.correlationId ?? event.id,
        },
      );
      return [created];
    },
  };
}
export * from "./linear.js";
export * from "./connections.js";
