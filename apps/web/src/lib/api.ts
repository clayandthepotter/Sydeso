import type { WorkflowState } from "@sydeso/domain";

import type {
  Artifact,
  ArtifactDetail,
  ArtifactWithFeature,
  AuditLog,
  Feature,
  FeatureDetail,
  FeatureWithLatestRun,
  Organization,
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
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiBaseUrl() {
  return (process.env.SYDESO_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (body.message) {
        message = Array.isArray(body.message) ? body.message.join(", ") : body.message;
      }
    } catch {
      // body was not JSON; keep the status text
    }
    throw new ApiError(response.status, message);
  }

  return (await response.json()) as T;
}

const json = (body: unknown) => ({ method: "POST", body: JSON.stringify(body) });

export const api = {
  listOrganizations: () => request<Organization[]>("/organizations"),
  createOrganization: (input: { name: string; slug: string }) => request<Organization>("/organizations", json(input)),
  listWorkspaces: (organizationId: string) => request<Workspace[]>(`/organizations/${organizationId}/workspaces`),
  createWorkspace: (organizationId: string, input: { name: string; slug: string }) =>
    request<Workspace>(`/organizations/${organizationId}/workspaces`, json(input)),
  listProjects: (workspaceId: string) => request<Project[]>(`/workspaces/${workspaceId}/projects`),
  createProject: (workspaceId: string, input: { name: string; repositoryUrl?: string; defaultBranch?: string }) =>
    request<Project>(`/workspaces/${workspaceId}/projects`, json(input)),
  getProject: (projectId: string) => request<ProjectWithFeatures>(`/projects/${projectId}`),

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

  listRunners: (organizationId: string) => request<Runner[]>(`/organizations/${organizationId}/runners`),
  registerRunner: (
    organizationId: string,
    input: { name: string; type?: "self_hosted" | "managed"; version: string; capabilities: string[] },
  ) => request<{ runner: Omit<Runner, "jobs">; runnerToken: string }>(`/organizations/${organizationId}/runners`, json(input)),

  listAuditLogs: (organizationId: string) => request<AuditLog[]>(`/organizations/${organizationId}/audit`),
};
