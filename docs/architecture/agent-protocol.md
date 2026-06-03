# Architecture - Agent Protocol

Version: 0.1.0
Status: Draft
Owner: Architecture
Last Updated: 2026-06-02

---

# Purpose

This document defines the Agent Protocol used by Sydeso.

The Agent Protocol standardizes how agents:

- Receive work
- Receive context
- Communicate
- Generate artifacts
- Request approvals
- Trigger workflows
- Report results
- Escalate failures

The protocol provides a consistent contract between:

- Workflow Engine
- Agent Orchestrator
- Agents
- Memory System
- Runners

Only Stories may enter the Workflow Engine.

Requests and Feedback are intake mechanisms.

Stories are execution mechanisms.

Workflows operate exclusively on Stories.

The Workflow Engine never receives Requests or Feedback directly.

---

# Goals

The Agent Protocol must:

- Be model agnostic
- Be provider agnostic
- Be deterministic
- Be observable
- Be auditable
- Support multi-agent collaboration
- Support future marketplace agents
- Support custom user-defined agents

---

# Design Principles

## Agents Are Workers

Agents execute work.

Agents do not own workflows.

The Workflow Engine owns workflows.

---

## Agents Are Stateless

Agents should be treated as stateless execution units.

Persistent knowledge belongs in the Memory System.

Never rely on agent memory.

---

## Context Is Explicit

Agents must receive all required context.

Agents should never infer unavailable information.

Explicit context may include:

- Source Story
- Prior Artifacts
- Project Memory
- Company Wiki pages
- Project Wiki pages
- Governing Policies
- Design Locks
- Architecture Decisions
- Release Rules

---

## Outputs Are Artifacts

All meaningful outputs must become artifacts.

Agents do not generate hidden work.

Agents may generate or edit drafts, but approved artifact versions remain immutable.

Human-created drafts and agent-created drafts should use the same validation and approval protocol.

---

## Communication Is Structured

Agent-to-agent communication occurs through protocol messages.

No direct coupling should exist between agents.

---

# Agent Lifecycle

Agent Assigned
↓
Context Retrieved
↓
Governing Context Retrieved
↓
Execution Planned
↓
Execution Started
↓
Artifact Produced
↓
Validation
↓
Completed
OR
Failed
OR
Escalated

---

# Agent Architecture

Workflow Engine
↓
Agent Orchestrator
↓
Agent Protocol
↓
Agent Runtime
↓
Runner
↓
Outputs

---

# Agent Types

---

## Research Agent

Responsibilities:

- Discovery
- Analysis
- Investigation
- Competitive Research

Produces:

- Research Reports

---

## Product Manager Agent

Responsibilities:

- Request analysis
- Requirement Generation
- Story Creation
- PRD Generation
- Backlog Refinement

Produces:

- PRDs
- Stories
- Acceptance Criteria

---

## Triage Agent

Responsibilities:

- Request analysis
- Classification
- Story suggestion
- Priority recommendation

Triggered by:

- Request Submission

Produces:

- Classification
- Story Draft
- Suggested Priority

The Triage Agent operates in the Work Intake layer and does not create workflow runs directly.

---

## Feedback Agent

Responsibilities:

- Feedback analysis
- Duplicate detection
- Priority scoring
- Story creation recommendations

Triggered by:

- Feedback Submission

Produces:

- Analysis
- Story Recommendation
- Priority Recommendation

The Feedback Agent operates in the Work Intake layer and does not create workflow runs directly.

---

## Architect Agent

Responsibilities:

- System Design
- Architecture Planning
- Technical Specifications

Produces:

- Technical Designs

---

## Developer Agent

Responsibilities:

- Code Generation
- Bug Fixing
- Refactoring

Produces:

- Source Code
- Pull Requests

---

## QA Agent

Responsibilities:

- Validation
- Testing
- Requirement Verification

Produces:

- Test Reports
- Defect Reports

---

## Release Agent

Responsibilities:

- Release Validation
- Deployment Preparation

Produces:

- Release Artifacts

---

# Agent Identity

Every agent must have a unique identity.

---

## Agent Schema

```json
{
  "id": "agent_xxx",
  "name": "Developer Agent",
  "type": "developer",
  "version": "1.0.0",
  "status": "active"
}
```

---

# Agent Run

An Agent Run represents a single execution.

---

## Agent Run Schema

```json
{
  "id": "run_xxx",
  "agentId": "agent_xxx",
  "workflowId": "workflow_xxx",
  "storyId": "story_xxx",
  "status": "pending"
}
```

---

# Governing Context in Agent Inputs

Agent runs must identify which governing documents were included in context assembly.

Examples:

