import { NotBuiltError, type Clock, type EventConsumer, type InboxPort, type IssueTrackerPort } from "@desk/domain";

export interface PlanningDeps {
  readonly issueTracker: IssueTrackerPort;
  readonly inbox: InboxPort;
  readonly clock: Clock;
}

/**
 * desk-planner. Reads ItemRouted. Creates the Linear issue.
 * Publishes WorkItemCreated. Keeps at most 3 P1 issues in Today.
 */
export function createPlanner(_deps: PlanningDeps): EventConsumer {
  return {
    name: "desk-planner",
    consumes: ["ItemRouted"],
    async handle() {
      throw new NotBuiltError("desk-planner", 3);
    },
  };
}
