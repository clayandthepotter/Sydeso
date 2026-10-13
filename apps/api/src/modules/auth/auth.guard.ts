import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";

import { readCookie } from "../../common/cookies";
import { AuthService } from "./auth.service";
import { type AuthContext, SESSION_COOKIE } from "./auth.types";
import { IS_PUBLIC } from "./decorators";

/**
 * Global guard. Every route needs a session unless it is marked @Public(). The token comes
 * from `Authorization: Bearer …` (the web app and CLIs) or the session cookie (direct browser use).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { auth?: AuthContext }>();
    const token = readSessionToken(request);

    if (!token) {
      throw new UnauthorizedException("Sign in to continue");
    }

    const auth = await this.auth.authenticate(token);

    if (!auth) {
      throw new UnauthorizedException("Session expired or invalid");
    }

    request.auth = auth;
    return true;
  }
}

export function readSessionToken(request: Request) {
  const [scheme, bearer] = request.headers.authorization?.split(" ") ?? [];
  if (scheme === "Bearer" && bearer) return bearer;
  return readCookie(request.headers.cookie, SESSION_COOKIE);
}
