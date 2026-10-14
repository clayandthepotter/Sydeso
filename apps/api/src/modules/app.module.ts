import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";

import { HttpExceptionFilter } from "../common/http-exception.filter";
import { AccessService } from "./access/access.service";
import { ArtifactsController } from "./artifacts/artifacts.controller";
import { ArtifactsService } from "./artifacts/artifacts.service";
import { AuditService } from "./audit/audit.service";
import { AuthController } from "./auth/auth.controller";
import { AuthGuard } from "./auth/auth.guard";
import { AuthService } from "./auth/auth.service";
import { PasswordService } from "./auth/password.service";
import { CoreLoopService } from "./core-loop/core-loop.service";
import { PrismaService } from "./database/prisma.service";
import { FeaturesController } from "./features/features.controller";
import { FoundationController } from "./foundation/foundation.controller";
import { FoundationService } from "./foundation/foundation.service";
import { HealthController } from "./health/health.controller";
import { InvitationsService } from "./members/invitations.service";
import { MembersController } from "./members/members.controller";
import { MembersService } from "./members/members.service";
import { RunnersController } from "./runners/runners.controller";
import { StorageService } from "./storage/storage.service";
import { WaitlistController } from "./waitlist/waitlist.controller";
import { WaitlistService } from "./waitlist/waitlist.service";
import { WorkflowRunsController } from "./workflows/workflow-runs.controller";

@Module({
  controllers: [
    ArtifactsController,
    AuthController,
    FeaturesController,
    FoundationController,
    HealthController,
    MembersController,
    RunnersController,
    WaitlistController,
    WorkflowRunsController,
  ],
  providers: [
    PrismaService,
    AuditService,
    AccessService,
    StorageService,
    ArtifactsService,
    PasswordService,
    AuthService,
    FoundationService,
    InvitationsService,
    MembersService,
    CoreLoopService,
    WaitlistService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
