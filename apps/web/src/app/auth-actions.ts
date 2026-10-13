"use server";

import { redirect } from "next/navigation";
import { signInSchema, signUpSchema } from "@sydeso/api-contracts";

import { api, ApiError } from "../lib/api";
import { clearSessionCookie, setSessionCookie } from "../lib/session";

export interface AuthActionState {
  error?: string;
}

function messageOf(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

/** Only same-site paths may be used as a post-sign-in destination. */
function safeNext(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/app";
}

export async function signInAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({ email: text(formData, "email"), password: String(formData.get("password") ?? "") });
  if (!parsed.success) return { error: "Enter your email and password" };

  try {
    const result = await api.signIn(parsed.data);
    await setSessionCookie(result.token, result.expiresAt);
  } catch (error) {
    return { error: messageOf(error) };
  }

  redirect(safeNext(text(formData, "next")));
}

export async function signUpAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    email: text(formData, "email"),
    name: text(formData, "name"),
    password: String(formData.get("password") ?? ""),
    invitationToken: text(formData, "invitationToken") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form" };

  try {
    const result = await api.signUp(parsed.data);
    await setSessionCookie(result.token, result.expiresAt);
  } catch (error) {
    return { error: messageOf(error) };
  }

  redirect("/app");
}

export async function signOutAction() {
  try {
    await api.signOut();
  } catch {
    // the session may already be gone; clearing the cookie is what matters
  }
  await clearSessionCookie();
  redirect("/sign-in");
}

export async function acceptInvitationAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const token = text(formData, "token");
  let organizationId: string;
  try {
    const result = await api.acceptInvitation(token);
    organizationId = result.organizationId;
  } catch (error) {
    return { error: messageOf(error) };
  }
  redirect(`/app/organizations/${organizationId}`);
}
