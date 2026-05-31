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

export const createFeatureSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

export const transitionWorkflowRunSchema = z.object({
  currentState: workflowStateSchema,
  toState: workflowStateSchema,
  reason: z.string().optional(),
});

export const runnerHeartbeatSchema = z.object({
  status: z.enum(["online", "offline", "busy", "disabled"]),
  version: z.string(),
  capabilities: z.array(z.string()),
  healthMetrics: z.record(z.unknown()).optional(),
});
