import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ActorType, OrganizationRole, Prisma } from "@prisma/client";
import type {
  CreateOrganizationInput,
  CreateProjectInput,
  CreateWorkspaceInput,
  UpdateOrganizationInput,
  UpdateProjectInput,
  UpdateWorkspaceInput,
} from "@sydeso/api-contracts";

import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../database/prisma.service";

/** Organizations, workspaces and projects. Authorization happens in the controller; this is tenant-scoped data access. */
@Injectable()
export class FoundationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ------------------------------------------------------------ organizations

  /** Creates the organization and makes the creator its owner, in one transaction. */
  async createOrganization(input: CreateOrganizationInput, actorId: string) {
    const slug = input.slug ?? slugify(input.name);

    return this.prisma.$transaction(async tx => {
      const organization = await tx.organization.create({ data: { name: input.name, slug } });

      await tx.membership.create({
        data: { organizationId: organization.id, userId: actorId, role: OrganizationRole.owner },
      });

      await this.audit.record(tx, {
        organizationId: organization.id,
        actorType: ActorType.user,
        actorId,
        action: "organization.created",
        entityType: "organization",
        entityId: organization.id,
        after: { name: organization.name, slug: organization.slug },
      });

      return organization;
    });
  }

  /** Organizations the user belongs to, with their role in each. */
  async listOrganizationsForUser(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { organization: true },
    });

    return memberships.map(m => ({ ...m.organization, role: m.role }));
  }

  async getOrganization(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!organization) throw new NotFoundException("Organization not found");
    return organization;
  }

  async updateOrganization(organizationId: string, input: UpdateOrganizationInput, actorId: string) {
    return this.prisma.$transaction(async tx => {
      const before = await tx.organization.findUniqueOrThrow({ where: { id: organizationId } });
      const organization = await tx.organization.update({ where: { id: organizationId }, data: input });

      await this.audit.record(tx, {
        organizationId,
        actorType: ActorType.user,
        actorId,
        action: "organization.updated",
        entityType: "organization",
        entityId: organizationId,
        before: { name: before.name, slug: before.slug },
        after: { name: organization.name, slug: organization.slug },
      });

      return organization;
    });
  }

  async deleteOrganization(organizationId: string) {
    await this.prisma.organization.delete({ where: { id: organizationId } });
  }

  // ------------------------------------------------------------ workspaces

  async createWorkspace(organizationId: string, input: CreateWorkspaceInput, actorId: string) {
    const slug = input.slug ?? slugify(input.name);

    return this.prisma.$transaction(async tx => {
      const workspace = await tx.workspace.create({ data: { organizationId, name: input.name, slug } });

      await this.audit.record(tx, {
        organizationId,
        actorType: ActorType.user,
        actorId,
        action: "workspace.created",
        entityType: "workspace",
        entityId: workspace.id,
        after: { name: workspace.name, slug: workspace.slug },
      });

      return workspace;
    });
  }

  listWorkspaces(organizationId: string) {
    return this.prisma.workspace.findMany({ where: { organizationId }, orderBy: { createdAt: "asc" } });
  }

  async getWorkspace(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException("Workspace not found");
    return workspace;
  }

  async updateWorkspace(workspaceId: string, input: UpdateWorkspaceInput, actorId: string) {
    return this.prisma.$transaction(async tx => {
      const before = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
      const workspace = await tx.workspace.update({ where: { id: workspaceId }, data: input });

      await this.audit.record(tx, {
        organizationId: workspace.organizationId,
        actorType: ActorType.user,
        actorId,
        action: "workspace.updated",
        entityType: "workspace",
        entityId: workspaceId,
        before: { name: before.name, slug: before.slug },
        after: { name: workspace.name, slug: workspace.slug },
      });

      return workspace;
    });
  }

  async deleteWorkspace(workspaceId: string, actorId: string) {
    await this.prisma.$transaction(async tx => {
      const workspace = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
      const projects = await tx.project.count({ where: { workspaceId } });

      if (projects > 0) {
        throw new BadRequestException("Move or delete the workspace's projects first");
      }

      await tx.workspace.delete({ where: { id: workspaceId } });

      await this.audit.record(tx, {
        organizationId: workspace.organizationId,
        actorType: ActorType.user,
        actorId,
        action: "workspace.deleted",
        entityType: "workspace",
        entityId: workspaceId,
        before: { name: workspace.name, slug: workspace.slug },
      });
    });
  }

  // ------------------------------------------------------------ projects

  async createProject(workspaceId: string, input: CreateProjectInput, actorId: string) {
    return this.prisma.$transaction(async tx => {
      const workspace = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId } });

      const project = await tx.project.create({
        data: {
          organizationId: workspace.organizationId,
          workspaceId: workspace.id,
          name: input.name,
          repositoryUrl: input.repositoryUrl || undefined,
          defaultBranch: input.defaultBranch ?? "main",
          maxRemediationIterations: input.maxRemediationIterations ?? 3,
        },
      });

      await this.audit.record(tx, {
        organizationId: workspace.organizationId,
        actorType: ActorType.user,
        actorId,
        action: "project.created",
        entityType: "project",
        entityId: project.id,
        after: { name: project.name, workspaceId: project.workspaceId, repositoryUrl: project.repositoryUrl },
      });

      return project;
    });
  }

  listProjects(workspaceId: string, includeArchived = false) {
    return this.prisma.project.findMany({
      where: { workspaceId, ...(includeArchived ? {} : { archivedAt: null }) },
      orderBy: { createdAt: "asc" },
    });
  }

  async getProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { features: { orderBy: { createdAt: "desc" } } },
    });

    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  async updateProject(projectId: string, input: UpdateProjectInput, actorId: string) {
    const data: Prisma.ProjectUpdateInput = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.repositoryUrl !== undefined ? { repositoryUrl: input.repositoryUrl || null } : {}),
      ...(input.defaultBranch !== undefined ? { defaultBranch: input.defaultBranch } : {}),
      ...(input.maxRemediationIterations !== undefined
        ? { maxRemediationIterations: input.maxRemediationIterations }
        : {}),
    };

    return this.prisma.$transaction(async tx => {
      const before = await tx.project.findUniqueOrThrow({ where: { id: projectId } });
      const project = await tx.project.update({ where: { id: projectId }, data });

      await this.audit.record(tx, {
        organizationId: project.organizationId,
        actorType: ActorType.user,
        actorId,
        action: "project.updated",
        entityType: "project",
        entityId: projectId,
        before: pickProject(before),
        after: pickProject(project),
      });

      return project;
    });
  }

  async setProjectArchived(projectId: string, archived: boolean, actorId: string) {
    return this.prisma.$transaction(async tx => {
      const project = await tx.project.update({
        where: { id: projectId },
        data: { archivedAt: archived ? new Date() : null },
      });

      await this.audit.record(tx, {
        organizationId: project.organizationId,
        actorType: ActorType.user,
        actorId,
        action: archived ? "project.archived" : "project.unarchived",
        entityType: "project",
        entityId: projectId,
      });

      return project;
    });
  }

  async deleteProject(projectId: string, actorId: string) {
    await this.prisma.$transaction(async tx => {
      const project = await tx.project.findUniqueOrThrow({ where: { id: projectId } });
      await tx.project.delete({ where: { id: projectId } });

      await this.audit.record(tx, {
        organizationId: project.organizationId,
        actorType: ActorType.user,
        actorId,
        action: "project.deleted",
        entityType: "project",
        entityId: projectId,
        before: pickProject(project),
      });
    });
  }
}

function pickProject(p: { name: string; repositoryUrl: string | null; defaultBranch: string; maxRemediationIterations: number }) {
  return {
    name: p.name,
    repositoryUrl: p.repositoryUrl,
    defaultBranch: p.defaultBranch,
    maxRemediationIterations: p.maxRemediationIterations,
  };
}

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug.length >= 2 ? slug : `${slug}-${Date.now().toString(36)}`;
}
