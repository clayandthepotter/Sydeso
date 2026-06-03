# Architecture - Event Model

Version: 0.1.0
Status: Draft
Owner: Architecture
Last Updated: 2026-06-02

---

# Purpose

This document defines the Sydeso event architecture.

The event model serves as the foundation for:

- Workflow execution
- Agent orchestration
- Audit logging
- Activity streams
- Notifications
- Analytics
- State transitions
- Automation triggers

Sydeso is an event-driven platform.

Every meaningful action produces one or more immutable events.

---

# Event Philosophy

## Events Represent Facts

An event represents something that happened.

Events are:

- Immutable
- Timestamped
- Auditable
- Historical

Events never change.

Instead of updating events, new events are created.

---

## Example

Bad:

Story.Status = "Development"

Good:

StoryMovedToDevelopment

---

## Event Sourcing Compatibility

The MVP does not require full event sourcing.

However, all domain events should be designed to support eventual migration to an event-sourced architecture.

---

# Event Architecture

User Action
↓
Command
↓
Validation
↓
State Change
↓
Event Creation
↓
Event Bus
↓
Subscribers
↓
Automation

---

# Event Flow Example

Move Story To Design
↓
Command Received
↓
Validation
↓
Story Updated
↓
StoryMovedToDesign Event
↓
Workflow Engine Receives Event
↓
Architect Agent Triggered
↓
AgentRunCreated Event
↓
Agent Execution Begins

---

# Event Structure

All events share a common structure.

---

## Base Event Schema

```json
{
  "id": "evt_xxx",
  "type": "StoryCreated",
  "aggregateId": "story_xxx",
  "aggregateType": "Story",
  "organizationId": "org_xxx",
  "workspaceId": "ws_xxx",
  "projectId": "proj_xxx",
  "actorId": "user_xxx",
  "actorType": "User",
  "timestamp": "2026-06-01T00:00:00Z",
  "version": 1,
  "metadata": {},
  "payload": {}
}
```

---

# Event Categories

Sydeso events are grouped into domains.

---

## Work Intake Events

Events related to Requests, Feedback, triage, and conversion into Stories.

Only Stories may enter the Workflow Engine.

Requests and Feedback are intake mechanisms.

Stories are execution mechanisms.

Workflows operate exclusively on Stories.

The Workflow Engine never receives Requests or Feedback directly.

---

## Work Events

Events related to planning and delivery.

---

## Workflow Events

Events related to lifecycle transitions.

---

## Artifact Events

Events related to generated outputs.

---

## Artifact Draft Events

Events related to mutable drafts and human or agent edits before approval.

---

## Agent Events

Events related to agent execution.

---

## Memory Events

Events related to project memory.

---

## Governing Context Events

Events related to wiki pages, policies, design locks, and standards that provide active workflow guardrails.

---

## Runner Events

Events related to execution environments.

---

## Release Events

Events related to deployments and releases.

---

## User Events

Events related to users and permissions.

---

## Organization Events

Events related to tenant management.

---

# Work Events

---

## RequestSubmitted

Generated when a natural language Request is submitted.

---

## RequestAnalyzed

Generated when a Request has been classified and analyzed.

---

## RequestExpanded

Generated when a Request has been expanded into structured requirements or a Story draft.

---

## RequestConvertedToStory

Generated when a Request produces an approved Story.

---

## FeedbackSubmitted

Generated when product Feedback is submitted.

---

## FeedbackTriaged

Generated when Feedback is reviewed and classified.

---

## FeedbackAccepted

Generated when Feedback is accepted for conversion into a Story.

---

## FeedbackRejected

Generated when Feedback is rejected.

---

## FeedbackConvertedToStory

Generated when accepted Feedback produces a Story.

---

## FeedbackSyncedToGithub

Generated when Feedback is synchronized to a GitHub Issue.

---

## GithubIssueImported

Generated when a GitHub Issue is imported as a Feedback item or future intake source.

---

## IdeaCreated

Generated when a new idea is submitted.

### Payload

```json
{
  "ideaId": "idea_xxx",
  "title": "Feature Idea"
}
```

---

## StoryCreated

Generated when a story is created.

### Payload

```json
{
  "storyId": "story_xxx",
  "title": "Implement Workflow Engine"
}
```

---

## StoryUpdated

Generated when a story is modified.

---

## StoryDeleted

Generated when a story is removed.

---

## TaskCreated

Generated when a task is created.

---

## TaskCompleted

Generated when a task is completed.

---

## EpicCreated

Generated when an epic is created.

---

## InitiativeCreated

Generated when an initiative is created.

---

# Workflow Events

Workflow events are among the most important events in Sydeso.

They drive automation.

---

## WorkflowGuardrailValidated

Generated when required governing context has been checked for a transition.

### Payload

