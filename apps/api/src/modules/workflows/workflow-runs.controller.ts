import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ActorType } from "@prisma/client";
import { transitionWorkflowRunSchema, type TransitionWorkflowRunInput } from "@sydeso/api-contracts";

import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { AccessService } from "../access/access.service";
import type { SessionUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators";
import { CoreLoopService } from "../core-loop/core-loop.service";

@Controller("workflow-runs")
export class WorkflowRunsController {
  constructor(
    private readonly coreLoop: CoreLoopService,
    private readonly access: AccessService,
  ) {}

  @Get(":workflowRunId")
  async getWorkflowRun(@CurrentUser() user: SessionUser, @Param("workflowRunId") workflowRunId: string) {
    const organizationId = await this.access.organizationOfWorkflowRun(workflowRunId);
    await this.access.require(user.id, organizationId, "workflow.read");
    return this.coreLoop.getWorkflowRun(workflowRunId);
  }

  @Post(":workflowRunId/transitions")
  async transition(
    @CurrentUser() user: SessionUser,
    @Param("workflowRunId") workflowRunId: string,
    @Body(new ZodValidationPipe(transitionWorkflowRunSchema)) body: TransitionWorkflowRunInput,
  ) {
    const organizationId = await this.access.organizationOfWorkflowRun(workflowRunId);
    const permission = await this.access.permissionForRunTransition(workflowRunId, body.toState);
    await this.access.require(user.id, organizationId, permission);

    return this.coreLoop.transitionWorkflowRun({
      workflowRunId,
      toState: body.toState,
      actorType: ActorType.user,
      actorId: user.id,
      reason: body.reason,
    });
  }
}
