import { Module } from "@nestjs/common";

import { ArtifactsController } from "./artifacts/artifacts.controller";
import { CoreLoopService } from "./core-loop/core-loop.service";
import { PrismaService } from "./database/prisma.service";
import { FoundationController } from "./foundation/foundation.controller";
import { FeaturesController } from "./features/features.controller";
import { HealthController } from "./health/health.controller";
import { RunnersController } from "./runners/runners.controller";
import { WorkflowRunsController } from "./workflows/workflow-runs.controller";

@Module({
  controllers: [
    ArtifactsController,
    FeaturesController,
    FoundationController,
    HealthController,
    RunnersController,
    WorkflowRunsController,
  ],
  providers: [CoreLoopService, PrismaService],
})
export class AppModule {}
