import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ActorType, OrganizationRole, type Prisma } from "@prisma/client";
import { assignableRoles } from "@sydeso/domain";

import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(organizationId: string) {
    const rows = await this.prisma.membership.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return rows.map(row => ({
      id: row.id,
      organizationId: row.organizationId,
      role: row.role,
      user: row.user,
      createdAt: row.createdAt,
    }));
  }

  /** Changes a member's role. The actor may only grant roles their own role can assign, and the last owner stays. */
  async updateRole(input: { organizationId: string; userId: string; role: OrganizationRole; actorId: string; actorRole: OrganizationRole }) {
    this.assertAssignable(input.actorRole, input.role);

    return this.prisma.$transaction(async tx => {
      const membership = await tx.membership.findUnique({
        where: { organizationId_userId: { organizationId: input.organizationId, userId: input.userId } },
      });

      if (!membership) {
        throw new NotFoundException("Member not found");
      }

      this.assertAssignable(input.actorRole, membership.role);

      if (membership.role === OrganizationRole.owner && input.role !== OrganizationRole.owner) {
        await this.assertNotLastOwner(tx, input.organizationId);
      }

      const updated = await tx.membership.update({
        where: { id: membership.id },
        data: { role: input.role },
      });

      await this.audit.record(tx, {
        organizationId: input.organizationId,
        actorType: ActorType.user,
        actorId: input.actorId,
        action: "member.role_updated",
        entityType: "membership",
        entityId: membership.id,
        before: { userId: input.userId, role: membership.role },
        after: { userId: input.userId, role: updated.role },
      });

      return updated;
    });
  }

  async remove(input: { organizationId: string; userId: string; actorId: string; actorRole: OrganizationRole }) {
    await this.prisma.$transaction(async tx => {
      const membership = await tx.membership.findUnique({
        where: { organizationId_userId: { organizationId: input.organizationId, userId: input.userId } },
      });

      if (!membership) {
        throw new NotFoundException("Member not found");
      }

      // Leaving is always allowed; removing someone else needs a role that could have assigned theirs.
      if (input.userId !== input.actorId) {
        this.assertAssignable(input.actorRole, membership.role);
      }

      if (membership.role === OrganizationRole.owner) {
        await this.assertNotLastOwner(tx, input.organizationId);
      }

      await tx.membership.delete({ where: { id: membership.id } });

      await this.audit.record(tx, {
        organizationId: input.organizationId,
        actorType: ActorType.user,
        actorId: input.actorId,
        action: input.userId === input.actorId ? "member.left" : "member.removed",
        entityType: "membership",
        entityId: membership.id,
        before: { userId: input.userId, role: membership.role },
      });
    });
  }

  private assertAssignable(actorRole: OrganizationRole, role: OrganizationRole) {
    if (!assignableRoles(actorRole).includes(role)) {
      throw new ForbiddenException(`Your role (${actorRole}) cannot assign or change the ${role} role`);
    }
  }

  private async assertNotLastOwner(tx: Prisma.TransactionClient, organizationId: string) {
    const owners = await tx.membership.count({ where: { organizationId, role: OrganizationRole.owner } });

    if (owners <= 1) {
      throw new BadRequestException("An organization must keep at least one owner");
    }
  }
}
