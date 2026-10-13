import { createParamDecorator, type ExecutionContext, SetMetadata } from "@nestjs/common";
import type { Request } from "express";

import type { AuthContext } from "./auth.types";

export const IS_PUBLIC = "sydeso:public";

/** Marks a route as reachable without a user session (health, waitlist, sign-in, runner protocol). */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** The signed-in user, as attached by AuthGuard. */
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<Request & { auth?: AuthContext }>();
  return request.auth?.user;
});

/** The whole auth context (user and session id). */
export const CurrentAuth = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<Request & { auth?: AuthContext }>();
  return request.auth;
});
