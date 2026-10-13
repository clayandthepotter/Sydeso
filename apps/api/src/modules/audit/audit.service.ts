import { Injectable } from "@nestjs/common";
import { type ActorType, Prisma } from "@prisma/client";

import { PrismaService } from "../database/prisma.service";

type Client = Prisma.TransactionClient | PrismaService;

export interface AuditInput {
  organizationId: string;
  actorType: ActorType;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
}

/** Writes the organization audit log. Pass the transaction client when the action is transactional. */
@Injectable()
export class AuditService {
  record(client: Client, input: AuditInput) {
    return client.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        before: input.before === undefined ? undefined : toJson(input.before),
        after: input.after === undefined ? undefined : toJson(input.after),
        metadata: toJson(input.metadata ?? {}),
      },
    });
  }
}

export function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}
