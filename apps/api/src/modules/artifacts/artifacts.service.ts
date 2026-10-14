import { BadRequestException, Injectable, NotFoundException, PayloadTooLargeException } from "@nestjs/common";
import { ActorType, type ArtifactType, Prisma } from "@prisma/client";
import { createHash, randomUUID } from "node:crypto";

import { AuditService, toJson } from "../audit/audit.service";
import { PrismaService } from "../database/prisma.service";
import { StorageService } from "../storage/storage.service";

type Client = Prisma.TransactionClient | PrismaService;

export interface CreateArtifactRecord {
  organizationId: string;
  projectId: string;
  featureId?: string | null;
  workflowRunId?: string | null;
  type: ArtifactType;
  title: string;
  /** inline JSON content; omit for stored objects */
  content?: unknown;
  storageKey?: string;
  contentType?: string;
  sizeBytes?: number;
  /** precomputed when the bytes live in storage; computed from content otherwise */
  checksum?: string;
  sourceArtifactIds?: string[];
  producedByJobId?: string;
  metadata?: unknown;
  createdByType: ActorType;
  createdById?: string;
  id?: string;
}

/**
 * Artifacts are immutable and versioned per feature and type. This service is the only
 * writer: the core loop, the runner protocol and the user-facing endpoints all create
 * artifacts through `create`, so checksum, version and lineage are set in one place.
 */
