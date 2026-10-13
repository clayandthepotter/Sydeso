import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { createFeatureSchema, type CreateFeatureInput } from "@sydeso/api-contracts";

import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { AccessService } from "../access/access.service";
import type { SessionUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators";
import { CoreLoopService } from "../core-loop/core-loop.service";

@Controller()
export class FeaturesController {
  constructor(
    private readonly coreLoop: CoreLoopService,
    private readonly access: AccessService,
  ) {}

  @Post("projects/:projectId/features")
  async createFeature(
    @CurrentUser() user: SessionUser,
    @Param("projectId") projectId: string,
    @Body(new ZodValidationPipe(createFeatureSchema)) body: CreateFeatureInput,
  ) {
    const organizationId = await this.access.organizationOfProject(projectId);
    await this.access.require(user.id, organizationId, "story.create");
    return this.coreLoop.createFeature({ projectId, title: body.title, description: body.description, actorId: user.id });
  }

  @Get("projects/:projectId/features")
  async listFeatures(@CurrentUser() user: SessionUser, @Param("projectId") projectId: string) {
    const organizationId = await this.access.organizationOfProject(projectId);
    await this.access.require(user.id, organizationId, "story.read");
    return this.coreLoop.listFeatures(projectId);
  }

  @Get("features/:featureId")
  async getFeature(@CurrentUser() user: SessionUser, @Param("featureId") featureId: string) {
    const organizationId = await this.access.organizationOfFeature(featureId);
    await this.access.require(user.id, organizationId, "story.read");
    return this.coreLoop.getFeature(featureId);
  }
}
