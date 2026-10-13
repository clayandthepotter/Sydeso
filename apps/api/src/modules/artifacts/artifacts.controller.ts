import { Controller, Get, Param } from "@nestjs/common";

import { CoreLoopService } from "../core-loop/core-loop.service";

@Controller()
export class ArtifactsController {
  constructor(private readonly coreLoop: CoreLoopService) {}

  @Get("features/:featureId/artifacts")
  listFeatureArtifacts(@Param("featureId") featureId: string) {
    return this.coreLoop.listArtifactsForFeature(featureId);
  }

  @Get("workflow-runs/:workflowRunId/artifacts")
  listWorkflowRunArtifacts(@Param("workflowRunId") workflowRunId: string) {
    return this.coreLoop.listArtifactsForWorkflowRun(workflowRunId);
  }

  @Get("projects/:projectId/artifacts")
  listProjectArtifacts(@Param("projectId") projectId: string) {
    return this.coreLoop.listArtifactsForProject(projectId);
  }

  @Get("artifacts/:artifactId")
  getArtifact(@Param("artifactId") artifactId: string) {
    return this.coreLoop.getArtifact(artifactId);
  }
}
