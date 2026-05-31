import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ActorType,
  ArtifactType,
  JobStatus,
  Prisma,
  RunnerStatus,
  RunnerType,
  WorkflowState,
} from "@prisma/client";
import { defaultWorkflowRules, hasRequiredCapabilities } from "@sydeso/domain";
import { createHash, randomBytes } from "node:crypto";

import { PrismaService } from "../database/prisma.service";

type TransactionClient = Prisma.TransactionClient;

type OutputArtifactInput = {
  type: ArtifactType;
  title: string;
  content?: unknown;
  storageKey?: string;
};

const artifactTypeValues = new Set<string>(Object.values(ArtifactType));

@Injectable()
export class CoreLoopService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrganization(input: { name: string; slug: string }) {
    return this.prisma.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
      },
    });
  }

  async listOrganizations() {
    return this.prisma.organization.findMany({ orderBy: { createdAt: "desc" } });
  }

  async createWorkspace(input: { organizationId: string; name: string; slug: string }) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: input.organizationId },
    });

    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    return this.prisma.workspace.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        slug: input.slug,
      },
    });
  }

  async listWorkspaces(organizationId: string) {
    return this.prisma.workspace.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createProject(input: {
    workspaceId: string;
    name: string;
    repositoryUrl?: string;
    defaultBranch?: string;
    maxRemediationIterations?: number;
  }) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: input.workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }

    return this.prisma.project.create({
      data: {
        organizationId: workspace.organizationId,
        workspaceId: workspace.id,
        name: input.name,
        repositoryUrl: input.repositoryUrl,
        defaultBranch: input.defaultBranch ?? "main",
        maxRemediationIterations: input.maxRemediationIterations ?? 3,
      },
    });
  }

  async listProjects(workspaceId: string) {
    return this.prisma.project.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        features: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    return project;
  }

  async createFeature(input: { projectId: string; title: string; description: string; actorId?: string }) {
    return this.prisma.$transaction(async tx => {
      const project = await tx.project.findUnique({ where: { id: input.projectId } });

      if (!project) {
        throw new NotFoundException("Project not found");
      }

      const feature = await tx.feature.create({
        data: {
          organizationId: project.organizationId,
          projectId: project.id,
          title: input.title,
          description: input.description,
          status: WorkflowState.backlog,
        },
      });

      const workflowRun = await tx.workflowRun.create({
        data: {
          organizationId: project.organizationId,
          featureId: feature.id,
          currentState: WorkflowState.backlog,
        },
      });

      const artifact = await this.createArtifact(tx, {
        organizationId: project.organizationId,
        projectId: project.id,
        featureId: feature.id,
        workflowRunId: workflowRun.id,
        type: ArtifactType.feature_request,
        title: input.title,
        content: {
          title: input.title,
          description: input.description,
        },
        createdByType: ActorType.user,
        createdById: input.actorId,
      });

      const transition = await tx.workflowTransition.create({
        data: {
          organizationId: project.organizationId,
          workflowRunId: workflowRun.id,
          fromState: null,
          toState: WorkflowState.backlog,
          triggeredByType: ActorType.user,
          triggeredById: input.actorId,
          reason: "Feature request created",
        },
      });

      await this.recordAudit(tx, {
        organizationId: project.organizationId,
        actorType: ActorType.user,
        actorId: input.actorId,
        action: "feature.created",
        entityType: "feature",
        entityId: feature.id,
        after: { featureId: feature.id, workflowRunId: workflowRun.id, artifactId: artifact.id },
      });

      return { feature, workflowRun, artifact, transition };
    });
  }

  async listFeatures(projectId: string) {
    return this.prisma.feature.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        workflowRuns: {
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
    });
  }

  async getFeature(featureId: string) {
    const feature = await this.prisma.feature.findUnique({
      where: { id: featureId },
      include: {
        artifacts: { orderBy: [{ type: "asc" }, { version: "desc" }] },
        workflowRuns: {
          orderBy: { startedAt: "desc" },
          include: {
            transitions: { orderBy: { createdAt: "asc" } },
            jobs: { orderBy: { createdAt: "asc" } },
          },
        },
      },
    });

    if (!feature) {
      throw new NotFoundException("Feature not found");
    }

    return feature;
  }

  async getWorkflowRun(workflowRunId: string) {
    const workflowRun = await this.prisma.workflowRun.findUnique({
      where: { id: workflowRunId },
      include: {
        feature: true,
        artifacts: { orderBy: [{ type: "asc" }, { version: "desc" }] },
        transitions: { orderBy: { createdAt: "asc" } },
        jobs: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!workflowRun) {
      throw new NotFoundException("Workflow run not found");
    }

    return workflowRun;
  }

  async transitionWorkflowRun(input: {
    workflowRunId: string;
    toState: WorkflowState;
    actorType: ActorType;
    actorId?: string;
    reason?: string;
  }) {
    return this.prisma.$transaction(tx => this.transitionWorkflowRunTx(tx, input));
  }

  async listArtifactsForFeature(featureId: string) {
    return this.prisma.artifact.findMany({
      where: { featureId },
      orderBy: [{ type: "asc" }, { version: "desc" }],
    });
  }

  async listArtifactsForWorkflowRun(workflowRunId: string) {
    return this.prisma.artifact.findMany({
      where: { workflowRunId },
      orderBy: [{ type: "asc" }, { version: "desc" }],
    });
  }

  async registerRunner(input: {
    organizationId: string;
    name: string;
    type?: RunnerType;
    version: string;
    capabilities: string[];
  }) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: input.organizationId },
    });

    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    const runnerToken = randomBytes(32).toString("hex");

    const runner = await this.prisma.runner.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        type: input.type ?? RunnerType.self_hosted,
        version: input.version,
        capabilities: input.capabilities,
        status: RunnerStatus.offline,
        tokenHash: this.hashToken(runnerToken),
      },
    });

    return { runner, runnerToken };
  }

  async heartbeatRunner(input: {
    runnerToken: string;
    status: RunnerStatus;
    version: string;
    capabilities: string[];
    healthMetrics?: unknown;
  }) {
    const runner = await this.getRunnerForToken(input.runnerToken);

    return this.prisma.runner.update({
      where: { id: runner.id },
      data: {
        status: input.status,
        version: input.version,
        capabilities: input.capabilities,
        healthMetrics: this.toJson(input.healthMetrics ?? {}),
        lastSeenAt: new Date(),
      },
    });
  }

  async claimJob(input: { runnerToken: string; capabilities: string[] }) {
    const runner = await this.getRunnerForToken(input.runnerToken);

    return this.prisma.$transaction(async tx => {
      const queuedJobs = await tx.job.findMany({
        where: {
          organizationId: runner.organizationId,
          status: JobStatus.queued,
        },
        orderBy: { createdAt: "asc" },
        include: {
          workflowRun: {
            include: {
              feature: {
                include: { project: true },
              },
              artifacts: { orderBy: { createdAt: "asc" } },
            },
          },
        },
      });

      const compatibleJob = queuedJobs.find(job =>
        hasRequiredCapabilities(input.capabilities, job.requiredCapabilities),
      );

      if (!compatibleJob) {
        return null;
      }

      const assignedJob = await tx.job.update({
        where: { id: compatibleJob.id },
        data: {
          runnerId: runner.id,
          status: JobStatus.assigned,
          startedAt: new Date(),
        },
      });

      await tx.runner.update({
        where: { id: runner.id },
        data: {
          status: RunnerStatus.busy,
          capabilities: input.capabilities,
          lastSeenAt: new Date(),
        },
      });

      const project = compatibleJob.workflowRun.feature.project;

      return {
        jobId: assignedJob.id,
        workflowRunId: assignedJob.workflowRunId,
        state: assignedJob.state,
        agentType: assignedJob.agentType,
        repository: {
          url: project.repositoryUrl,
          branch: project.defaultBranch,
        },
        inputArtifacts: compatibleJob.workflowRun.artifacts,
        execution: {
          timeoutSeconds: 3600,
          maxLogBytes: 10_485_760,
        },
      };
    });
  }

  async completeJob(input: {
    runnerToken: string;
    jobId: string;
    status: "succeeded" | "failed";
    outputArtifacts?: OutputArtifactInput[];
    logsStorageKey?: string;
    error?: unknown;
    metrics?: unknown;
  }) {
    const runner = await this.getRunnerForToken(input.runnerToken);

    return this.prisma.$transaction(async tx => {
      const job = await tx.job.findFirst({
        where: {
          id: input.jobId,
          runnerId: runner.id,
          status: { in: [JobStatus.assigned, JobStatus.running] },
        },
        include: {
          workflowRun: {
            include: {
              feature: {
                include: { project: true },
              },
            },
          },
        },
      });

      if (!job) {
        throw new NotFoundException("Claimed job not found");
      }

      const outputArtifacts = input.outputArtifacts ?? [];
      const createdArtifacts = [];

      for (const outputArtifact of outputArtifacts) {
        if (!artifactTypeValues.has(outputArtifact.type)) {
          throw new BadRequestException(`Invalid artifact type: ${outputArtifact.type}`);
        }

        createdArtifacts.push(
          await this.createArtifact(tx, {
            organizationId: job.organizationId,
            projectId: job.workflowRun.feature.projectId,
            featureId: job.workflowRun.featureId,
            workflowRunId: job.workflowRunId,
            type: outputArtifact.type,
            title: outputArtifact.title,
            content: outputArtifact.content ?? {},
            storageKey: outputArtifact.storageKey,
            createdByType: ActorType.runner,
            createdById: runner.id,
          }),
        );
      }

      const completedJob = await tx.job.update({
        where: { id: job.id },
        data: {
          status: input.status === "succeeded" ? JobStatus.succeeded : JobStatus.failed,
          outputArtifactIds: createdArtifacts.map(artifact => artifact.id),
          error: input.error === undefined ? undefined : this.toJson(input.error),
          completedAt: new Date(),
        },
      });

      const nextTransition = await this.advanceAfterJobCompletion(tx, {
        jobState: job.state,
        workflowRunId: job.workflowRunId,
        runnerId: runner.id,
        status: input.status,
      });

      await tx.runner.update({
        where: { id: runner.id },
        data: {
          status: RunnerStatus.online,
          lastSeenAt: new Date(),
        },
      });

      return { job: completedJob, outputArtifacts: createdArtifacts, nextTransition };
    });
  }

  private async transitionWorkflowRunTx(
    tx: TransactionClient,
    input: {
      workflowRunId: string;
      toState: WorkflowState;
      actorType: ActorType;
      actorId?: string;
      reason?: string;
    },
  ) {
    const run = await tx.workflowRun.findUnique({
      where: { id: input.workflowRunId },
      include: {
        feature: {
          include: { project: true },
        },
      },
    });

    if (!run) {
      throw new NotFoundException("Workflow run not found");
    }

    const rule = defaultWorkflowRules.find(
      candidate => candidate.from === run.currentState && candidate.to === input.toState,
    );

    if (!rule) {
      throw new BadRequestException(`Invalid transition: ${run.currentState} -> ${input.toState}`);
    }

    const availableArtifacts = await tx.artifact.findMany({
      where: { workflowRunId: run.id },
      orderBy: { createdAt: "desc" },
    });

    const availableTypes = new Set(availableArtifacts.map(artifact => artifact.type));

    for (const requiredArtifactType of rule.requiredArtifactTypes ?? []) {
      if (!availableTypes.has(requiredArtifactType as ArtifactType)) {
        throw new BadRequestException(`Missing required artifact: ${requiredArtifactType}`);
      }
    }

    const transition = await tx.workflowTransition.create({
      data: {
        organizationId: run.organizationId,
        workflowRunId: run.id,
        fromState: run.currentState,
        toState: input.toState,
        triggeredByType: input.actorType,
        triggeredById: input.actorId,
        reason: input.reason,
      },
    });

    await tx.workflowRun.update({
      where: { id: run.id },
      data: {
        currentState: input.toState,
        status: input.toState === WorkflowState.ready ? "passed" : "active",
        completedAt: input.toState === WorkflowState.ready ? new Date() : undefined,
      },
    });

    await tx.feature.update({
      where: { id: run.featureId },
      data: { status: input.toState },
    });

    await this.recordAudit(tx, {
      organizationId: run.organizationId,
      actorType: input.actorType,
      actorId: input.actorId,
      action: "workflow.transitioned",
      entityType: "workflow_run",
      entityId: run.id,
      before: { state: run.currentState },
      after: { state: input.toState },
      metadata: { transitionId: transition.id },
    });

    let job = null;

    if (rule.createsJob && rule.agentType) {
      job = await tx.job.create({
        data: {
          organizationId: run.organizationId,
          workflowRunId: run.id,
          state: input.toState,
          agentType: rule.agentType,
          requiredCapabilities: rule.requiredCapabilities ?? [],
          inputArtifactIds: availableArtifacts.map(artifact => artifact.id),
        },
      });
    }

    return { transition, job };
  }

  private async advanceAfterJobCompletion(
    tx: TransactionClient,
    input: {
      jobState: WorkflowState;
      workflowRunId: string;
      runnerId: string;
      status: "succeeded" | "failed";
    },
  ) {
    const run = await tx.workflowRun.findUnique({
      where: { id: input.workflowRunId },
      include: {
        feature: {
          include: { project: true },
        },
      },
    });

    if (!run) {
      throw new NotFoundException("Workflow run not found");
    }

    if (run.currentState !== input.jobState) {
      throw new BadRequestException(
        `Job state ${input.jobState} does not match workflow state ${run.currentState}`,
      );
    }

    if (input.status === "succeeded") {
      const nextState = this.nextStateAfterSuccessfulJob(input.jobState);

      if (!nextState) {
        return null;
      }

      return this.transitionWorkflowRunTx(tx, {
        workflowRunId: input.workflowRunId,
        toState: nextState,
        actorType: ActorType.runner,
        actorId: input.runnerId,
        reason: `Runner completed ${input.jobState} job successfully`,
      });
    }

    if (input.jobState === WorkflowState.automated_qa) {
      const maxRemediationIterations = run.feature.project.maxRemediationIterations;

      if (run.remediationCount < maxRemediationIterations) {
        await tx.workflowRun.update({
          where: { id: run.id },
          data: { remediationCount: { increment: 1 } },
        });

        return this.transitionWorkflowRunTx(tx, {
          workflowRunId: input.workflowRunId,
          toState: WorkflowState.development,
          actorType: ActorType.runner,
          actorId: input.runnerId,
          reason: "Automated QA failed; returning to development for remediation",
        });
      }
    }

    return this.transitionWorkflowRunTx(tx, {
      workflowRunId: input.workflowRunId,
      toState: WorkflowState.escalated,
      actorType: ActorType.runner,
      actorId: input.runnerId,
      reason: `Runner failed ${input.jobState} job`,
    });
  }

  private nextStateAfterSuccessfulJob(jobState: WorkflowState) {
    switch (jobState) {
      case WorkflowState.design:
        return WorkflowState.design_approval;
      case WorkflowState.development:
        return WorkflowState.automated_qa;
      case WorkflowState.automated_qa:
        return WorkflowState.manual_review;
      default:
        return null;
    }
  }

  private async createArtifact(
    tx: TransactionClient,
    input: {
      organizationId: string;
      projectId: string;
      featureId?: string;
      workflowRunId?: string;
      type: ArtifactType;
      title: string;
      content: unknown;
      storageKey?: string;
      createdByType: ActorType;
      createdById?: string;
    },
  ) {
    const version = await tx.artifact.count({
      where: {
        featureId: input.featureId,
        type: input.type,
      },
    });

    const content = this.toJson(input.content);
    const checksum = createHash("sha256").update(JSON.stringify(content)).digest("hex");

    return tx.artifact.create({
      data: {
        organizationId: input.organizationId,
        projectId: input.projectId,
        featureId: input.featureId,
        workflowRunId: input.workflowRunId,
        type: input.type,
        title: input.title,
        content,
        storageKey: input.storageKey,
        checksum,
        version: version + 1,
        createdByType: input.createdByType,
        createdById: input.createdById,
      },
    });
  }

  private async recordAudit(
    tx: TransactionClient,
    input: {
      organizationId: string;
      actorType: ActorType;
      actorId?: string;
      action: string;
      entityType: string;
      entityId?: string;
      before?: unknown;
      after?: unknown;
      metadata?: unknown;
    },
  ) {
    await tx.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        before: input.before === undefined ? undefined : this.toJson(input.before),
        after: input.after === undefined ? undefined : this.toJson(input.after),
        metadata: this.toJson(input.metadata ?? {}),
      },
    });
  }

  private async getRunnerForToken(runnerToken: string) {
    if (!runnerToken) {
      throw new UnauthorizedException("Missing runner token");
    }

    const runner = await this.prisma.runner.findUnique({
      where: { tokenHash: this.hashToken(runnerToken) },
    });

    if (!runner) {
      throw new UnauthorizedException("Invalid runner token");
    }

    return runner;
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
  }
}
