import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import type { OrganizationRole } from "@prisma/client";
import type { SignInInput, SignUpInput } from "@sydeso/api-contracts";
import { createHash, randomBytes } from "node:crypto";

import { PrismaService } from "../database/prisma.service";
import { InvitationsService } from "../members/invitations.service";
import type { AuthContext, SessionUser } from "./auth.types";
import { PasswordService } from "./password.service";

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  /** Sessions live this long after their last use. */
  readonly sessionTtlMs = Number(process.env.SESSION_TTL_DAYS ?? 30) * DAY_MS;

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly invitations: InvitationsService,
  ) {}

  /**
   * Creates the account. With an invitation token the user joins that organization in the
   * invited role; without one they start with no organization and create one from the app.
   */
  async signUp(input: SignUpInput, userAgent?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });

    if (existing) {
      throw new BadRequestException("An account with that email already exists");
    }

    const passwordHash = await this.passwords.hash(input.password);

    const user = await this.prisma.$transaction(async tx => {
      const created = await tx.user.create({
        data: { email: input.email, name: input.name, passwordHash },
      });

      if (input.invitationToken) {
        await this.invitations.acceptTx(tx, { token: input.invitationToken, user: created });
      }

      return created;
    });

    const session = await this.createSession(user.id, userAgent);

    return { user: this.toSessionUser(user), token: session.token, expiresAt: session.expiresAt };
  }

  async signIn(input: SignInInput, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    const valid = user ? await this.passwords.verify(user.passwordHash, input.password) : false;

    if (!user || !valid) {
      throw new UnauthorizedException("Email or password is incorrect");
    }

    const session = await this.createSession(user.id, userAgent);

    return { user: this.toSessionUser(user), token: session.token, expiresAt: session.expiresAt };
  }

  async signOut(sessionId: string) {
    await this.prisma.session.deleteMany({ where: { id: sessionId } });
  }

  /** Resolves a bearer or cookie token to its user, sliding the expiry on use. */
  async authenticate(token: string): Promise<AuthContext | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: { user: true },
    });

    if (!session) return null;

    const now = Date.now();

    if (session.expiresAt.getTime() <= now) {
      await this.prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      return null;
    }

    // Slide the window at most once an hour so busy clients do not write on every request.
    if (now - session.lastUsedAt.getTime() > 60 * 60 * 1000) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { lastUsedAt: new Date(now), expiresAt: new Date(now + this.sessionTtlMs) },
      });
    }

    return { user: this.toSessionUser(session.user), sessionId: session.id };
  }

  /** The signed-in user with every organization they belong to and their role in each. */
  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          orderBy: { createdAt: "asc" },
          include: { organization: { select: { id: true, name: true, slug: true, plan: true } } },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("Session user no longer exists");
    }

    return {
      user: this.toSessionUser(user),
      memberships: user.memberships.map(m => ({
        organizationId: m.organizationId,
        organization: m.organization,
        role: m.role as OrganizationRole,
        createdAt: m.createdAt,
      })),
    };
  }

  private async createSession(userId: string, userAgent?: string) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + this.sessionTtlMs);

    await this.prisma.session.create({
      data: { userId, tokenHash: this.hashToken(token), userAgent: userAgent?.slice(0, 512), expiresAt },
    });

    return { token, expiresAt };
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private toSessionUser(user: { id: string; email: string; name: string }): SessionUser {
    return { id: user.id, email: user.email, name: user.name };
  }
}