- Engineering standards for Developer Agent runs
- Design lock and accessibility policy for UI implementation
- QA checklist for QA Agent runs
- Release policy and feature flag policy for Release Agent runs

The output artifact or validation report should reference the governing context used during execution.

This makes it possible to audit whether an agent followed the correct company and project guardrails.

---

# Human Draft Compatibility

The Agent Protocol must support workflows where a human creates or edits the draft and an agent performs validation or summarization.

Example:

```text
Human edits PRD Draft
→ PM Agent summarizes changes
→ Policy validation runs
→ Approval requested
→ PRD Version N+1 created
```

Agents are not the only way to change artifacts.

Agents are workers and reviewers inside the workflow.

---

# Agent Message Protocol

All agent communication occurs through structured messages.

---

## Message Types

| Type | Purpose |
|----------|----------|
| TaskAssignment | Assign work |
| ContextRequest | Request additional context |
| ContextResponse | Provide context |
| ArtifactCreated | Publish output |
| ApprovalRequested | Request approval |
| EscalationRequested | Request intervention |
| StatusUpdate | Report progress |
| ExecutionCompleted | Signal completion |
| ExecutionFailed | Signal failure |

---

# Base Message Schema

```json
{
  "id": "msg_xxx",
  "type": "TaskAssignment",
  "sender": "orchestrator",
  "recipient": "developer-agent",
  "timestamp": "2026-06-01T00:00:00Z",
  "payload": {}
}
```

---

# Task Assignment Protocol

The orchestrator assigns work through TaskAssignment messages.

---

## Task Assignment Example

```json
{
  "type": "TaskAssignment",
  "payload": {
    "storyId": "story_123",
    "taskId": "task_456",
    "objective": "Implement Kanban Board",
    "acceptanceCriteria": [
      "Board displays workflow states",
      "Cards are draggable"
    ]
  }
}
```

---

# Context Protocol

Agents should never operate with incomplete context.

---

## Context Sources

- Request Analysis
- Feedback Analysis
- Story
- PRD
- Technical Design
- Project Memory
- Previous Artifacts
- Workflow History

---

## Context Retrieval Flow

Agent Assigned
↓
Context Request
↓
Memory Retrieval
↓
Context Package Created
↓
Agent Execution

---

# Context Package Schema

```json
{
  "story": {},
  "requirements": {},
  "design": {},
  "memory": {},
  "artifacts": []
}
```

---

# Artifact Protocol

Artifacts are the primary outputs of agents.

---

## Artifact Creation Message

```json
{
  "type": "ArtifactCreated",
  "payload": {
    "artifactId": "artifact_xxx",
    "artifactType": "TechnicalDesign"
  }
}
```

---

# Artifact Types

| Type | Producer |
|----------|----------|
| ResearchReport | Research Agent |
| PRD | PM Agent |
| RequestAnalysis | Triage Agent |
| FeedbackAnalysis | Feedback Agent |
| StoryRecommendation | Feedback Agent |
| TechnicalDesign | Architect Agent |
| SourceCode | Developer Agent |
| TestReport | QA Agent |
| ReleasePackage | Release Agent |

---

# State-Aware Agents

Agents must understand workflow state.

Agents cannot operate outside approved states.

Intake agents operate before workflow execution.

Delivery agents operate only on Stories inside workflow states.

---

## Example

Story State:

Design

Allowed Agent:

Architect Agent

Blocked Agents:

- Developer Agent
- Release Agent

Invalid Workflow Input:

- Request
- Feedback
- GitHub Issue

These inputs must be converted to Stories before the Workflow Engine assigns delivery agents.

---

# Approval Protocol

Some outputs require approval before workflow progression.

---

## Approval Flow

Artifact Created
↓
Approval Requested
↓
Human Review
↓
Approved OR Rejected

---

## Approval Request Schema

```json
{
  "type": "ApprovalRequested",
  "payload": {
    "artifactId": "artifact_xxx",
    "approvalType": "DesignApproval"
  }
}
```

---

# QA Feedback Protocol

QA is responsible for validating outputs.

---

## QA Validation Flow

Implementation Complete
↓
QA Review
↓
Pass?

Yes
↓
Approval

No
↓
Defect Report
↓
Developer Agent

---

## QA Result Schema

```json
{
  "status": "failed",
  "defects": [
    {
      "severity": "high",
      "description": "Acceptance criteria not met"
    }
  ]
}
```

---

# Retry Protocol

Agents may retry failed work.

---

## Default Retry Policy

| Setting | Default |
|----------|----------|
| Max Retries | 3 |
| Retry Delay | 30s |
| Escalation After Failure | Yes |

---

## Retry Flow

Failure
↓
Retry
↓
Failure
↓
Retry
↓
Failure
↓
Escalation

---

# Escalation Protocol

