import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { CoreLoopService } from "../core-loop/core-loop.service";

@Controller()
export class FoundationController {
  constructor(private readonly coreLoop: CoreLoopService) {}

  @Post("organizations")
  createOrganization(@Body() body: { name: string; slug: string }) {
    return this.coreLoop.createOrganization(body);
  }

  @Get("organizations")
  listOrganizations() {
    return this.coreLoop.listOrganizations();
  }

  @Post("organizations/:organizationId/workspaces")
  createWorkspace(
    @Param("organizationId") organizationId: string,
    @Body() body: { name: string; slug: string },
  ) {
    return this.coreLoop.createWorkspace({ organizationId, ...body });
  }

  @Get("organizations/:organizationId/workspaces")
  listWorkspaces(@Param("organizationId") organizationId: string) {
    return this.coreLoop.listWorkspaces(organizationId);
  }

  @Post("workspaces/:workspaceId/projects")
  createProject(
    @Param("workspaceId") workspaceId: string,
    @Body()
    body: {
      name: string;
      repositoryUrl?: string;
      defaultBranch?: string;
      maxRemediationIterations?: number;
    },
  ) {
    return this.coreLoop.createProject({ workspaceId, ...body });
  }

  @Get("workspaces/:workspaceId/projects")
  listProjects(@Param("workspaceId") workspaceId: string) {
    return this.coreLoop.listProjects(workspaceId);
  }

  @Get("projects/:projectId")
  getProject(@Param("projectId") projectId: string) {
    return this.coreLoop.getProject(projectId);
  }
}
