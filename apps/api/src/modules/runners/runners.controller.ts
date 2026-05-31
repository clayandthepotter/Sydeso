import { Body, Controller, Headers, Param, Post, UnauthorizedException } from "@nestjs/common";
import { ArtifactType, RunnerStatus, RunnerType } from "@prisma/client";
import { hasRequiredCapabilities } from "@sydeso/domain";

import { CoreLoopService } from "../core-loop/core-loop.service";

@Controller()
export class RunnersController {
  constructor(private readonly coreLoop: CoreLoopService) {}

  @Post("runners/claim-preview")
  previewClaim(
    @Body()
    body: {
      runnerCapabilities: string[];
      requiredCapabilities: string[];
    },
  ) {
    return {
      compatible: hasRequiredCapabilities(body.runnerCapabilities, body.requiredCapabilities),
    };
  }

  @Post("organizations/:organizationId/runners")
  registerRunner(
    @Param("organizationId") organizationId: string,
    @Body()
    body: {
      name: string;
      type?: RunnerType;
      version: string;
      capabilities: string[];
    },
  ) {
    return this.coreLoop.registerRunner({
      organizationId,
      name: body.name,
      type: body.type,
      version: body.version,
      capabilities: body.capabilities,
    });
  }

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

  @Post("runners/me/jobs/claim")
  claimJob(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: { capabilities: string[] },
  ) {
    return this.coreLoop.claimJob({
      runnerToken: readBearerToken(authorization),
      capabilities: body.capabilities,
    });
  }

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
