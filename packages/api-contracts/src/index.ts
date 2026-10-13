import { z } from "zod";

export const workflowStateSchema = z.enum([
  "backlog",
  "design",
  "design_approval",
  "development",
  "automated_qa",
  "manual_review",
  "ready",
  "released",
  "escalated",
]);

export const organizationRoleSchema = z.enum(["owner", "admin", "product_manager", "engineer", "reviewer", "viewer"]);

const slug = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

const name = z.string().trim().min(1).max(120);
const email = z.string().trim().toLowerCase().email().max(320);
const password = z.string().min(10, "Use at least 10 characters").max(256);

// ---------------------------------------------------------------- auth

export const signUpSchema = z.object({
  email,
  name,
  password,
  /** an invitation token from an invite link; joins that organization instead of creating one */
  invitationToken: z.string().trim().min(1).optional(),
});

export const signInSchema = z.object({ email, password });

// ---------------------------------------------------------------- organizations

export const createOrganizationSchema = z.object({ name, slug: slug.optional() });
export const updateOrganizationSchema = z.object({ name: name.optional(), slug: slug.optional() }).strict();

export const createWorkspaceSchema = z.object({ name, slug: slug.optional() });
export const updateWorkspaceSchema = z.object({ name: name.optional(), slug: slug.optional() }).strict();

export const createProjectSchema = z.object({
  name,
  repositoryUrl: z.string().trim().url().max(2048).optional().or(z.literal("")),
  defaultBranch: z.string().trim().min(1).max(255).optional(),
  maxRemediationIterations: z.number().int().min(0).max(20).optional(),
});
export const updateProjectSchema = z
  .object({
    name: name.optional(),
    repositoryUrl: z.string().trim().url().max(2048).nullable().optional().or(z.literal("")),
    defaultBranch: z.string().trim().min(1).max(255).optional(),
    maxRemediationIterations: z.number().int().min(0).max(20).optional(),
  })
  .strict();

// ---------------------------------------------------------------- members

export const inviteMemberSchema = z.object({ email, role: organizationRoleSchema });
export const updateMemberRoleSchema = z.object({ role: organizationRoleSchema });

// ---------------------------------------------------------------- features and workflow

export const createFeatureSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(20_000),
});

export const transitionWorkflowRunSchema = z.object({
  toState: workflowStateSchema,
  reason: z.string().trim().max(2000).optional(),
});

// ---------------------------------------------------------------- runners

export const registerRunnerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(["self_hosted", "managed"]).optional(),
  version: z.string().trim().min(1).max(64),
  capabilities: z.array(z.string().trim().min(1).max(64)).max(64),
});

export const runnerHeartbeatSchema = z.object({
  status: z.enum(["online", "offline", "busy", "disabled"]),
  version: z.string(),
  capabilities: z.array(z.string()),
  healthMetrics: z.record(z.unknown()).optional(),
});

// ---------------------------------------------------------------- waitlist

export const waitlistSignupSchema = z.object({
  email: z.string().trim().email().max(320),
  name: z.string().trim().max(120).optional().or(z.literal("")),
  role: z.string().trim().max(80).optional().or(z.literal("")),
  useCase: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;
export type TransitionWorkflowRunInput = z.infer<typeof transitionWorkflowRunSchema>;
export type RegisterRunnerInput = z.infer<typeof registerRunnerSchema>;
export type WaitlistSignupInput = z.infer<typeof waitlistSignupSchema>;
