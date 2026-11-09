import type { WorkflowState } from "@sydeso/domain";

import type { Artifact, FeatureDetail, Job, WorkflowTransition } from "./types";
import { agentLabel, decisionLabel, humanGates, shortId, stateAgents, stateLabels, workingStates } from "./workflow";

export type Run = FeatureDetail["workflowRuns"][number];

export interface ActivityLine {
  at: string;
  text: string;
  tone?: "muted" | "danger";
}

export interface SessionBlock {
  key: string;
  state: WorkflowState;
  /** Who the header names: an agent, "You", or "System". */
  actor: string;
  /** The step verb or the decision, e.g. "Designing", "Approved", "Fix attempt 2 of 3". */
  step: string;
  startedAt: string;
  endedAt: string | null;
  /** The transition that opened the block. */
  entered: WorkflowTransition;
  /** The transition that closed it, when one has. */
  left: WorkflowTransition | null;
  job: Job | null;
  lines: ActivityLine[];
  documents: Artifact[];
  current: boolean;
  kind: "agent" | "gate" | "human" | "end";
}

function errorSummary(error: unknown) {
  if (!error) return "Failed";
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error && typeof (error as { message: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return "Failed";
}

function actorOf(transition: WorkflowTransition) {
  if (transition.triggeredByType === "user") return "You";
  if (transition.triggeredByType === "agent") return "Agent";
  return "System";
}

/**
 * Turn a run's transitions, jobs and documents into session blocks, one per state entered, in
 * order. Jobs are matched to the block whose state they serve and that opened before they were
 * created. Documents are matched by the job that produced them, else by the window of time.
 */
export function buildSession(run: Run, artifacts: Artifact[], maxFixAttempts: number): SessionBlock[] {
  const transitions = [...run.transitions].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const jobs = [...run.jobs].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const usedJobs = new Set<string>();
  const usedDocuments = new Set<string>();
  const blocks: SessionBlock[] = [];
  let fixAttempt = 0;

  transitions.forEach((entered, index) => {
    const left = transitions[index + 1] ?? null;
    const state = entered.toState;
    const current = left === null;
    const nextAt = left?.createdAt ?? null;
    const agentType = stateAgents[state];

    const job = agentType
      ? (jobs.find(
          candidate =>
            !usedJobs.has(candidate.id) &&
            candidate.state === state &&
            candidate.createdAt >= entered.createdAt &&
            (nextAt === null || candidate.createdAt <= nextAt),
        ) ?? null)
      : null;
    if (job) usedJobs.add(job.id);

    const documents = artifacts
      .filter(artifact => {
        if (usedDocuments.has(artifact.id)) return false;
        if (job && artifact.producedByJobId === job.id) return true;
        if (artifact.producedByJobId) return false;
        return artifact.createdAt >= entered.createdAt && (nextAt === null || artifact.createdAt <= nextAt);
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    documents.forEach(document => usedDocuments.add(document.id));

    const lines: ActivityLine[] = [];
    let actor: string;
    let step: string;
    let kind: SessionBlock["kind"];
    let startedAt = entered.createdAt;
    let endedAt: string | null = nextAt;

    if (agentType) {
      kind = "agent";
      actor = agentLabel(agentType);
      const remediation = state === "development" && entered.fromState === "automated_qa";
      if (remediation) fixAttempt += 1;
      step = remediation ? `Fix attempt ${fixAttempt} of ${maxFixAttempts}` : stateLabels[state];
      if (entered.reason && entered.triggeredByType !== "user") lines.push({ at: entered.createdAt, text: entered.reason, tone: "muted" });
      if (job) {
        startedAt = job.startedAt ?? entered.createdAt;
        if (job.status === "queued" || job.status === "assigned") {
          lines.push({ at: job.createdAt, text: job.runnerId ? `Assigned to machine ${shortId(job.runnerId)}` : "Waiting for a machine", tone: "muted" });
        }
        if (job.startedAt) {
          lines.push({ at: job.startedAt, text: job.runnerId ? `Started on machine ${shortId(job.runnerId)}` : "Started" });
        }
        documents.forEach(document => lines.push({ at: document.createdAt, text: `Wrote ${document.title}` }));
        if (job.status === "failed") lines.push({ at: job.completedAt ?? job.createdAt, text: errorSummary(job.error), tone: "danger" });
        if (job.status === "cancelled") lines.push({ at: job.completedAt ?? job.createdAt, text: "Cancelled", tone: "muted" });
        if (job.status === "succeeded") endedAt = job.completedAt ?? nextAt;
        if (job.completedAt && (job.status === "failed" || job.status === "cancelled")) endedAt = job.completedAt;
      } else {
        lines.push({ at: entered.createdAt, text: "No job was queued", tone: "muted" });
        documents.forEach(document => lines.push({ at: document.createdAt, text: `Added ${document.title}` }));
      }
    } else if (humanGates.includes(state)) {
      kind = "gate";
      actor = left ? actorOf(left) : "Waiting for you";
      step = left ? decisionLabel(left.fromState, left.toState) : stateLabels[state];
      documents.forEach(document => lines.push({ at: document.createdAt, text: `Added ${document.title}` }));
    } else if (state === "ready" || state === "released" || state === "escalated") {
      kind = "end";
      actor = actorOf(entered);
      step = state === "escalated" ? (entered.fromState && workingStates.includes(entered.fromState) ? "Stopped" : "Escalated") : stateLabels[state];
      if (entered.reason && entered.reason !== step && entered.reason !== "Stopped" && entered.reason !== "Escalated") {
        lines.push({ at: entered.createdAt, text: entered.reason, tone: "muted" });
      }
      endedAt = entered.createdAt;
    } else {
      kind = "human";
      actor = actorOf(entered);
      step = index === 0 ? "Submitted" : stateLabels[state];
      if (entered.reason && index > 0) lines.push({ at: entered.createdAt, text: entered.reason, tone: "muted" });
      documents.forEach(document => lines.push({ at: document.createdAt, text: `Added ${document.title}` }));
      endedAt = index === 0 ? entered.createdAt : nextAt;
    }

    blocks.push({ key: entered.id, state, actor, step, startedAt, endedAt, entered, left, job, lines: lines.sort((a, b) => a.at.localeCompare(b.at)), documents, current, kind });
  });

  return blocks;
}

/** The transition that put the run in its current state. */
export function currentEntry(run: Run) {
  return [...run.transitions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

/** The cause line for Needs you, in one of the fixed forms. */
export function escalationCause(run: Run) {
  const entry = currentEntry(run);
  if (!entry) return "Stopped";
  const fromWorking = entry.fromState && workingStates.includes(entry.fromState);
  const failed = run.jobs.filter(job => job.status === "failed").sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (entry.triggeredByType === "user") {
    const verb = fromWorking ? "Stopped" : "Escalated";
    return entry.reason && entry.reason !== "Stopped" && entry.reason !== "Escalated" ? `${verb}: ${entry.reason}` : verb;
  }
  if (entry.reason) return entry.reason;
  if (failed) return `The ${agentLabel(failed.agentType)} failed: ${errorSummary(failed.error)}`;
  return "Stopped";
}
