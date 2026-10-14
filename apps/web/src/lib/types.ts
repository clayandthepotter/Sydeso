import type { ActorType, ArtifactType, OrganizationRole, WorkflowState } from "@sydeso/domain";

export type JobStatus = "queued" | "assigned" | "running" | "succeeded" | "failed" | "cancelled";
export type RunnerType = "self_hosted" | "managed";
export type RunnerStatus = "online" | "offline" | "busy" | "disabled";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResult {
  user: SessionUser;
  token: string;
  expiresAt: string;
}

export interface Me {
  user: SessionUser;
  memberships: Array<{
    organizationId: string;
    organization: Pick<Organization, "id" | "name" | "slug" | "plan">;
    role: OrganizationRole;
    createdAt: string;
  }>;
}

export interface Member {
  id: string;
  organizationId: string;
  role: OrganizationRole;
  user: SessionUser;
  createdAt: string;
}

export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: OrganizationRole;
  expiresAt: string;
  createdAt: string;
  invitedBy?: SessionUser;
}

export interface InvitationPreview {
  email: string;
  role: OrganizationRole;
  organization: Pick<Organization, "id" | "name" | "slug">;
  invitedBy: { name: string };
  expiresAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: string;
}

export type OrganizationWithRole = Organization & { role: OrganizationRole };

export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Project {
  id: string;
  organizationId: string;
  workspaceId: string;
  name: string;
  repositoryUrl: string | null;
  defaultBranch: string;
  maxRemediationIterations: number;
  archivedAt: string | null;
  createdAt: string;
}

export interface Feature {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  description: string;
  status: WorkflowState;
  createdAt: string;
}

export interface WorkflowTransition {
  id: string;
  workflowRunId: string;
  fromState: WorkflowState | null;
  toState: WorkflowState;
  triggeredByType: ActorType;
  triggeredById: string | null;
  reason: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface Job {
  id: string;
  workflowRunId: string;
  state: WorkflowState;
  agentType: string;
  requiredCapabilities: string[];
  status: JobStatus;
  runnerId: string | null;
  inputArtifactIds: string[];
  outputArtifactIds: string[];
  attempt: number;
  error: unknown;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface WorkflowRun {
  id: string;
  featureId: string;
  currentState: WorkflowState;
  status: string;
  remediationCount: number;
  startedAt: string;
  completedAt: string | null;
}

export interface Artifact {
  id: string;
  projectId: string;
  featureId: string | null;
  workflowRunId: string | null;
  type: ArtifactType;
  version: number;
  title: string;
  content: unknown;
  storageKey: string | null;
  contentType: string | null;
  sizeBytes: number | null;
  checksum: string;
  sourceArtifactIds: string[];
  producedByJobId: string | null;
  metadata: unknown;
  createdByType: ActorType;
  createdById: string | null;
  createdAt: string;
}

export type ArtifactVersion = Pick<
  Artifact,
  "id" | "version" | "title" | "checksum" | "storageKey" | "sizeBytes" | "createdByType" | "createdById" | "createdAt"
>;

export type ArtifactRef = Pick<Artifact, "id" | "type" | "version" | "title" | "createdAt">;

export interface ArtifactLineage {
  artifact: Artifact;
  sources: ArtifactRef[];
  derived: ArtifactRef[];
  producedByJob: Pick<Job, "id" | "state" | "agentType" | "status" | "runnerId" | "attempt" | "completedAt"> | null;
}

export type FeatureWithLatestRun = Feature & { workflowRuns: WorkflowRun[] };

export type FeatureDetail = Feature & {
  artifacts: Artifact[];
  workflowRuns: Array<WorkflowRun & { transitions: WorkflowTransition[]; jobs: Job[] }>;
};

export type ProjectWithFeatures = Project & { features: Feature[] };

export type ArtifactWithFeature = Artifact & { feature: { id: string; title: string } | null };

export type ArtifactDetail = Artifact & {
  feature: { id: string; title: string; projectId: string } | null;
  workflowRun: { id: string; currentState: WorkflowState; status: string } | null;
};

export interface Runner {
  id: string;
  organizationId: string;
  name: string;
  type: RunnerType;
  status: RunnerStatus;
  version: string;
  capabilities: string[];
  healthMetrics: unknown;
  lastSeenAt: string | null;
  createdAt: string;
  jobs: Array<Pick<Job, "id" | "workflowRunId" | "state" | "agentType" | "status" | "attempt" | "startedAt" | "completedAt" | "createdAt">>;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  actorType: ActorType;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  metadata: unknown;
  createdAt: string;
}