```json
{
  "workflowId": "workflow_xxx",
  "transitionId": "transition_xxx",
  "requiredContext": ["policy_xxx", "design_lock_xxx"],
  "result": "passed"
}
```

---

## WorkflowGuardrailFailed

Generated when a transition cannot proceed because required governing context is missing or validation failed.

---

## WorkflowCreated

Generated when a workflow is created for a Story.

The Workflow Engine must not create workflows for Requests, Feedback, GitHub Issues, or any other intake source directly.

---

## WorkflowStarted

Generated when execution begins.

---

## WorkflowCompleted

Generated when execution completes.

---

## WorkflowFailed

Generated when execution fails.

---

## WorkflowEscalated

Generated when human intervention is required.

---

## WorkflowStateEntered

Generated when entering a state.

### Example

```json
{
  "state": "Design"
}
```

---

## WorkflowStateExited

Generated when leaving a state.

---

## WorkflowTransitioned

Generated when moving between states.

### Payload

```json
{
  "fromState": "Design",
  "toState": "Development"
}
```

---

# Default Workflow Events

The default lifecycle generates the following state events.

---

## EnteredResearch

---

## EnteredPRD

---

## EnteredDesign

---

## EnteredDevelopment

---

## EnteredQA

---

## EnteredApproval

---

## EnteredRelease

---

## EnteredDone

---

# Approval Events

---

## ApprovalRequested

Generated when approval is required.

---

## ApprovalGranted

Generated when approval is approved.

---

## ApprovalRejected

Generated when approval is denied.

---

## ApprovalExpired

Generated when approval times out.

---

# Artifact Events

Artifacts are first-class entities.

All artifact changes generate events.

---

## ArtifactCreated

Generated when an artifact is created.

### Payload

```json
{
  "artifactId": "artifact_xxx",
  "artifactType": "PRD"
}
```

---

## ArtifactUpdated

Generated when an artifact changes.

---

## ArtifactVersionCreated

Generated when a new version is published.

---

## ArtifactApproved

Generated when approval occurs.

---

## ArtifactRejected

Generated when approval fails.

---

## ArtifactArchived

Generated when archived.

---

# Artifact Draft Events

---

## ArtifactDraftCreated

Generated when a mutable draft is created from an artifact version.

---

## ArtifactDraftUpdated

Generated when a human or agent edits an artifact draft.

---

## ArtifactDraftSubmitted

Generated when a draft is submitted for approval.

---

## ArtifactDraftApproved

Generated when an artifact draft is approved for promotion to a new artifact version.

---

## ArtifactDraftRejected

Generated when an artifact draft is rejected.

---

# Governing Context Events

---

## WikiPageCreated

Generated when a wiki page is created.

---

## WikiPageUpdated

Generated when a wiki page draft is edited.

---

## WikiPageVersionApproved

Generated when a wiki page version becomes approved context.

---

## PolicyDefinitionCreated

Generated when a governing policy is created.

---

## PolicyDefinitionUpdated

Generated when a governing policy draft is edited.

---

## PolicyAttachedToWorkflow

Generated when a policy is required by a workflow template, state, or transition.

---

## DesignLockCreated

Generated when a project design lock is created.

---

## DesignLockApproved

Generated when a design lock version is approved.

---

# Research Artifact Events

---

## ResearchGenerated

---

## ResearchApproved

---

# PRD Events

---

## PRDCreated

---

## PRDApproved

---

## PRDRejected

---

# Design Events

---

## DesignGenerated

---

## DesignApproved

---

## DesignRejected

---

# Code Events

---

## CodeGenerated

---

## PullRequestCreated

---

## PullRequestMerged

---

# Test Events

---

## TestPlanGenerated

---

## TestExecutionCompleted

---

## TestPassed

---

## TestFailed

---

## DefectCreated

---

## DefectResolved

---

# Agent Events

Agent events drive orchestration.

---

## AgentCreated

Generated when an agent is registered.

---

## AgentUpdated

Generated when configuration changes.

---

## AgentDisabled

Generated when disabled.

---

# Agent Run Events

---

## AgentRunCreated

Generated when execution is scheduled.

---

## AgentRunQueued

Generated when waiting for execution.

---

## AgentRunStarted

Generated when execution begins.

---

## AgentRunCompleted

Generated when execution succeeds.

---

## AgentRunFailed

Generated when execution fails.

---

## AgentRunCancelled

Generated when execution is cancelled.

---

## AgentRunTimedOut

Generated when execution exceeds limits.

---

## AgentRetryRequested

Generated when retry occurs.

---

## AgentEscalationRequested

Generated when human intervention is required.

---

# Specialized Agent Events

---

## ResearchAgentStarted

---

## ResearchAgentCompleted

---

## PMAgentStarted

---

## PMAgentCompleted

---

## TriageAgentStarted

---

## TriageAgentCompleted

---

## FeedbackAgentStarted

---

