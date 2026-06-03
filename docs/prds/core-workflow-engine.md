# PRDs - PRD: Core Workflow Engine

Version: 0.1.0
Status: Draft
Owner: Product
Last Updated: 2026-06-02

---

# Executive Summary

The Workflow Engine is the core execution lifecycle system of Sydeso.

Every Story, artifact, approval, agent execution, and release moves through the Workflow Engine.

Only Stories may enter the Workflow Engine.

Requests and Feedback are intake mechanisms.

Stories are execution mechanisms.

Workflows operate exclusively on Stories.

The Workflow Engine never receives Requests or Feedback directly.

The Workflow Engine is responsible for:

- State management
- Lifecycle orchestration
- Transition validation
- Approval enforcement
- Automation triggers
- Escalation handling
- Audit generation

Without the Workflow Engine, Sydeso becomes a collection of disconnected AI agents.

The Workflow Engine provides structure, governance, traceability, and repeatability.

---

# Problem Statement

Current AI development tools focus on generation.

They do not focus on delivery.

Users can generate:

- Code
- Designs
- Documentation

but they cannot reliably manage:

- Lifecycle progression
- Quality gates
- Approval workflows
- Agent coordination
- Traceability

As a result:

- Work becomes fragmented
- Context is lost
- Quality becomes inconsistent
- Human oversight is difficult

Sydeso solves this through workflow-driven software delivery.

---

# Goals

## Primary Goals

- Create a deterministic delivery lifecycle
- Enable structured AI execution
- Enforce quality gates
- Provide workflow observability
- Support human approvals
- Support automation triggers

---

## Secondary Goals

- Support future custom workflows
- Support workflow templates
- Support workflow analytics
- Support workflow marketplace

---

# Non-Goals

The MVP will not support:

- Visual workflow builder
- Conditional branching workflows
- Parallel workflow execution
- Custom workflow definitions
- Workflow versioning

These are future capabilities.

---

# Core Concept

Only Stories move through workflows.

Examples:

Request
↓
Story

Feedback
↓
Story

Story
↓
Workflow

Release
↓
Workflow

The workflow becomes the source of truth for progress.

The Work Intake System is responsible for converting Requests, Feedback, GitHub Issues, and future intake sources into Stories before workflow creation.

Workflow state should remain the source of truth for concept-to-production execution.

Project management views are projections of workflow state, not independent sources of delivery truth.

---

# Default Workflow

The MVP supports a single workflow.

---

## Lifecycle

Backlog
↓
Research
↓
PRD
↓
Design
↓
Development
↓
QA
↓
Approval
↓
Done

---

## Concept-to-Production Addendum

The full Sydeso lifecycle should support concept-to-production delivery while allowing workflow templates to skip irrelevant stages.

Reference lifecycle:

```text
Concept
→ Research
→ PRD
→ Technical Design
→ UI/UX Wireframe
→ UI/UX Prototype
→ Prototype Approval
→ Development
→ Testing and QA Deployment
→ Canary / Feature Flag Pre-release
→ Release Approval
→ Live Deployment
→ Post-release Learning
```

The MVP default workflow may remain smaller, but the engine should be designed so later workflow templates can include prototype, canary, feature-flag, and release gates.

---

## Governing Context Addendum

Workflow transitions may require governing context.

Examples:

- Research may require project wiki and prior artifacts.
- PRD approval may require product principles and stakeholder constraints.
- Design approval may require design lock and accessibility standard.
- Development may require coding standards and architecture decisions.
- QA may require acceptance criteria, QA checklist, and design compliance rules.
- Release may require release policy, feature flag policy, rollback plan, and approval record.

The Workflow Engine should record which governing documents were used during validation.

---

## State Definitions

### Backlog

Purpose:

Execution-ready Stories awaiting workflow progression.

Entry:

- Story creation
- Request conversion to Story
- Feedback conversion to Story

Exit:

- User initiates execution

---

### Research

Purpose:

Discovery and analysis.

Outputs:

- Research Report

Exit Criteria:

- Research complete

---

### PRD

Purpose:

Requirement generation.

Outputs:

- PRD

Exit Criteria:

- PRD approved

---

### Design

