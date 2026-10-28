"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { artifactTypeSchema, organizationRoleSchema, workflowStateSchema } from "@sydeso/api-contracts";

import { api, ApiError } from "../../lib/api";
import { titleFrom } from "../../lib/requests";

export interface ActionState {
  error?: string;
  ok?: boolean;
}

export interface RunnerActionState extends ActionState {
  runnerToken?: string;
  runnerName?: string;
}

export interface InviteActionState extends ActionState {
  inviteUrl?: string;
  email?: string;
}

function messageOf(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createOrganizationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = text(formData, "name");
  if (!name) return { error: "Name is required" };
  let organizationId: string;
  try {
    const organization = await api.createOrganization({ name, slug: text(formData, "slug") || undefined });
    organizationId = organization.id;
  } catch (error) {
    return { error: messageOf(error) };
  }
  revalidatePath("/app");
  redirect(`/app/organizations/${organizationId}`);
}

export async function createWorkspaceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const organizationId = text(formData, "organizationId");
  const name = text(formData, "name");
  if (!name) return { error: "Name is required" };
  try {
    await api.createWorkspace(organizationId, { name, slug: text(formData, "slug") || undefined });
  } catch (error) {
    return { error: messageOf(error) };
  }
  revalidatePath(`/app/organizations/${organizationId}`);
  return { ok: true };
}

export async function createProjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const workspaceId = text(formData, "workspaceId");
  const organizationId = text(formData, "organizationId");
  const name = text(formData, "name");
  if (!name) return { error: "Name is required" };
  let projectId: string;
  try {
    const project = await api.createProject(workspaceId, {
      name,
      repositoryUrl: text(formData, "repositoryUrl") || undefined,
      defaultBranch: text(formData, "defaultBranch") || undefined,
    });
    projectId = project.id;
  } catch (error) {
    return { error: messageOf(error) };
  }
  revalidatePath(`/app/organizations/${organizationId}`);
  revalidatePath("/app");
  redirect(`/app/projects/${projectId}/requests`);
}

export async function createRequestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const projectId = text(formData, "projectId");
  const description = text(formData, "description");
  if (description.split(/\s+/).filter(Boolean).length < 3) return { error: "Write at least one sentence" };
  const title = titleFrom(description);
  let requestId: string;
  try {
    const result = await api.createFeature(projectId, { title, description });
    requestId = result.feature.id;
  } catch (error) {
    return { error: messageOf(error) };
  }
  revalidatePath(`/app/projects/${projectId}/requests`);
  revalidatePath("/app");
  redirect(`/app/projects/${projectId}/requests/${requestId}`);
}

const defaultReasons: Record<string, string> = {
  stop: "Stopped",
  escalate: "Escalated",
  regenerate: "Regenerate",
  start: "Started",
};

/** A decision from the decision row: "toState|kind", with the note as the reason when given. */
export async function transitionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const workflowRunId = text(formData, "workflowRunId");
  const projectId = text(formData, "projectId");
  const requestId = text(formData, "requestId");
  const [to, kind] = text(formData, "decision").split("|");
  const parsed = workflowStateSchema.safeParse(to);
  if (!parsed.success) return { error: "Unknown decision" };
  const note = text(formData, "reason");
  if (kind === "reject" && !note) return { error: "A note is required to reject" };
  try {
    await api.transitionWorkflowRun(workflowRunId, {
      toState: parsed.data,
      reason: note || defaultReasons[kind ?? ""] || undefined,
    });
  } catch (error) {
    return { error: messageOf(error) };
  }
  revalidatePath(`/app/projects/${projectId}/requests/${requestId}`);
  revalidatePath(`/app/projects/${projectId}/requests`);
  revalidatePath("/app");
  return { ok: true };
}

/** The public origin of this web app, for links that leave it (invite links). */
async function webOrigin() {
  if (process.env.WEB_ORIGIN) return process.env.WEB_ORIGIN.replace(/\/$/, "");
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function inviteMemberAction(_prev: InviteActionState, formData: FormData): Promise<InviteActionState> {
  const organizationId = text(formData, "organizationId");
  const email = text(formData, "email").toLowerCase();
  const role = organizationRoleSchema.safeParse(text(formData, "role"));
  if (!email || !role.success) return { error: "Email and role are required" };
  try {
    const result = await api.invite(organizationId, { email, role: role.data });
    revalidatePath(`/app/organizations/${organizationId}/members`);
    return { ok: true, email, inviteUrl: `${await webOrigin()}/invitations/${result.token}` };
  } catch (error) {
    return { error: messageOf(error) };
  }
}

export async function updateMemberRoleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const organizationId = text(formData, "organizationId");
  const userId = text(formData, "userId");
  const role = organizationRoleSchema.safeParse(text(formData, "role"));
  if (!role.success) return { error: "Unknown role" };
  try {
    await api.updateMemberRole(organizationId, userId, role.data);
  } catch (error) {
    return { error: messageOf(error) };
  }
  revalidatePath(`/app/organizations/${organizationId}/members`);
  return { ok: true };
}

export async function removeMemberAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const organizationId = text(formData, "organizationId");
  const userId = text(formData, "userId");
  let left = false;
  try {
    const me = await api.me();
    left = me?.user.id === userId;
    await api.removeMember(organizationId, userId);
  } catch (error) {
    return { error: messageOf(error) };
  }
  if (left) {
    revalidatePath("/app");
    redirect("/app");
  }
  revalidatePath(`/app/organizations/${organizationId}/members`);
  return { ok: true };
}

export async function revokeInvitationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const organizationId = text(formData, "organizationId");
  const invitationId = text(formData, "invitationId");
  try {
    await api.revokeInvitation(organizationId, invitationId);
  } catch (error) {
    return { error: messageOf(error) };
  }
  revalidatePath(`/app/organizations/${organizationId}/members`);
  return { ok: true };
}

export async function createArtifactAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const workflowRunId = text(formData, "workflowRunId");
  const projectId = text(formData, "projectId");
  const requestId = text(formData, "requestId");
  const title = text(formData, "title");
  const type = artifactTypeSchema.safeParse(text(formData, "type"));
  if (!title || !type.success) return { error: "Type and title are required" };

  try {
    if (text(formData, "mode") === "file") {
      const file = formData.get("file");
      if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload" };
      await api.uploadArtifact(workflowRunId, {
        type: type.data,
        title,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        bytes: await file.arrayBuffer(),
      });
    } else {
      let content: unknown;
      try {
        content = JSON.parse(text(formData, "content") || "{}");
      } catch {
        return { error: "Content must be valid JSON" };
      }
      await api.createArtifact(workflowRunId, { type: type.data, title, content });
    }
  } catch (error) {
    return { error: messageOf(error) };
  }

  revalidatePath(`/app/projects/${projectId}/requests/${requestId}`);
  revalidatePath(`/app/projects/${projectId}/documents`);
  return { ok: true };
}

export async function registerRunnerAction(_prev: RunnerActionState, formData: FormData): Promise<RunnerActionState> {
  const organizationId = text(formData, "organizationId");
  const name = text(formData, "name");
  const version = text(formData, "version");
  if (!name || !version) return { error: "Name and version are required" };
  const type = text(formData, "type") === "managed" ? "managed" : "self_hosted";
  const capabilities = text(formData, "capabilities")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  try {
    const result = await api.registerRunner(organizationId, { name, type, version, capabilities });
    revalidatePath(`/app/organizations/${organizationId}/machines`);
    return { ok: true, runnerToken: result.runnerToken, runnerName: result.runner.name };
  } catch (error) {
    return { error: messageOf(error) };
  }
}
