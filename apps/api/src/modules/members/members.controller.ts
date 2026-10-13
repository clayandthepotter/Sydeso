import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, Param, Patch, Post } from "@nestjs/common";
import {
  inviteMemberSchema,
  updateMemberRoleSchema,
  type InviteMemberInput,
  type UpdateMemberRoleInput,
} from "@sydeso/api-contracts";
import { assignableRoles } from "@sydeso/domain";

import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { AccessService } from "../access/access.service";
import type { SessionUser } from "../auth/auth.types";
import { CurrentUser, Public } from "../auth/decorators";
import { InvitationsService } from "./invitations.service";
import { MembersService } from "./members.service";

@Controller()
export class MembersController {
  constructor(
    private readonly members: MembersService,
    private readonly invitations: InvitationsService,
    private readonly access: AccessService,
  ) {}

  @Get("organizations/:organizationId/members")
  async list(@CurrentUser() user: SessionUser, @Param("organizationId") organizationId: string) {
    const grant = await this.access.require(user.id, organizationId, "organization.members.read");
    const members = await this.members.list(organizationId);
    return { members, assignableRoles: assignableRoles(grant.role) };
  }

  @Patch("organizations/:organizationId/members/:userId")
  async updateRole(
    @CurrentUser() user: SessionUser,
    @Param("organizationId") organizationId: string,
    @Param("userId") userId: string,
    @Body(new ZodValidationPipe(updateMemberRoleSchema)) body: UpdateMemberRoleInput,
  ) {
    const grant = await this.access.require(user.id, organizationId, "organization.members.manage");
    return this.members.updateRole({ organizationId, userId, role: body.role, actorId: user.id, actorRole: grant.role });
  }

  @Delete("organizations/:organizationId/members/:userId")
  @HttpCode(204)
  async remove(
    @CurrentUser() user: SessionUser,
    @Param("organizationId") organizationId: string,
    @Param("userId") userId: string,
  ) {
    const permission = userId === user.id ? "organization.read" : "organization.members.manage";
    const grant = await this.access.require(user.id, organizationId, permission);
    await this.members.remove({ organizationId, userId, actorId: user.id, actorRole: grant.role });
  }

  @Get("organizations/:organizationId/invitations")
  async listInvitations(@CurrentUser() user: SessionUser, @Param("organizationId") organizationId: string) {
    await this.access.require(user.id, organizationId, "organization.members.read");
    return this.invitations.list(organizationId);
  }

  @Post("organizations/:organizationId/invitations")
  async invite(
    @CurrentUser() user: SessionUser,
    @Param("organizationId") organizationId: string,
    @Body(new ZodValidationPipe(inviteMemberSchema)) body: InviteMemberInput,
  ) {
    const grant = await this.access.require(user.id, organizationId, "organization.members.manage");

    if (!assignableRoles(grant.role).includes(body.role)) {
      throw new ForbiddenException(`Your role (${grant.role}) cannot invite a ${body.role}`);
    }

    return this.invitations.create({ organizationId, email: body.email, role: body.role, invitedById: user.id });
  }

  @Delete("organizations/:organizationId/invitations/:invitationId")
  @HttpCode(204)
  async revoke(
    @CurrentUser() user: SessionUser,
    @Param("organizationId") organizationId: string,
    @Param("invitationId") invitationId: string,
  ) {
    await this.access.require(user.id, organizationId, "organization.members.manage");
    await this.invitations.revoke(organizationId, invitationId, user.id);
  }

  /** Public so an invite link can show the organization before the person has an account. */
  @Public()
  @Get("invitations/:token")
  preview(@Param("token") token: string) {
    return this.invitations.preview(token);
  }

  @Post("invitations/:token/accept")
  accept(@CurrentUser() user: SessionUser, @Param("token") token: string) {
    return this.invitations.accept(token, user);
  }
}
