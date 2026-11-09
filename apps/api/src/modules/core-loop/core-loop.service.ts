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
import { defaultWorkflowRules, hasRequiredCapabilities, resumeStateOf } from "@sydeso/domain";
import { createHash, randomBytes } from "node:crypto";

import { ArtifactsService } from "../artifacts/artifacts.service";
import { AuditService, toJson } from "../audit/audit.service";
import { PrismaService } from "../database/prisma.service";

type TransactionClient = Prisma.TransactionClient;

type OutputArtifactInput = {
  type: ArtifactType;
  title: string;
  content?: unknown;
  storageKey?: string;
};

const artifactTypeValues = new Set<string>(Object.values(ArtifactType));

/**
 * The persistent core loop: features, workflow runs, transitions, jobs, artifacts and the
 * runner protocol. Organizations, workspaces and projects live in FoundationService.
 */
@Injectable()
export class CoreLoopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly artifacts: ArtifactsService,
  ) {}

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

      const artifact = await this.artifacts.create(tx, {
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

      await this.audit.record(tx, {
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
    const features = await this.prisma.feature.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        workflowRuns: {
          orderBy: { startedAt: "desc" },
          take: 1,
          include: { transitions: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } } },
        },
      },
    });
    // Each run says when it entered its current state, so lists can time the step without a second request.
    return features.map(feature => ({
      ...feature,
      workflowRuns: feature.workflowRuns.map(({ transitions, ...run }) => ({
        ...run,
        stateEnteredAt: transitions[0]?.createdAt ?? run.startedAt,
      })),
    }));
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

    // Name whoever moved the run: people by their name, runners by theirs.
    const transitions = feature.workflowRuns.flatMap(run => run.transitions);
    const ids = (type: ActorType) =>
      Array.from(new Set(transitions.filter(t => t.triggeredByType === type && t.triggeredById).map(t => t.triggeredById!)));
    const [users, runners] = await Promise.all([
      this.prisma.user.findMany({ where: { id: { in: ids(ActorType.user) } }, select: { id: true, name: true } }),
      this.prisma.runner.findMany({ where: { id: { in: ids(ActorType.runner) } }, select: { id: true, name: true } }),
    ]);
    const names = new Map([...users, ...runners].map(entry => [entry.id, entry.name]));

    return {
      ...feature,
      workflowRuns: feature.workflowRuns.map(run => ({
        ...run,
        transitions: run.transitions.map(t => ({
          ...t,
          triggeredByName: t.triggeredById ? (names.get(t.triggeredById) ?? null) : null,
        })),
      })),
    };
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

  /**
   * Close a request: the run keeps its state and its record, stops being active, and no longer
   * accepts transitions. Queued jobs are cancelled.
   */
  async closeWorkflowRun(input: { workflowRunId: string; actorId: string; reason?: string }) {
    return this.prisma.$transaction(async tx => {
      const run = await tx.workflowRun.findUnique({ where: { id: input.workflowRunId } });
      if (!run) throw new NotFoundException("Workflow run not found");
      if (run.status === "closed") throw new BadRequestException("This request is already closed");

      await this.cancelPendingJobs(tx, run.id);
      const closed = await tx.workflowRun.update({
        where: { id: run.id },
        data: { status: "closed", completedAt: new Date() },
      });
      await this.audit.record(tx, {
        organizationId: run.organizationId,
        actorType: ActorType.user,
        actorId: input.actorId,
        action: "workflow.closed",
        entityType: "workflow_run",
        entityId: run.id,
        before: { status: run.status, state: run.currentState },
        after: { status: "closed", state: run.currentState },
        metadata: input.reason ? { reason: input.reason } : undefined,
      });
      return closed;
    });
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

  async listArtifactsForProject(projectId: string, limit = 200) {
    return this.prisma.artifact.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        feature: { select: { id: true, title: true } },
      },
    });
  }

  async getArtifact(artifactId: string) {
    const artifact = await this.prisma.artifact.findUnique({
      where: { id: artifactId },
      include: {
        feature: { select: { id: true, title: true, projectId: true } },
        workflowRun: { select: { id: true, currentState: true, status: true } },
      },
    });

    if (!artifact) {
      throw new NotFoundException("Artifact not found");
    }

    return artifact;
  }

  async listRunners(organizationId: string) {
    return this.prisma.runner.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        organizationId: true,
        name: true,
        type: true,
        status: true,
        version: true,
        capabilities: true,
        healthMetrics: true,
        lastSeenAt: true,
        createdAt: true,
        jobs: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            workflowRunId: true,
            state: true,
            agentType: true,
            status: true,
            attempt: true,
            startedAt: true,
            completedAt: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async listAuditLogs(organizationId: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async registerRunner(input: {
    organizationId: string;
    name: string;
    type?: RunnerType;
    version: string;
    capabilities: string[];
    actorId?: string;
  }) {
    const runnerToken = randomBytes(32).toString("hex");

    const runner = await this.prisma.$transaction(async tx => {
      const created = await tx.runner.create({
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

      await this.audit.record(tx, {
        organizationId: input.organizationId,
        actorType: ActorType.user,
        actorId: input.actorId,
        action: "runner.registered",
        entityType: "runner",
        entityId: created.id,
        after: { name: created.name, type: created.type, capabilities: created.capabilities },
      });

      return created;
    });

    const { tokenHash: _tokenHash, ...publicRunner } = runner;
    return { runner: publicRunner, runnerToken };
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

      // Outputs the runner already uploaded for this job, plus the inline ones in this request.
      // Every output descends from the job's inputs and is attributed to the job.
      const createdArtifacts = await this.artifacts.listProducedByJob(tx, job.id);

      for (const outputArtifact of input.outputArtifacts ?? []) {
        if (!artifactTypeValues.has(outputArtifact.type)) {
          throw new BadRequestException(`Invalid artifact type: ${outputArtifact.type}`);
        }

        createdArtifacts.push(
          await this.artifacts.create(tx, {
            organizationId: job.organizationId,
            projectId: job.workflowRun.feature.projectId,
            featureId: job.workflowRun.featureId,
            workflowRunId: job.workflowRunId,
            type: outputArtifact.type,
            title: outputArtifact.title,
            content: outputArtifact.content ?? {},
            storageKey: outputArtifact.storageKey,
            sourceArtifactIds: job.inputArtifactIds,
            producedByJobId: job.id,
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

      // The run moved on while the job ran (stopped, closed): keep the job's record, advance nothing.
      const stale = job.workflowRun.status === "closed" || job.workflowRun.currentState !== job.state;
      const nextTransition = stale
        ? null
        : await this.advanceAfterJobCompletion(tx, {
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

  /** A runner streams a large output into storage for the job it holds, before completing it. */
  async uploadJobArtifact(input: {
    runnerToken: string;
    jobId: string;
    type: ArtifactType;
    title: string;
    filename?: string;
    contentType?: string;
    bytes: Buffer;
  }) {
    const runner = await this.getRunnerForToken(input.runnerToken);
    const job = await this.prisma.job.findFirst({
      where: { id: input.jobId, runnerId: runner.id, status: { in: [JobStatus.assigned, JobStatus.running] } },
    });

    if (!job) {
      throw new NotFoundException("Claimed job not found");
    }

    return this.artifacts.createFromUpload({
      workflowRunId: job.workflowRunId,
      type: input.type,
      title: input.title,
      filename: input.filename,
      contentType: input.contentType,
      bytes: input.bytes,
      sourceArtifactIds: job.inputArtifactIds,
      producedByJobId: job.id,
      createdByType: ActorType.runner,
      createdById: runner.id,
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

    if (run.status === "closed") {
      throw new BadRequestException("This request was closed");
    }

    // A run in Needs you goes back only to the step it stopped at.
    if (run.currentState === WorkflowState.escalated) {
      const history = await tx.workflowTransition.findMany({
        where: { workflowRunId: run.id },
        select: { fromState: true, toState: true, createdAt: true },
      });
      const resume = resumeStateOf(history);
      if (resume !== input.toState) {
        throw new BadRequestException(
          resume ? `This request can only start again from ${resume}` : "This request cannot start again",
        );
      }
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

    await this.audit.record(tx, {
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

    // Stopping a run withdraws the work that had not started yet.
    if (input.toState === WorkflowState.escalated) {
      await this.cancelPendingJobs(tx, run.id);
    }

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

  /** Cancel a run's jobs that no runner has claimed. Claimed jobs finish and are then ignored. */
  private async cancelPendingJobs(tx: TransactionClient, workflowRunId: string) {
    await tx.job.updateMany({
      where: { workflowRunId, status: JobStatus.queued },
      data: { status: JobStatus.cancelled, completedAt: new Date() },
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
    return toJson(value);
  }
}
