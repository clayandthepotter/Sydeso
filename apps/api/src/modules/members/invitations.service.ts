import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ActorType, type OrganizationRole, Prisma } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";

import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../database/prisma.service";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Invitations carry a one-time token in a link. Only the hash is stored, so the link
 * is shown once to the inviter (and can be re-issued by revoking and inviting again).
 */
@Injectable()
export class InvitationsService {
  readonly invitationTtlMs = Number(process.env.INVITATION_TTL_DAYS ?? 7) * DAY_MS;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(input: { organizationId: string; email: string; role: OrganizationRole; invitedById: string }) {
    const token = randomBytes(32).toString("base64url");

    const invitation = await this.prisma.$transaction(async tx => {
      const member = await tx.membership.findFirst({
        where: { organizationId: input.organizationId, user: { email: input.email } },
      });

      if (member) {
        throw new BadRequestException("That person is already a member");
      }

      // One live invitation per address per organization.
      await tx.invitation.updateMany({
        where: { organizationId: input.organizationId, email: input.email, acceptedAt: null, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      const created = await tx.invitation.create({
        data: {
          organizationId: input.organizationId,
          email: input.email,
          role: input.role,
          tokenHash: this.hashToken(token),
          invitedById: input.invitedById,
          expiresAt: new Date(Date.now() + this.invitationTtlMs),
        },
      });

      await this.audit.record(tx, {
        organizationId: input.organizationId,
        actorType: ActorType.user,
        actorId: input.invitedById,
        action: "member.invited",
        entityType: "invitation",
        entityId: created.id,
        after: { email: input.email, role: input.role },
      });

      return created;
    });

    return { invitation: this.publicView(invitation), token };
  }

  async list(organizationId: string) {
    const rows = await this.prisma.invitation.findMany({
      where: { organizationId, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      include: { invitedBy: { select: { id: true, name: true, email: true } } },
    });

    return rows.map(row => ({ ...this.publicView(row), invitedBy: row.invitedBy }));
  }

  async revoke(organizationId: string, invitationId: string, actorId: string) {
    await this.prisma.$transaction(async tx => {
      const invitation = await tx.invitation.findFirst({ where: { id: invitationId, organizationId } });

      if (!invitation) {
        throw new NotFoundException("Invitation not found");
      }

      await tx.invitation.update({ where: { id: invitationId }, data: { revokedAt: new Date() } });

      await this.audit.record(tx, {
        organizationId,
        actorType: ActorType.user,
        actorId,
        action: "invitation.revoked",
        entityType: "invitation",
        entityId: invitationId,
        before: { email: invitation.email, role: invitation.role },
      });
    });
  }

  /** What an invite link shows before the person signs up or in: who invited them, to what, as which role. */
  async preview(token: string) {
    const invitation = await this.liveInvitation(this.prisma, token);

    return {
      email: invitation.email,
      role: invitation.role,
      organization: invitation.organization,
      invitedBy: invitation.invitedBy,
      expiresAt: invitation.expiresAt,
    };
  }

  async accept(token: string, user: { id: string; email: string }) {
    return this.prisma.$transaction(tx => this.acceptTx(tx, { token, user }));
  }

  /** Joins the organization in the invited role. Used by sign-up (same transaction) and by accept. */
  async acceptTx(tx: Prisma.TransactionClient, input: { token: string; user: { id: string; email: string } }) {
    const invitation = await this.liveInvitation(tx, input.token);

    if (invitation.email !== input.user.email) {
      throw new BadRequestException(`This invitation was sent to ${invitation.email}`);
    }

    const membership = await tx.membership.upsert({
      where: { organizationId_userId: { organizationId: invitation.organizationId, userId: input.user.id } },
      create: { organizationId: invitation.organizationId, userId: input.user.id, role: invitation.role },
      update: {},
    });

    await tx.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });

    await this.audit.record(tx, {
      organizationId: invitation.organizationId,
      actorType: ActorType.user,
      actorId: input.user.id,
      action: "member.joined",
      entityType: "membership",
      entityId: membership.id,
      after: { userId: input.user.id, role: membership.role, invitationId: invitation.id },
    });

    return { organizationId: invitation.organizationId, role: membership.role };
  }

  private async liveInvitation(client: Prisma.TransactionClient | PrismaService, token: string) {
    const invitation = await client.invitation.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        invitedBy: { select: { name: true } },
      },
    });

    if (!invitation || invitation.revokedAt || invitation.acceptedAt) {
      throw new NotFoundException("Invitation not found or already used");
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException("Invitation has expired");
    }

    return invitation;
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private publicView(row: { id: string; organizationId: string; email: string; role: OrganizationRole; expiresAt: Date; createdAt: Date }) {
    return {
      id: row.id,
      organizationId: row.organizationId,
      email: row.email,
      role: row.role,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
    };
  }
}
