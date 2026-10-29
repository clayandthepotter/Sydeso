import {
  causedEventId,
  createEvent,
  limitTodayP1,
  type Clock,
  type EventConsumer,
  type InboxPort,
  type IssueTrackerPort,
} from "@desk/domain";

export const PLANNER_CONSUMER = "desk-planner";

export interface PlanningDeps {
  /** The Linear workspace of one tenant. */
  readonly issueTracker: (tenantId: string) => IssueTrackerPort;
  readonly inbox: InboxPort;
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
      if (await deps.inbox.hasProcessed(PLANNER_CONSUMER, event.id)) return [];

      const { item } = event.payload;
      const tracker = deps.issueTracker(event.tenantId);
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
      await deps.inbox.markProcessed(PLANNER_CONSUMER, event.id);
      return [created];
    },
  };
}
export * from "./linear.js";
