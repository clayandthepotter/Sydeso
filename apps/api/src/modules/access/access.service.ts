import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { OrganizationRole } from "@prisma/client";
import type { WorkflowState } from "@prisma/client";
import { defaultWorkflowRules, hasPermission, type Permission, type WorkflowTransitionRule } from "@sydeso/domain";

import { PrismaService } from "../database/prisma.service";

export interface Grant {
  organizationId: string;
  role: OrganizationRole;
}

/**
 * Tenant scoping and authorization in one place. Every controller resolves the organization
 * that owns the entity it touches, then asks for a permission. A missing entity and an entity
 * in another organization both answer 404, so existence is never leaked across tenants.
 */
@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async membership(userId: string, organizationId: string): Promise<Grant | null> {
    const membership = await this.prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      select: { organizationId: true, role: true },
    });
    return membership;
  }

  /** Requires the user to hold `permission` in the organization. 404 if not a member, 403 if the role lacks it. */
  async require(userId: string, organizationId: string, permission: Permission): Promise<Grant> {
    const grant = await this.membership(userId, organizationId);

    if (!grant) {
      throw new NotFoundException("Organization not found");
    }

    if (!hasPermission(grant.role, permission)) {
      throw new ForbiddenException(`Your role (${grant.role}) cannot ${permission}`);
    }

    return grant;
  }

  can(grant: Grant, permission: Permission) {
    return hasPermission(grant.role, permission);
  }

  /** The permission a transition needs: approvals for gated transitions, escalation for escalate, else transition. */
  permissionForTransition(rule: WorkflowTransitionRule): Permission {
    if (rule.requiresApproval) return "approval.approve";
    if (rule.to === "escalated") return "workflow.escalate";
    return "workflow.transition";
  }

  /**
   * The permission for moving a run to `toState` from where it is now. An unknown transition
   * falls back to `workflow.transition`; the workflow service then rejects it as invalid.
   */
  async permissionForRunTransition(workflowRunId: string, toState: WorkflowState): Promise<Permission> {
    const run = await this.prisma.workflowRun.findUnique({ where: { id: workflowRunId }, select: { currentState: true } });
    const rule = run && defaultWorkflowRules.find(r => r.from === run.currentState && r.to === toState);
    return rule ? this.permissionForTransition(rule) : "workflow.transition";
  }

  // ------------------------------------------------------------ tenant resolution

  async organizationOfWorkspace(workspaceId: string) {
    const row = await this.prisma.workspace.findUnique({ where: { id: workspaceId }, select: { organizationId: true } });
    return row?.organizationId ?? this.notFound("Workspace");
  }

  async organizationOfProject(projectId: string) {
    const row = await this.prisma.project.findUnique({ where: { id: projectId }, select: { organizationId: true } });
    return row?.organizationId ?? this.notFound("Project");
  }

  async organizationOfFeature(featureId: string) {
    const row = await this.prisma.feature.findUnique({ where: { id: featureId }, select: { organizationId: true } });
    return row?.organizationId ?? this.notFound("Feature");
  }

  async organizationOfWorkflowRun(workflowRunId: string) {
    const row = await this.prisma.workflowRun.findUnique({
      where: { id: workflowRunId },
      select: { organizationId: true },
    });
    return row?.organizationId ?? this.notFound("Workflow run");
  }

  async organizationOfArtifact(artifactId: string) {
    const row = await this.prisma.artifact.findUnique({ where: { id: artifactId }, select: { organizationId: true } });
    return row?.organizationId ?? this.notFound("Artifact");
  }

  private notFound(entity: string): never {
    throw new NotFoundException(`${entity} not found`);
  }
}
