import { Body, Controller, Get, Headers, HttpCode, Post, Res } from "@nestjs/common";
import { signInSchema, signUpSchema, type SignInInput, type SignUpInput } from "@sydeso/api-contracts";
import type { Response } from "express";

import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { AuthService } from "./auth.service";
import { type AuthContext, SESSION_COOKIE } from "./auth.types";
import { CurrentAuth, Public } from "./decorators";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("sign-up")
  async signUp(
    @Body(new ZodValidationPipe(signUpSchema)) body: SignUpInput,
    @Headers("user-agent") userAgent: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.signUp(body, userAgent);
    this.setCookie(response, result.token, result.expiresAt);
    return result;
  }

  @Public()
  @HttpCode(200)
  @Post("sign-in")
  async signIn(
    @Body(new ZodValidationPipe(signInSchema)) body: SignInInput,
    @Headers("user-agent") userAgent: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.signIn(body, userAgent);
    this.setCookie(response, result.token, result.expiresAt);
    return result;
  }

  @HttpCode(204)
  @Post("sign-out")
  async signOut(@CurrentAuth() auth: AuthContext, @Res({ passthrough: true }) response: Response) {
    await this.auth.signOut(auth.sessionId);
    response.clearCookie(SESSION_COOKIE, { path: "/" });
  }

  @Get("me")
  me(@CurrentAuth() auth: AuthContext) {
    return this.auth.me(auth.user.id);
  }

  private setCookie(response: Response, token: string, expiresAt: Date) {
    response.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });
  }
}
