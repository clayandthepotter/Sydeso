import type { OrganizationRole, WorkflowState } from "@sydeso/domain";
import { redirect } from "next/navigation";

import { getSessionToken } from "./session";
import type {
  Artifact,
  ArtifactDetail,
  ArtifactWithFeature,
  AuditLog,
  AuthResult,
  Feature,
  FeatureDetail,
  FeatureWithLatestRun,
  Invitation,
  InvitationPreview,
  Me,
  Member,
  Organization,
  OrganizationWithRole,
  Project,
  ProjectWithFeatures,
  Runner,
  WorkflowRun,
  WorkflowTransition,
  Workspace,
} from "./types";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiBaseUrl() {
  return (process.env.SYDESO_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");
}

interface RequestOptions extends RequestInit {
  /** Skip the session cookie, for sign-in and sign-up. */
  anonymous?: boolean;
  /** Return null on 401 instead of redirecting to sign-in. */
  allowUnauthorized?: boolean;
}

async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const { anonymous, allowUnauthorized, ...rest } = init;
  const token = anonymous ? undefined : await getSessionToken();

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...rest,
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(rest.headers ?? {}),
    },
  });

  if (response.status === 401 && !anonymous) {
    if (allowUnauthorized) return null as T;
    redirect("/sign-in");
  }

  if (!response.ok) {
    let message = response.statusText;
    let details: unknown;
    try {
      const body = (await response.json()) as { message?: string | string[]; details?: unknown };
      if (body.message) {
        message = Array.isArray(body.message) ? body.message.join(", ") : body.message;
      }
      details = body.details;
    } catch {
      // body was not JSON; keep the status text
    }
    throw new ApiError(response.status, message, details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

const json = (body: unknown, method = "POST") => ({ method, body: JSON.stringify(body) });

export const api = {
  // ---------------------------------------------------------------- auth
  signUp: (input: { email: string; name: string; password: string; invitationToken?: string }) =>
    request<AuthResult>("/auth/sign-up", { ...json(input), anonymous: true }),
  signIn: (input: { email: string; password: string }) =>
    request<AuthResult>("/auth/sign-in", { ...json(input), anonymous: true }),
  signOut: () => request<void>("/auth/sign-out", { method: "POST", allowUnauthorized: true }),
  /** The signed-in user and their memberships, or null when there is no valid session. */
  me: () => request<Me | null>("/auth/me", { allowUnauthorized: true }),

  // ---------------------------------------------------------------- organizations
  listOrganizations: () => request<OrganizationWithRole[]>("/organizations"),
  getOrganization: (organizationId: string) => request<OrganizationWithRole>(`/organizations/${organizationId}`),
  createOrganization: (input: { name: string; slug?: string }) => request<Organization>("/organizations", json(input)),
  updateOrganization: (organizationId: string, input: { name?: string; slug?: string }) =>
    request<Organization>(`/organizations/${organizationId}`, json(input, "PATCH")),
  deleteOrganization: (organizationId: string) => request<void>(`/organizations/${organizationId}`, { method: "DELETE" }),

  listWorkspaces: (organizationId: string) => request<Workspace[]>(`/organizations/${organizationId}/workspaces`),
  createWorkspace: (organizationId: string, input: { name: string; slug?: string }) =>
    request<Workspace>(`/organizations/${organizationId}/workspaces`, json(input)),
  updateWorkspace: (workspaceId: string, input: { name?: string; slug?: string }) =>
    request<Workspace>(`/workspaces/${workspaceId}`, json(input, "PATCH")),
  deleteWorkspace: (workspaceId: string) => request<void>(`/workspaces/${workspaceId}`, { method: "DELETE" }),

  listProjects: (workspaceId: string) => request<Project[]>(`/workspaces/${workspaceId}/projects`),
  createProject: (workspaceId: string, input: { name: string; repositoryUrl?: string; defaultBranch?: string }) =>
    request<Project>(`/workspaces/${workspaceId}/projects`, json(input)),
  getProject: (projectId: string) => request<ProjectWithFeatures>(`/projects/${projectId}`),
  updateProject: (
    projectId: string,
    input: { name?: string; repositoryUrl?: string | null; defaultBranch?: string; maxRemediationIterations?: number },
  ) => request<Project>(`/projects/${projectId}`, json(input, "PATCH")),
  archiveProject: (projectId: string) => request<Project>(`/projects/${projectId}/archive`, { method: "POST" }),
  unarchiveProject: (projectId: string) => request<Project>(`/projects/${projectId}/unarchive`, { method: "POST" }),
  deleteProject: (projectId: string) => request<void>(`/projects/${projectId}`, { method: "DELETE" }),

  // ---------------------------------------------------------------- members
  listMembers: (organizationId: string) =>
    request<{ members: Member[]; assignableRoles: OrganizationRole[] }>(`/organizations/${organizationId}/members`),
  updateMemberRole: (organizationId: string, userId: string, role: OrganizationRole) =>
    request<Member>(`/organizations/${organizationId}/members/${userId}`, json({ role }, "PATCH")),
  removeMember: (organizationId: string, userId: string) =>
    request<void>(`/organizations/${organizationId}/members/${userId}`, { method: "DELETE" }),
  listInvitations: (organizationId: string) => request<Invitation[]>(`/organizations/${organizationId}/invitations`),
  invite: (organizationId: string, input: { email: string; role: OrganizationRole }) =>
    request<{ invitation: Invitation; token: string }>(`/organizations/${organizationId}/invitations`, json(input)),
  revokeInvitation: (organizationId: string, invitationId: string) =>
    request<void>(`/organizations/${organizationId}/invitations/${invitationId}`, { method: "DELETE" }),
  previewInvitation: (token: string) =>
    request<InvitationPreview>(`/invitations/${encodeURIComponent(token)}`, { anonymous: true }),
  acceptInvitation: (token: string) =>
    request<{ organizationId: string; role: OrganizationRole }>(`/invitations/${encodeURIComponent(token)}/accept`, {
      method: "POST",
    }),

  // ---------------------------------------------------------------- features and runs
  listFeatures: (projectId: string) => request<FeatureWithLatestRun[]>(`/projects/${projectId}/features`),
  createFeature: (projectId: string, input: { title: string; description: string }) =>
    request<{ feature: Feature; workflowRun: WorkflowRun; artifact: Artifact; transition: WorkflowTransition }>(
      `/projects/${projectId}/features`,
      json(input),
    ),
  getFeature: (featureId: string) => request<FeatureDetail>(`/features/${featureId}`),
  transitionWorkflowRun: (workflowRunId: string, input: { toState: WorkflowState; reason?: string }) =>
    request<WorkflowRun>(`/workflow-runs/${workflowRunId}/transitions`, json(input)),

  listProjectArtifacts: (projectId: string) => request<ArtifactWithFeature[]>(`/projects/${projectId}/artifacts`),
  getArtifact: (artifactId: string) => request<ArtifactDetail>(`/artifacts/${artifactId}`),

  // ---------------------------------------------------------------- runners and audit
  listRunners: (organizationId: string) => request<Runner[]>(`/organizations/${organizationId}/runners`),
  registerRunner: (
    organizationId: string,
    input: { name: string; type?: "self_hosted" | "managed"; version: string; capabilities: string[] },
  ) => request<{ runner: Omit<Runner, "jobs">; runnerToken: string }>(`/organizations/${organizationId}/runners`, json(input)),

  listAuditLogs: (organizationId: string) => request<AuditLog[]>(`/organizations/${organizationId}/audit`),
};
