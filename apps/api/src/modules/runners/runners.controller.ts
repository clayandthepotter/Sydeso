import { Body, Controller, Get, Headers, Param, Post, UnauthorizedException } from "@nestjs/common";
import { ArtifactType, RunnerStatus } from "@prisma/client";
import { registerRunnerSchema, type RegisterRunnerInput } from "@sydeso/api-contracts";
import { hasRequiredCapabilities } from "@sydeso/domain";

import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { AccessService } from "../access/access.service";
import type { SessionUser } from "../auth/auth.types";
import { CurrentUser, Public } from "../auth/decorators";
import { CoreLoopService } from "../core-loop/core-loop.service";

/**
 * Two audiences: people managing runners (session auth, organization permissions) and the
 * runners themselves (`runners/me/*`, authenticated by their own bearer token).
 */
@Controller()
export class RunnersController {
  constructor(
    private readonly coreLoop: CoreLoopService,
    private readonly access: AccessService,
  ) {}

  @Public()
  @Post("runners/claim-preview")
  previewClaim(@Body() body: { runnerCapabilities: string[]; requiredCapabilities: string[] }) {
    return {
      compatible: hasRequiredCapabilities(body.runnerCapabilities ?? [], body.requiredCapabilities ?? []),
    };
  }

  @Get("organizations/:organizationId/runners")
  async listRunners(@CurrentUser() user: SessionUser, @Param("organizationId") organizationId: string) {
    await this.access.require(user.id, organizationId, "runner.read");
    return this.coreLoop.listRunners(organizationId);
  }

  @Post("organizations/:organizationId/runners")
  async registerRunner(
    @CurrentUser() user: SessionUser,
    @Param("organizationId") organizationId: string,
    @Body(new ZodValidationPipe(registerRunnerSchema)) body: RegisterRunnerInput,
  ) {
    await this.access.require(user.id, organizationId, "runner.register");
    return this.coreLoop.registerRunner({
      organizationId,
      name: body.name,
      type: body.type,
      version: body.version,
      capabilities: body.capabilities,
      actorId: user.id,
    });
  }

  @Public()
  @Post("runners/me/heartbeat")
  heartbeat(
    @Headers("authorization") authorization: string | undefined,
    @Body()
    body: {
      status: RunnerStatus;
      version: string;
      capabilities: string[];
      healthMetrics?: unknown;
    },
  ) {
    return this.coreLoop.heartbeatRunner({
      runnerToken: readBearerToken(authorization),
      status: body.status,
      version: body.version,
      capabilities: body.capabilities,
      healthMetrics: body.healthMetrics,
    });
  }

  @Public()
  @Post("runners/me/jobs/claim")
  claimJob(@Headers("authorization") authorization: string | undefined, @Body() body: { capabilities: string[] }) {
    return this.coreLoop.claimJob({
      runnerToken: readBearerToken(authorization),
      capabilities: body.capabilities ?? [],
    });
  }

  @Public()
  @Post("runners/me/jobs/:jobId/complete")
  completeJob(
    @Headers("authorization") authorization: string | undefined,
    @Param("jobId") jobId: string,
    @Body()
    body: {
      status: "succeeded" | "failed";
      outputArtifacts?: Array<{
        type: ArtifactType;
        title: string;
        content?: unknown;
        storageKey?: string;
      }>;
      logsStorageKey?: string;
      error?: unknown;
      metrics?: unknown;
    },
  ) {
    return this.coreLoop.completeJob({
      runnerToken: readBearerToken(authorization),
      jobId,
      status: body.status,
      outputArtifacts: body.outputArtifacts,
      logsStorageKey: body.logsStorageKey,
      error: body.error,
      metrics: body.metrics,
    });
  }
}

function readBearerToken(authorization: string | undefined) {
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    throw new UnauthorizedException("Runner bearer token is required");
  }

  return token;
}
