"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { workflowStateSchema } from "@sydeso/api-contracts";

import { api, ApiError } from "../../lib/api";

export interface ActionState {
  error?: string;
  ok?: boolean;
}

export interface RunnerActionState extends ActionState {
  runnerToken?: string;
  runnerName?: string;
}

function messageOf(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createOrganizationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = text(formData, "name");
  if (!name) return { error: "Name is required" };
  let organizationId: string;
  try {
    const organization = await api.createOrganization({ name, slug: text(formData, "slug") || slugify(name) });
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
    await api.createWorkspace(organizationId, { name, slug: text(formData, "slug") || slugify(name) });
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
  redirect(`/app/projects/${projectId}/features`);
}

export async function createFeatureAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const projectId = text(formData, "projectId");
  const title = text(formData, "title");
  const description = text(formData, "description");
  if (!title || !description) return { error: "Title and description are required" };
  let featureId: string;
  try {
    const result = await api.createFeature(projectId, { title, description });
    featureId = result.feature.id;
  } catch (error) {
    return { error: messageOf(error) };
  }
  revalidatePath(`/app/projects/${projectId}/features`);
  redirect(`/app/projects/${projectId}/features/${featureId}`);
}

export async function transitionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const workflowRunId = text(formData, "workflowRunId");
  const projectId = text(formData, "projectId");
  const featureId = text(formData, "featureId");
  const parsed = workflowStateSchema.safeParse(text(formData, "toState"));
  if (!parsed.success) return { error: "Unknown target state" };
  try {
    await api.transitionWorkflowRun(workflowRunId, {
      toState: parsed.data,
      reason: text(formData, "reason") || undefined,
    });
  } catch (error) {
    return { error: messageOf(error) };
  }
  revalidatePath(`/app/projects/${projectId}/features/${featureId}`);
  revalidatePath(`/app/projects/${projectId}/features`);
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
    revalidatePath(`/app/organizations/${organizationId}/runners`);
    return { ok: true, runnerToken: result.runnerToken, runnerName: result.runner.name };
  } catch (error) {
    return { error: messageOf(error) };
  }
}
