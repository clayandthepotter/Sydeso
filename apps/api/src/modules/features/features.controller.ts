import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { CoreLoopService } from "../core-loop/core-loop.service";

@Controller()
export class FeaturesController {
  constructor(private readonly coreLoop: CoreLoopService) {}

  @Post("projects/:projectId/features")
  createFeature(
    @Param("projectId") projectId: string,
    @Body() body: { title: string; description: string; actorId?: string },
  ) {
    return this.coreLoop.createFeature({
      projectId,
      title: body.title,
      description: body.description,
      actorId: body.actorId,
    });
  }

  @Get("projects/:projectId/features")
  listFeatures(@Param("projectId") projectId: string) {
    return this.coreLoop.listFeatures(projectId);
  }

  @Get("features/:featureId")
  getFeature(@Param("featureId") featureId: string) {
    return this.coreLoop.getFeature(featureId);
  }
}
