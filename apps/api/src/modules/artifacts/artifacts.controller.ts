import { Controller, Get, Param } from "@nestjs/common";

import { AccessService } from "../access/access.service";
import type { SessionUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators";
import { CoreLoopService } from "../core-loop/core-loop.service";

@Controller()
export class ArtifactsController {
  constructor(
    private readonly coreLoop: CoreLoopService,
    private readonly access: AccessService,
  ) {}

  @Get("features/:featureId/artifacts")
  async listFeatureArtifacts(@CurrentUser() user: SessionUser, @Param("featureId") featureId: string) {
    const organizationId = await this.access.organizationOfFeature(featureId);
    await this.access.require(user.id, organizationId, "artifact.read");
    return this.coreLoop.listArtifactsForFeature(featureId);
  }

  @Get("workflow-runs/:workflowRunId/artifacts")
  async listWorkflowRunArtifacts(@CurrentUser() user: SessionUser, @Param("workflowRunId") workflowRunId: string) {
    const organizationId = await this.access.organizationOfWorkflowRun(workflowRunId);
    await this.access.require(user.id, organizationId, "artifact.read");
    return this.coreLoop.listArtifactsForWorkflowRun(workflowRunId);
  }

  @Get("projects/:projectId/artifacts")
  async listProjectArtifacts(@CurrentUser() user: SessionUser, @Param("projectId") projectId: string) {
    const organizationId = await this.access.organizationOfProject(projectId);
    await this.access.require(user.id, organizationId, "artifact.read");
    return this.coreLoop.listArtifactsForProject(projectId);
  }

  @Get("artifacts/:artifactId")
  async getArtifact(@CurrentUser() user: SessionUser, @Param("artifactId") artifactId: string) {
    const organizationId = await this.access.organizationOfArtifact(artifactId);
    await this.access.require(user.id, organizationId, "artifact.read");
    return this.coreLoop.getArtifact(artifactId);
  }
}