## FeedbackAgentCompleted

Generated when a Feedback Agent completes feedback analysis.

---

## ArchitectAgentStarted

---

## ArchitectAgentCompleted

---

## DeveloperAgentStarted

---

## DeveloperAgentCompleted

---

## QAAgentStarted

---

## QAAgentCompleted

---

## ReleaseAgentStarted

---

## ReleaseAgentCompleted

---

# QA Feedback Loop Events

These events support iterative validation.

---

## QAReviewStarted

---

## QAReviewCompleted

---

## QARejectedImplementation

Generated when implementation fails QA.

### Payload

```json
{
  "storyId": "story_xxx",
  "reason": "Acceptance criteria not satisfied"
}
```

---

## QAApprovedImplementation

Generated when implementation passes.

---

## RetryLoopEntered

Generated when development is re-entered.

---

## RetryLimitExceeded

Generated when retry threshold is exceeded.

---

## EscalationRequired

Generated when human review becomes mandatory.

---

# Memory Events

---

## MemoryDocumentCreated

---

## MemoryDocumentUpdated

---

## MemoryEmbeddingCreated

---

## MemoryEmbeddingUpdated

---

## KnowledgeNodeCreated

---

## KnowledgeEdgeCreated

---

## ContextRetrieved

Generated when memory retrieval occurs.

---

# Runner Events

---

## RunnerRegistered

Generated when a runner is added.

---

## RunnerHeartbeatReceived

Generated periodically.

---

## RunnerOnline

---

## RunnerOffline

---

## RunnerUnhealthy

---

## RunnerRecovered

---

## RunnerAssigned

Generated when work is assigned.

---

## RunnerReleased

Generated when work completes.

---

# Managed Runner Events

---

## ManagedRunnerProvisionRequested

---

## ManagedRunnerProvisioned

---

## ManagedRunnerDestroyed

---

## ManagedRunnerUpgraded

---

# Release Events

---

## ReleaseCreated

---

## ReleaseApproved

---

## ReleaseRejected

---

## ReleasePublished

---

## ReleaseRolledBack

---

# Deployment Events

---

## DeploymentStarted

---

## DeploymentCompleted

---

## DeploymentFailed

---

## DeploymentRolledBack

---

# User Events

---

## UserInvited

---

## UserJoined

---

## UserRemoved

---

## UserRoleUpdated

---

# Organization Events

---

## OrganizationCreated

---

## WorkspaceCreated

---

## ProjectCreated

---

## ProjectArchived

---

# Notification Events

Notifications should be generated from domain events.

Examples:

ApprovalGranted
↓
NotificationSent

WorkflowFailed
↓
NotificationSent

DeploymentFailed
↓
NotificationSent

---

# Event Consumers

Events may be consumed by multiple systems.

---

## Workflow Engine

Consumes:

- Workflow Events
- Approval Events
- Agent Events

The Workflow Engine consumes Story workflow events only. Work Intake events may create Stories, but Requests and Feedback never enter workflow execution directly.

---

## Agent Orchestrator

Consumes:

- Workflow Events
- Artifact Events
- Retry Events
- Work Intake Events

---

## Notification Service

Consumes:

- Approval Events
- Failure Events
- Release Events

---

## Analytics Service

Consumes:

- All Events

---

## Audit Service

Consumes:

- All Events

---

# Event Bus

The event bus is responsible for:

- Publishing events
- Routing events
- Fan-out delivery
- Retry handling

---

# Delivery Guarantees

Target guarantees:

At Least Once Delivery

Consumers must be idempotent.

Events may be delivered more than once.

Duplicate processing must be safe.

---

# Event Retention

Events should never be deleted.

Minimum retention:

7 years

Future enterprise plans may require longer retention.

---

# Audit Requirements

Every event must include:

- Actor
- Timestamp
- Entity
- Organization
- Workspace
- Project

No state-changing action should occur without producing an event.

---

# MVP Event Scope

Required Events:

- RequestSubmitted
- RequestConvertedToStory
- FeedbackSubmitted
- FeedbackTriaged
- FeedbackConvertedToStory
- StoryCreated
- WorkflowTransitioned
- ApprovalGranted
- ApprovalRejected
- AgentRunStarted
- AgentRunCompleted
- AgentRunFailed
- ArtifactCreated
- ArtifactApproved
- TestPassed
- TestFailed
- ReleaseCreated
- DeploymentStarted
- DeploymentCompleted

These events are sufficient to implement the complete MVP workflow lifecycle.

---

# Event Model Summary

Events are the nervous system of Sydeso.

Commands change state.

State changes create events.

Events drive workflows.

Work Intake events create or recommend Stories.

Workflows trigger agents for Stories only.

Agents create artifacts.

Artifacts generate approvals.

Approvals enable releases.

The entire platform operates through immutable, traceable, and auditable event streams.
