import { Body, Controller, Get, Headers, Param, Post, Query, Req, Res } from "@nestjs/common";
import { ActorType } from "@prisma/client";
import {
  createArtifactSchema,
  uploadArtifactQuerySchema,
  type CreateArtifactInput,
  type UploadArtifactQuery,
} from "@sydeso/api-contracts";
import type { Request, Response } from "express";

import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { AccessService } from "../access/access.service";
import type { SessionUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators";
import { CoreLoopService } from "../core-loop/core-loop.service";
import { ArtifactsService } from "./artifacts.service";

@Controller()
export class ArtifactsController {
  constructor(
    private readonly coreLoop: CoreLoopService,
    private readonly artifacts: ArtifactsService,
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

  /** A person attaches an artifact with inline JSON content to a run. */
  @Post("workflow-runs/:workflowRunId/artifacts")
  async createArtifact(
    @CurrentUser() user: SessionUser,
    @Param("workflowRunId") workflowRunId: string,
    @Body(new ZodValidationPipe(createArtifactSchema)) body: CreateArtifactInput,
  ) {
    const organizationId = await this.access.organizationOfWorkflowRun(workflowRunId);
    await this.access.require(user.id, organizationId, "artifact.create");
    return this.artifacts.createForRun({ workflowRunId, ...body, actorId: user.id });
  }

  /** A person uploads a file as an artifact. The body is the raw file; type and title come from the query. */
  @Post("workflow-runs/:workflowRunId/artifacts/upload")
  async uploadArtifact(
    @CurrentUser() user: SessionUser,
    @Param("workflowRunId") workflowRunId: string,
    @Query(new ZodValidationPipe(uploadArtifactQuerySchema)) query: UploadArtifactQuery,
    @Headers("content-type") contentType: string | undefined,
    @Req() request: Request,
  ) {
    const organizationId = await this.access.organizationOfWorkflowRun(workflowRunId);
    await this.access.require(user.id, organizationId, "artifact.create");
    return this.artifacts.createFromUpload({
      workflowRunId,
      type: query.type,
      title: query.title,
      filename: query.filename,
      sourceArtifactIds: query.sourceArtifactIds,
      contentType,
      bytes: rawBody(request),
      createdByType: ActorType.user,
      createdById: user.id,
    });
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

  @Get("artifacts/:artifactId/versions")
  async listVersions(@CurrentUser() user: SessionUser, @Param("artifactId") artifactId: string) {
    const organizationId = await this.access.organizationOfArtifact(artifactId);
    await this.access.require(user.id, organizationId, "artifact.version.read");
    return this.artifacts.listVersions(artifactId);
  }

  @Get("artifacts/:artifactId/lineage")
  async lineage(@CurrentUser() user: SessionUser, @Param("artifactId") artifactId: string) {
    const organizationId = await this.access.organizationOfArtifact(artifactId);
    await this.access.require(user.id, organizationId, "artifact.read");
    return this.artifacts.lineage(artifactId);
  }

  /** The artifact's bytes: the stored object, or the inline content as JSON. */
  @Get("artifacts/:artifactId/content")
  async content(@CurrentUser() user: SessionUser, @Param("artifactId") artifactId: string, @Res() response: Response) {
    const organizationId = await this.access.organizationOfArtifact(artifactId);
    await this.access.require(user.id, organizationId, "artifact.read");

    const result = await this.artifacts.content(artifactId);
    const filename = (result.artifact.metadata as { filename?: string } | null)?.filename ?? `${result.artifact.type}-v${result.artifact.version}${result.stream ? "" : ".json"}`;

    response.setHeader("content-type", result.contentType);
    if (result.contentLength !== undefined) response.setHeader("content-length", String(result.contentLength));
    response.setHeader("content-disposition", `attachment; filename="${filename.replace(/"/g, "")}"`);
    response.setHeader("x-sydeso-checksum", `sha256:${result.artifact.checksum}`);
    response.setHeader("cache-control", "private, max-age=31536000, immutable");

    if (result.stream) {
      result.stream.pipe(response);
    } else {
      response.end(result.body);
    }
  }
}

/** The raw upload body, as parsed by the raw body middleware registered for upload routes. */
export function rawBody(request: Request): Buffer {
  const body = request.body as unknown;
  return Buffer.isBuffer(body) ? body : Buffer.alloc(0);
}
