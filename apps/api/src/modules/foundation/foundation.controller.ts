import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import {
  createOrganizationSchema,
  createProjectSchema,
  createWorkspaceSchema,
  updateOrganizationSchema,
  updateProjectSchema,
  updateWorkspaceSchema,
  type CreateOrganizationInput,
  type CreateProjectInput,
  type CreateWorkspaceInput,
  type UpdateOrganizationInput,
  type UpdateProjectInput,
  type UpdateWorkspaceInput,
} from "@sydeso/api-contracts";

import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { AccessService } from "../access/access.service";
import type { SessionUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators";
import { CoreLoopService } from "../core-loop/core-loop.service";
import { FoundationService } from "./foundation.service";

@Controller()
export class FoundationController {
  constructor(
    private readonly foundation: FoundationService,
    private readonly access: AccessService,
    private readonly coreLoop: CoreLoopService,
  ) {}

  // ------------------------------------------------------------ organizations

  @Post("organizations")
  createOrganization(
    @CurrentUser() user: SessionUser,
    @Body(new ZodValidationPipe(createOrganizationSchema)) body: CreateOrganizationInput,
  ) {
    return this.foundation.createOrganization(body, user.id);
  }

  @Get("organizations")
  listOrganizations(@CurrentUser() user: SessionUser) {
    return this.foundation.listOrganizationsForUser(user.id);
  }

  @Get("organizations/:organizationId")
  async getOrganization(@CurrentUser() user: SessionUser, @Param("organizationId") organizationId: string) {
    const grant = await this.access.require(user.id, organizationId, "organization.read");
    const organization = await this.foundation.getOrganization(organizationId);
    return { ...organization, role: grant.role };
  }

  @Patch("organizations/:organizationId")
  async updateOrganization(
    @CurrentUser() user: SessionUser,
    @Param("organizationId") organizationId: string,
    @Body(new ZodValidationPipe(updateOrganizationSchema)) body: UpdateOrganizationInput,
  ) {
    await this.access.require(user.id, organizationId, "organization.update");
    return this.foundation.updateOrganization(organizationId, body, user.id);
  }

  @Delete("organizations/:organizationId")
  @HttpCode(204)
  async deleteOrganization(@CurrentUser() user: SessionUser, @Param("organizationId") organizationId: string) {
    await this.access.require(user.id, organizationId, "organization.delete");
    await this.foundation.deleteOrganization(organizationId);
  }

  @Get("organizations/:organizationId/audit")
  async listAuditLogs(@CurrentUser() user: SessionUser, @Param("organizationId") organizationId: string) {
    await this.access.require(user.id, organizationId, "audit.read");
    return this.coreLoop.listAuditLogs(organizationId);
  }

  // ------------------------------------------------------------ workspaces

  @Post("organizations/:organizationId/workspaces")
  async createWorkspace(
    @CurrentUser() user: SessionUser,
    @Param("organizationId") organizationId: string,
    @Body(new ZodValidationPipe(createWorkspaceSchema)) body: CreateWorkspaceInput,
  ) {
    await this.access.require(user.id, organizationId, "workspace.create");
    return this.foundation.createWorkspace(organizationId, body, user.id);
  }

  @Get("organizations/:organizationId/workspaces")
  async listWorkspaces(@CurrentUser() user: SessionUser, @Param("organizationId") organizationId: string) {
    await this.access.require(user.id, organizationId, "workspace.read");
    return this.foundation.listWorkspaces(organizationId);
  }

  @Get("workspaces/:workspaceId")
  async getWorkspace(@CurrentUser() user: SessionUser, @Param("workspaceId") workspaceId: string) {
    const organizationId = await this.access.organizationOfWorkspace(workspaceId);
    await this.access.require(user.id, organizationId, "workspace.read");
    return this.foundation.getWorkspace(workspaceId);
  }

  @Patch("workspaces/:workspaceId")
  async updateWorkspace(
    @CurrentUser() user: SessionUser,
    @Param("workspaceId") workspaceId: string,
    @Body(new ZodValidationPipe(updateWorkspaceSchema)) body: UpdateWorkspaceInput,
  ) {
    const organizationId = await this.access.organizationOfWorkspace(workspaceId);
    await this.access.require(user.id, organizationId, "workspace.update");
    return this.foundation.updateWorkspace(workspaceId, body, user.id);
  }

  @Delete("workspaces/:workspaceId")
  @HttpCode(204)
  async deleteWorkspace(@CurrentUser() user: SessionUser, @Param("workspaceId") workspaceId: string) {
    const organizationId = await this.access.organizationOfWorkspace(workspaceId);
    await this.access.require(user.id, organizationId, "workspace.delete");
    await this.foundation.deleteWorkspace(workspaceId, user.id);
  }

  // ------------------------------------------------------------ projects

  @Post("workspaces/:workspaceId/projects")
  async createProject(
    @CurrentUser() user: SessionUser,
    @Param("workspaceId") workspaceId: string,
    @Body(new ZodValidationPipe(createProjectSchema)) body: CreateProjectInput,
  ) {
    const organizationId = await this.access.organizationOfWorkspace(workspaceId);
    await this.access.require(user.id, organizationId, "project.create");
    return this.foundation.createProject(workspaceId, body, user.id);
  }

  @Get("workspaces/:workspaceId/projects")
  async listProjects(
    @CurrentUser() user: SessionUser,
    @Param("workspaceId") workspaceId: string,
    @Query("archived") archived?: string,
  ) {
    const organizationId = await this.access.organizationOfWorkspace(workspaceId);
    await this.access.require(user.id, organizationId, "project.read");
    return this.foundation.listProjects(workspaceId, archived === "true");
  }

  @Get("projects/:projectId")
  async getProject(@CurrentUser() user: SessionUser, @Param("projectId") projectId: string) {
    const organizationId = await this.access.organizationOfProject(projectId);
    await this.access.require(user.id, organizationId, "project.read");
    return this.foundation.getProject(projectId);
  }

  @Patch("projects/:projectId")
  async updateProject(
    @CurrentUser() user: SessionUser,
    @Param("projectId") projectId: string,
    @Body(new ZodValidationPipe(updateProjectSchema)) body: UpdateProjectInput,
  ) {
    const organizationId = await this.access.organizationOfProject(projectId);
    await this.access.require(user.id, organizationId, "project.update");
    return this.foundation.updateProject(projectId, body, user.id);
  }

  @Post("projects/:projectId/archive")
  async archiveProject(@CurrentUser() user: SessionUser, @Param("projectId") projectId: string) {
    const organizationId = await this.access.organizationOfProject(projectId);
    await this.access.require(user.id, organizationId, "project.archive");
    return this.foundation.setProjectArchived(projectId, true, user.id);
  }

  @Post("projects/:projectId/unarchive")
  async unarchiveProject(@CurrentUser() user: SessionUser, @Param("projectId") projectId: string) {
    const organizationId = await this.access.organizationOfProject(projectId);
    await this.access.require(user.id, organizationId, "project.archive");
    return this.foundation.setProjectArchived(projectId, false, user.id);
  }

  @Delete("projects/:projectId")
  @HttpCode(204)
  async deleteProject(@CurrentUser() user: SessionUser, @Param("projectId") projectId: string) {
    const organizationId = await this.access.organizationOfProject(projectId);
    await this.access.require(user.id, organizationId, "project.delete");
    await this.foundation.deleteProject(projectId, user.id);
  }
}
