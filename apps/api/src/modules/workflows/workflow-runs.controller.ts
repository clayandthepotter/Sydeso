import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ActorType, WorkflowState } from "@prisma/client";

import { CoreLoopService } from "../core-loop/core-loop.service";

@Controller("workflow-runs")
export class WorkflowRunsController {
  constructor(private readonly coreLoop: CoreLoopService) {}

  @Get(":workflowRunId")
  getWorkflowRun(@Param("workflowRunId") workflowRunId: string) {
    return this.coreLoop.getWorkflowRun(workflowRunId);
  }

  @Post(":workflowRunId/transitions")
  transition(
    @Param("workflowRunId") workflowRunId: string,
    @Body()
    body: {
      toState: WorkflowState;
      actorId?: string;
      reason?: string;
    },
  ) {
    return this.coreLoop.transitionWorkflowRun({
      workflowRunId,
      toState: body.toState,
      actorType: ActorType.user,
      actorId: body.actorId,
      reason: body.reason,
    });
  }
}
