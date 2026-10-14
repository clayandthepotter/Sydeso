import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Injectable, Logger, type OnModuleInit, ServiceUnavailableException } from "@nestjs/common";
import type { Readable } from "node:stream";

export interface StoredObject {
  stream: Readable;
  contentType?: string;
  contentLength?: number;
}

/**
 * S3-compatible object storage for artifact bytes that do not belong inline in Postgres.
 * Works against AWS S3, MinIO, R2 or any compatible endpoint. Configured entirely from
 * STORAGE_* environment variables; when none are set, uploads answer 503 and everything
 * inline keeps working.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null;
  readonly bucket = process.env.STORAGE_BUCKET ?? "sydeso-artifacts";
  readonly maxUploadBytes = Number(process.env.STORAGE_MAX_UPLOAD_BYTES ?? 50 * 1024 * 1024);

  constructor() {
    const endpoint = process.env.STORAGE_ENDPOINT;
    const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
    const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;

    this.client =
      accessKeyId && secretAccessKey
        ? new S3Client({
            region: process.env.STORAGE_REGION ?? "us-east-1",
            endpoint: endpoint || undefined,
            forcePathStyle: (process.env.STORAGE_FORCE_PATH_STYLE ?? (endpoint ? "true" : "false")) === "true",
            credentials: { accessKeyId, secretAccessKey },
          })
        : null;
  }

  get configured() {
    return this.client !== null;
  }

  async onModuleInit() {
    if (!this.client) {
      this.logger.warn("Object storage is not configured (STORAGE_ACCESS_KEY_ID / STORAGE_SECRET_ACCESS_KEY); artifact uploads are disabled");
      return;
    }

    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Created bucket ${this.bucket}`);
      } catch (error) {
        this.logger.error(`Bucket ${this.bucket} is not reachable: ${(error as Error).message}`);
      }
    }
  }

  async putObject(input: { key: string; body: Buffer; contentType?: string }) {
    const client = this.require();
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType ?? "application/octet-stream",
        ContentLength: input.body.byteLength,
      }),
    );
  }

  async getObject(key: string): Promise<StoredObject> {
    const client = this.require();
    const result = await client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    return {
      stream: result.Body as Readable,
      contentType: result.ContentType,
      contentLength: result.ContentLength,
    };
  }

  /** Where an artifact's bytes live. Scoped by tenant so a key alone reveals its owner. */
  objectKey(input: { organizationId: string; projectId: string; artifactId: string; filename: string }) {
    const safe = input.filename.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 120) || "artifact";
    return `organizations/${input.organizationId}/projects/${input.projectId}/artifacts/${input.artifactId}/${safe}`;
  }

  private require() {
    if (!this.client) {
      throw new ServiceUnavailableException("Object storage is not configured on this server");
    }
    return this.client;
  }
}