@Injectable()
export class ArtifactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  /** Inserts the next version. Call inside the caller's transaction when the artifact is part of a larger change. */
  async create(client: Client, input: CreateArtifactRecord) {
    const previous = await client.artifact.aggregate({
      where: { featureId: input.featureId ?? null, projectId: input.projectId, type: input.type },
      _max: { version: true },
    });

    const content = input.content === undefined ? Prisma.JsonNull : toJson(input.content);
    const checksum =
      input.checksum ??
      createHash("sha256")
        .update(JSON.stringify(input.content === undefined ? null : toJson(input.content)))
        .digest("hex");

    const artifact = await client.artifact.create({
      data: {
        id: input.id,
        organizationId: input.organizationId,
        projectId: input.projectId,
        featureId: input.featureId ?? null,
        workflowRunId: input.workflowRunId ?? null,
        type: input.type,
        title: input.title,
        content,
        storageKey: input.storageKey,
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
        checksum,
        version: (previous._max.version ?? 0) + 1,
        sourceArtifactIds: input.sourceArtifactIds ?? [],
        producedByJobId: input.producedByJobId,
        metadata: toJson(input.metadata ?? {}),
        createdByType: input.createdByType,
        createdById: input.createdById,
      },
    });

    await this.audit.record(client, {
      organizationId: input.organizationId,
      actorType: input.createdByType,
      actorId: input.createdById,
      action: "artifact.created",
      entityType: "artifact",
      entityId: artifact.id,
      after: {
        type: artifact.type,
        version: artifact.version,
        checksum: artifact.checksum,
        storageKey: artifact.storageKey,
        sourceArtifactIds: artifact.sourceArtifactIds,
        producedByJobId: artifact.producedByJobId,
      },
    });

    return artifact;
  }

  /** A person attaches inline JSON content to a run. */
  async createForRun(input: {
    workflowRunId: string;
    type: ArtifactType;
    title: string;
    content: unknown;
    sourceArtifactIds?: string[];
    metadata?: unknown;
    actorId: string;
  }) {
    return this.prisma.$transaction(async tx => {
      const run = await this.runContext(tx, input.workflowRunId);
      await this.assertSourcesInRun(tx, run.organizationId, input.sourceArtifactIds);

      return this.create(tx, {
        organizationId: run.organizationId,
        projectId: run.feature.projectId,
        featureId: run.featureId,
        workflowRunId: run.id,
        type: input.type,
        title: input.title,
        content: input.content,
        sourceArtifactIds: input.sourceArtifactIds,
        metadata: input.metadata,
        createdByType: ActorType.user,
        createdById: input.actorId,
      });
    });
  }

  /** Bytes go to object storage first; the row is written once the object is durable. */
  async createFromUpload(input: {
    workflowRunId: string;
    type: ArtifactType;
    title: string;
    filename?: string;
    contentType?: string;
    bytes: Buffer;
    sourceArtifactIds?: string[];
    producedByJobId?: string;
    createdByType: ActorType;
    createdById?: string;
  }) {
    if (input.bytes.byteLength === 0) {
      throw new BadRequestException("Upload body is empty");
    }

    if (input.bytes.byteLength > this.storage.maxUploadBytes) {
      throw new PayloadTooLargeException(`Uploads are limited to ${this.storage.maxUploadBytes} bytes`);
    }

    const run = await this.runContext(this.prisma, input.workflowRunId);
    await this.assertSourcesInRun(this.prisma, run.organizationId, input.sourceArtifactIds);

    const artifactId = randomUUID();
    const storageKey = this.storage.objectKey({
      organizationId: run.organizationId,
      projectId: run.feature.projectId,
      artifactId,
      filename: input.filename ?? `${input.type}.bin`,
    });
    const checksum = createHash("sha256").update(input.bytes).digest("hex");

    await this.storage.putObject({ key: storageKey, body: input.bytes, contentType: input.contentType });

    return this.create(this.prisma, {
      id: artifactId,
      organizationId: run.organizationId,
      projectId: run.feature.projectId,
      featureId: run.featureId,
      workflowRunId: run.id,
      type: input.type,
      title: input.title,
      storageKey,
      contentType: input.contentType ?? "application/octet-stream",
      sizeBytes: input.bytes.byteLength,
      checksum,
      sourceArtifactIds: input.sourceArtifactIds,
      producedByJobId: input.producedByJobId,
      metadata: input.filename ? { filename: input.filename } : {},
      createdByType: input.createdByType,
      createdById: input.createdById,
    });
  }

  /** Every version of the same type on the same feature, newest first. */
  async listVersions(artifactId: string) {
    const artifact = await this.get(artifactId);
    return this.prisma.artifact.findMany({
      where: { projectId: artifact.projectId, featureId: artifact.featureId, type: artifact.type },
      orderBy: { version: "desc" },
      select: {
        id: true,
        version: true,
        title: true,
        checksum: true,
        storageKey: true,
        sizeBytes: true,
        createdByType: true,
        createdById: true,
        createdAt: true,
      },
    });
  }

  /** What this artifact was made from, the job that made it, and what was made from it. */
  async lineage(artifactId: string) {
    const artifact = await this.get(artifactId);
    const [sources, derived, producedByJob] = await Promise.all([
      this.prisma.artifact.findMany({
        where: { id: { in: artifact.sourceArtifactIds }, organizationId: artifact.organizationId },
        select: { id: true, type: true, version: true, title: true, createdAt: true },
      }),
      this.prisma.artifact.findMany({
        where: { organizationId: artifact.organizationId, sourceArtifactIds: { has: artifact.id } },
        orderBy: { createdAt: "asc" },
        select: { id: true, type: true, version: true, title: true, createdAt: true },
      }),
      artifact.producedByJobId
        ? this.prisma.job.findUnique({
            where: { id: artifact.producedByJobId },
            select: { id: true, state: true, agentType: true, status: true, runnerId: true, attempt: true, completedAt: true },
          })
        : Promise.resolve(null),
    ]);

    return { artifact, sources, derived, producedByJob };
  }

  async get(artifactId: string) {
    const artifact = await this.prisma.artifact.findUnique({ where: { id: artifactId } });
    if (!artifact) throw new NotFoundException("Artifact not found");
    return artifact;
  }

  /** The bytes of a stored artifact, as a stream with its headers. Inline artifacts are served as JSON. */
  async content(artifactId: string) {
    const artifact = await this.get(artifactId);

    if (artifact.storageKey) {
      const object = await this.storage.getObject(artifact.storageKey);
      return { artifact, stream: object.stream, contentType: object.contentType ?? artifact.contentType ?? "application/octet-stream", contentLength: object.contentLength ?? artifact.sizeBytes ?? undefined };
    }

    const body = Buffer.from(JSON.stringify(artifact.content, null, 2));
    return { artifact, stream: null, body, contentType: "application/json; charset=utf-8", contentLength: body.byteLength };
  }

  /** Artifacts a job has already uploaded before completing, so completion can link them. */
  listProducedByJob(client: Client, jobId: string) {
    return client.artifact.findMany({ where: { producedByJobId: jobId }, orderBy: { createdAt: "asc" } });
  }

  private async runContext(client: Client, workflowRunId: string) {
    const run = await client.workflowRun.findUnique({
      where: { id: workflowRunId },
      include: { feature: { select: { projectId: true } } },
    });
    if (!run) throw new NotFoundException("Workflow run not found");
    return run;
  }

  /** Lineage may only point at artifacts in the same organization. */
  private async assertSourcesInRun(client: Client, organizationId: string, sourceArtifactIds?: string[]) {
    if (!sourceArtifactIds?.length) return;
    const count = await client.artifact.count({ where: { id: { in: sourceArtifactIds }, organizationId } });
    if (count !== new Set(sourceArtifactIds).size) {
      throw new BadRequestException("One or more source artifacts do not exist in this organization");
    }
  }
}