Purpose:

Technical planning.

Outputs:

- Technical Design

Exit Criteria:

- Design approved

---

### Development

Purpose:

Implementation.

Outputs:

- Source Code
- Pull Requests

Exit Criteria:

- Implementation complete

---

### QA

Purpose:

Validation.

Outputs:

- Test Report

Exit Criteria:

- Tests pass

---

### Approval

Purpose:

Human review.

Outputs:

- Approval Decision

Exit Criteria:

- Approved

---

### Done

Purpose:

Workflow completed.

Outputs:

- Completed delivery package

---

# User Stories

---

## Story 1

As a user

I want to move work through lifecycle stages

so that I can track progress.

---

## Story 2

As a product manager

I want approvals enforced

so that quality gates exist.

---

## Story 3

As an engineer

I want workflow transitions audited

so that decisions are traceable.

---

## Story 4

As a founder

I want AI agents triggered automatically

so that work progresses without manual coordination.

---

## Story 5

As a designer

I want prototype approval enforced before development

so that UI/UX work is reviewed before implementation begins.

---

## Story 6

As a release owner

I want canary and feature-flag gates

so that production releases can be validated safely before full rollout.

---

# Functional Requirements

---

## WF-001

Create Workflow

Description:

System shall create a workflow for every story.

System shall not create workflows for Requests, Feedback, GitHub Issues, or any other intake source directly.

Priority:

Critical

---

## WF-002

Assign Initial State

Description:

All workflows begin in Backlog.

Priority:

Critical

---

## WF-003

Move Between States

Description:

Users may move work between valid states.

Only Story workflows may be moved between states.

Priority:

Critical

---

## WF-004

Validate Transitions

Description:

System must validate transition rules before progression.

Priority:

Critical

---

## WF-005

Trigger Automation

Description:

State transitions may trigger automation.

Priority:

Critical

Example:

Design
↓
Architect Agent

---

## WF-006

Generate Workflow Events

Description:

Every transition must create events.

Priority:

Critical

---

## WF-007

Approval Enforcement

Description:

Required approvals must block progression.

Priority:

Critical

---

## WF-008

Escalation Handling

Description:

Workflow failures must generate escalation requests.

Priority:

High

---

## WF-009

Workflow History

Description:

Users must view historical transitions.

Priority:

High

---

## WF-010

Workflow Metrics

Description:

System should calculate workflow performance metrics.

Priority:

Medium

---

# Transition Rules

---

## Backlog → Research

Allowed:

Yes

Requirements:

None

---

## Research → PRD

Allowed:

Yes

Requirements:

Research completed

---

## PRD → Design

Allowed:

Yes

Requirements:

PRD approved

---

## Design → Development

Allowed:

Yes

Requirements:

Design approved

---

## Development → QA

Allowed:

Yes

Requirements:

Implementation completed

---

## QA → Approval

Allowed:

Yes

Requirements:

QA passed

---

## Approval → Done

Allowed:

Yes

Requirements:

Approval granted

---

# Invalid Transitions

Examples:

Backlog
→ Development

Denied

---

Design
→ Done

Denied

---

QA
→ Design

Denied

---

# Workflow Events

The engine must publish events.

---

## Required Events

- WorkflowCreated
- WorkflowStarted
- WorkflowStateEntered
- WorkflowStateExited
- WorkflowTransitioned
- WorkflowCompleted
- WorkflowFailed
- WorkflowEscalated

---

# Automation Triggers

The workflow engine must support trigger execution.

---

## Research State

Trigger:

Research Agent

---

## PRD State

Trigger:

PM Agent

---

## Design State

Trigger:

Architect Agent

---

## Development State

Trigger:

Developer Agent

---

## QA State

Trigger:

QA Agent

---

## Approval State

Trigger:

Approval Request

---

# QA Feedback Loop

The workflow engine must support iterative validation.

---

## Flow

Development
↓
QA
↓
Pass?

No
↓
Development

Yes
↓
Approval

---

## Retry Configuration

Default:

3

Configurable:

Yes

Scope:

Project

---

## Retry Tracking

System must track:

- Retry count
- Failure reasons
- Escalation threshold

---

# Escalation Rules

