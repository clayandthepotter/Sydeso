import { Module } from "@nestjs/common";

import { ArtifactsController } from "./artifacts/artifacts.controller";
import { CoreLoopService } from "./core-loop/core-loop.service";
import { PrismaService } from "./database/prisma.service";
import { FoundationController } from "./foundation/foundation.controller";
import { FeaturesController } from "./features/features.controller";
import { HealthController } from "./health/health.controller";
import { RunnersController } from "./runners/runners.controller";
import { WaitlistController } from "./waitlist/waitlist.controller";
import { WaitlistService } from "./waitlist/waitlist.service";
import { WorkflowRunsController } from "./workflows/workflow-runs.controller";

@Module({
  controllers: [
    ArtifactsController,
    FeaturesController,
    FoundationController,
    HealthController,
    RunnersController,
    WaitlistController,
    WorkflowRunsController,
  ],
  providers: [CoreLoopService, PrismaService, WaitlistService],
})
export class AppModule {}