Escalations transfer responsibility to a human.

---

## Escalation Conditions

- Retry limit exceeded
- Missing requirements
- Conflicting requirements
- Approval deadlock
- Runner failure
- Agent failure

---

## Escalation Message

```json
{
  "type": "EscalationRequested",
  "payload": {
    "reason": "Retry limit exceeded"
  }
}
```

---

# Multi-Agent Collaboration

Agents may collaborate through artifacts.

Direct agent-to-agent execution is prohibited.

---

## Example

Research Agent
↓
Research Report

PM Agent
↓
Consumes Research Report

PRD

Architect Agent
↓
Consumes PRD

Technical Design

Developer Agent
↓
Consumes Design

Code

QA Agent
↓
Consumes Code

Test Report

---

# Work Intake Agent Collaboration

Request and Feedback processing occurs before workflow execution.

Natural Language Request flow:

```text
Request
↓
Triage Agent or PM Agent Analysis
↓
Story Draft
↓
Approval
↓
Backlog
```

Product Feedback flow:

```text
Feedback
↓
Feedback Agent Analysis
↓
Triage
↓
Accepted
↓
Story
↓
Backlog
```

User Defined Story flow:

```text
Story
↓
Backlog
```

or

```text
Story
↓
PM Review
↓
Backlog
```

---

# Agent Skills

Skills provide specialized capabilities.

---

## Examples

- Angular Expert
- React Expert
- PostgreSQL Expert
- Security Reviewer
- UX Specialist

---

## Skill Schema

```json
{
  "id": "skill_xxx",
  "name": "Angular Expert",
  "version": "1.0.0"
}
```

---

# Agent Configuration

Agents must be configurable.

---

## Configurable Settings

| Setting | Description |
|----------|----------|
| Model Provider | OpenAI, Anthropic, etc |
| Model | Specific model |
| Temperature | Creativity level |
| Max Tokens | Output limit |
| Retry Count | Retry threshold |
| Timeout | Execution timeout |
| Skills | Attached skills |
| System Prompt | Base behavior |

---

# Agent Permissions

Agents operate under explicit permissions.

---

## Examples

Developer Agent

Allowed:

- Read PRDs
- Read Designs
- Generate Code

Denied:

- Release Software

---

## Example Matrix

| Agent | Read | Write | Approve | Deploy |
|----------|----------|----------|----------|----------|
| Research | Yes | Research | No | No |
| PM | Yes | PRD | No | No |
| Triage | Requests | Request Analysis | No | No |
| Feedback | Feedback | Feedback Analysis | No | No |
| Architect | Yes | Design | No | No |
| Developer | Yes | Code | No | No |
| QA | Yes | Tests | No | No |
| Release | Yes | Release | No | Yes |

---

# Runner Protocol

Agents execute on runners.

---

## Runner Assignment Flow

Agent Run Created
↓
Runner Selected
↓
Runner Assigned
↓
Execution Started

---

## Runner Requirements

Every runner must provide:

- File System
- Network Access
- Git Access
- Logging
- Process Execution

---

# Memory Protocol

Agents interact with memory through the Memory API.

---

## Operations

| Operation | Description |
|----------|----------|
| Search | Retrieve context |
| Retrieve | Fetch document |
| Store | Save artifact |
| Link | Create relationship |
| Embed | Create embedding |

---

# Observability Protocol

Every execution must be observable.

---

## Required Telemetry

- Start Time
- End Time
- Duration
- Cost
- Token Usage
- Model Used
- Status
- Produced Artifacts

---

# Audit Protocol

Every agent action must be auditable.

Required:

- Actor
- Agent
- Inputs
- Outputs
- Timestamp
- Runner

---

# Future Protocol Extensions

Future versions may support:

- Agent Marketplace
- External Agents
- Custom Agent SDK
- Agent-to-Agent Negotiation
- Autonomous Planning
- Multi-Agent Swarms
- Agent Voting
- Agent Consensus

---

# MVP Agent Chain

The MVP workflow should support:

Request or Feedback
↓
Work Intake Agent
↓
Story
↓
Research Agent
↓
PM Agent
↓
Human Approval
↓
Architect Agent
↓
Human Approval
↓
Developer Agent
↓
QA Agent
↓
Pass?

No
↓
Developer Agent

Yes
↓
Human Approval
↓
Release Agent
↓
Done

---

# Agent Protocol Summary

The Agent Protocol provides a standardized contract between workflows, agents, memory, runners, and humans.

Agents execute work.

Artifacts carry knowledge.

Work Intake agents transform Requests and Feedback into Stories.

Workflows control Story progression.

Humans provide governance.

The protocol ensures every action remains observable, traceable, auditable, and reproducible across the entire software delivery lifecycle.