Escalation occurs when:

- Retry limit exceeded
- Agent failure
- Missing approval
- Runner failure
- Workflow timeout

---

## Escalation Output

System creates:

- Escalation event
- Notification
- Audit record

---

# Workflow History

Users must be able to view:

- State transitions
- Approvals
- Failures
- Escalations
- Timestamps

---

# Activity Timeline

Each workflow should produce a chronological activity feed.

Examples:

10:01 AM

Workflow Created

10:05 AM

PRD Generated

10:08 AM

PRD Approved

10:15 AM

Design Generated

---

# User Interface

---

# Kanban Board

Primary workflow interface.

---

## Columns

- Backlog
- Research
- PRD
- Design
- Development
- QA
- Approval
- Done

---

## Card Contents

- Title
- Priority
- Assignee
- State
- Updated At

---

## Card Actions

- Open Story
- Move State
- View Artifacts
- View Activity

---

# Story Workflow Panel

Displays:

- Current State
- Previous State
- Next State
- Approvals
- Retry Count

---

# Workflow Timeline

Displays:

- Events
- Approvals
- Agent Runs
- Artifacts

Chronological order.

---

# Permissions

---

## Allowed Roles

Move Workflow:

- Product Manager
- Engineer
- Organization Admin
- Organization Owner

---

## Approve Workflow

- Product Manager
- Reviewer
- Organization Admin
- Organization Owner

---

# Audit Requirements

Every transition must record:

- Actor
- Previous State
- New State
- Timestamp
- Reason

---

# Metrics

The workflow engine should calculate:

---

## Lead Time

Request
→ Story
→ Done

---

## Cycle Time

Development
→ Done

---

## Approval Time

Approval Requested
→ Approval Completed

---

## Retry Count

Total QA retries

---

## Escalation Count

Total escalations

---

# API Requirements

---

## Create Workflow

POST

/workflows

---

## Get Workflow

GET

/workflows/:id

---

## Transition Workflow

POST

/workflows/:id/transition

---

## Approve Workflow

POST

/workflows/:id/approve

---

## Reject Workflow

POST

/workflows/:id/reject

---

## Workflow Timeline

GET

/workflows/:id/events

---

# Data Model

Workflow

```json
{
  "id": "workflow_xxx",
  "storyId": "story_xxx",
  "currentState": "Design",
  "status": "active",
  "retryCount": 1,
  "createdAt": "",
  "updatedAt": ""
}
```

---

# Acceptance Criteria

## AC-001

Creating a story automatically creates a workflow.

Creating a Request or Feedback item does not create a workflow until it is converted into a Story.

---

## AC-002

Workflows begin in Backlog.

---

## AC-003

Invalid transitions are blocked.

---

## AC-004

Valid transitions generate events.

---

## AC-005

Required approvals block progression.

---

## AC-006

QA failures return work to Development.

---

## AC-007

Retry limits generate escalations.

---

## AC-008

Workflow history is preserved.

---

## AC-009

Users can visualize workflows on a Kanban board.

---

## AC-010

All transitions are auditable.

---

# Dependencies

Required:

- Authentication
- Organizations
- Projects
- Work Intake System
- Stories
- Event Bus
- Approval System
- Agent Orchestrator

---

# Risks

## Risk

Workflow complexity grows rapidly.

Mitigation:

Single workflow in MVP.

---

## Risk

Too much automation reduces trust.

Mitigation:

Human approvals remain mandatory.

---

## Risk

State transitions become inconsistent.

Mitigation:

Centralized workflow engine.

---

# Success Metrics

- Workflow completion rate
- Average cycle time
- Average lead time
- Approval turnaround time
- QA pass rate
- Retry frequency
- Escalation frequency

---

# Definition of Done

The Workflow Engine is complete when:

- Stories automatically receive workflows
- Requests and Feedback cannot enter workflows directly
- Workflows support lifecycle progression
- State transitions are validated
- Approvals are enforced
- Events are generated
- Agent triggers execute correctly
- QA feedback loops function
- Escalations are generated
- History is preserved
- Users can manage workflows visually

The Workflow Engine is the foundational system upon which every other Sydeso capability depends.
