# Architecture - Domain Model

Version: 0.1.0
Status: Draft
Owner: Architecture
Last Updated: 2026-06-02

---

# Purpose

This document defines the core business entities that make up the Sydeso platform.

The domain model serves as the foundation for:

- Database design
- API design
- Workflow design
- Event architecture
- Agent interactions
- Permission systems
- Memory systems

All implementation details should derive from this model.

---

# Domain Philosophy

Sydeso is not fundamentally a project management system.

Sydeso is a software delivery system.

The platform revolves around four primary concepts:

1. Work Intake
2. Stories
3. Artifacts
4. Agents
5. Workflows
6. Governing Context

Everything else exists to support those concepts.

---

# Domain Overview

Organization
└── Workspace
    └── Project
        ├── Work Intake
        │   ├── Request
        │   ├── Feedback
        │   └── Story
        ├── Roadmap
        ├── Initiative
        ├── Epic
        ├── Story
        ├── Task
        ├── Artifact
        ├── Workflow
        ├── Agent Run
        ├── Release
        ├── Memory
        ├── Wiki
        ├── Policy
        ├── Design Lock
        └── Feature Flags

---

# Top-Level Entities

## Organization

Represents a customer account.

Organizations are the highest isolation boundary.

---

### Responsibilities

- Billing
- Authentication
- User management
- Workspace management
- Governance

---

### Relationships

Organization
├── Users
├── Workspaces
├── Settings
├── Integrations
└── Billing Account

---

## Workspace

Represents a collaborative environment.

A workspace contains projects and operational resources.

---

### Relationships

Workspace
├── Projects
├── Users
├── Agents
├── Workflows
├── Settings
└── Memory

---

## User

Represents a human actor.

Users interact with workflows, artifacts, and approvals.

---

### User Types

- Founder
- Product Manager
- Engineer
- Designer
- QA
- Administrator

---

### Relationships

User
├── Projects
├── Approvals
├── Comments
├── Artifacts
└── Agent Configurations

---

# Work Domain

The work hierarchy defines how delivery is organized after intake has produced a Story.

Stories are the only entities permitted to enter the Workflow Engine.

Requests and Feedback are intake mechanisms.

Stories are execution mechanisms.

Workflows operate exclusively on Stories.

The Workflow Engine never receives Requests or Feedback directly.

---

# Work Intake Domain

The Work Intake domain centralizes incoming work before execution.

Structure:

```text
Work Intake
├── Request
├── Feedback
└── Story
```

Purpose:

- Centralized intake management
- Unified work origination model
- Future intake channel support
- Workflow Engine simplicity

Core relationships:

```text
Request
↓
Story

Feedback
↓
Story

Story
↓
Workflow
```

---

## Request

Represents a natural language work request submitted by a Sydeso user.

Requests are not executable workflow items.

They must be analyzed, expanded, and converted into Stories before entering the backlog.

---

### Relationships

Request
├── Intake Source
├── Request Analysis
├── Story Drafts
├── Converted Story
└── Audit Events

---

## Feedback

Represents product feedback submitted by end users of the product being built.

Feedback may describe bugs, feature requests, usability issues, or general improvement suggestions.

Feedback must be triaged before it can become a Story.

---

### Relationships

Feedback
├── Feedback Source
├── Feedback Comments
├── Feedback Attachments
├── Feedback Analysis
├── Feedback Story Links
└── Audit Events

---

## FeedbackComment

Represents discussion or clarification attached to a Feedback item.

---

## FeedbackAttachment

Represents supporting files attached to Feedback.

Examples include screenshots, logs, recordings, and documents.

---

## FeedbackAnalysis

Represents triage and analysis output for Feedback.

Includes classification, duplicate detection, priority scoring, and story recommendation.

---

## FeedbackStoryLink

Represents the relationship between Feedback and the Story created from it.

Multiple Feedback items may link to one Story.

One Feedback item may inform multiple Stories when appropriate.

---

## FeedbackSource

Represents where Feedback originated.

MVP sources include direct product feedback submission.

Future sources may include GitHub Issues, Jira tickets, Slack messages, Discord messages, email, API requests, voice requests, and customer portal submissions.

---

## Roadmap

Represents strategic planning.

Contains:

- Initiatives
- Milestones

---

### Relationships

Roadmap
├── Initiatives
└── Milestones

---

## Initiative

Represents a strategic work stream.

Typically spans multiple epics.

---

### Examples

- Workflow Engine
- Agent Orchestration
- Project Memory

---

### Relationships

Initiative
├── Epics
├── Milestones
└── Objectives

---

## Epic

Represents a major feature area.

---

### Examples

- Workflow Lifecycle Management
- Runner Provisioning
- Agent Configuration

---

### Relationships

Epic
├── Stories
└── Artifacts

---

## Story

Represents a user-focused requirement.

Stories are the primary delivery unit and canonical execution object.

Only Stories may enter the Workflow Engine.

---

### Format

As a [persona]

I want [capability]

So that [outcome]

---

### Relationships

Story
├── Source Request
├── Source Feedback
├── Tasks
├── Artifacts
├── Workflow
├── Approvals
└── Comments

---

## Task

Represents implementation work.

---

### Relationships

Task
├── Subtasks
├── Artifacts
├── Agent Runs
└── Workflow State

---

## Subtask

Represents granular implementation work.

---

### Relationships

Subtask
├── Parent Task
└── Agent Runs

---

# Workflow Domain

The workflow domain governs lifecycle execution.

---

## Workflow

Represents a state machine.

Controls how Stories progress.

The Workflow Engine must reject Requests, Feedback, GitHub Issues, and any future intake source that has not been converted into a Story.

---

### Responsibilities

- State transitions
- Automation
- Approvals
- Escalations

---

### Relationships

Workflow
├── States
├── Transitions
├── Rules
├── Approvals
└── Events

---

## Workflow State

Represents a lifecycle stage.

---

### Default States

- Idea
- Research
- PRD
- Design
- Development
- QA
- Approval
- Release
- Done

---

### Relationships

Workflow State
├── Workflow
├── Work Items
└── Transitions

---

## Transition

Represents movement between states.

---

### Example

Design
→ Development

---

### Relationships

Transition
├── Source State
├── Target State
├── Conditions
└── Actions

---

# Artifact Domain

Artifacts are first-class entities.

Artifacts are the primary outputs of the platform.

---

## Artifact

Represents any persistent output.

---

### Examples

- Research Report
- PRD
- Technical Design
- Visual Brand Guide
- Design System Guide
- Source Code
- Test Report
- Release Package

---

### Common Fields

- id
- type
- status
- version
- owner
- creator
- createdAt
- updatedAt

---

## Artifact Draft

Represents a mutable working copy of an artifact version.

Artifact Drafts allow humans or agents to make changes without mutating approved artifact versions.

---

### Relationships

Artifact Draft
├── Source Artifact Version
├── Author
├── Proposed Changes
├── Validation Results
├── Approval
└── Resulting Artifact Version

---

### Lifecycle

```text
Artifact Version N
→ Draft
→ Submit for Approval
→ Approved
→ Artifact Version N+1
```

Rejected drafts remain traceable but do not replace approved versions.

---

### Relationships

Artifact
├── Versions
├── Approvals
├── Comments
├── Workflow
├── Parent Artifact
└── Source Work Item

---

## Artifact Version

Represents a historical revision.

---

### Relationships

Artifact Version
├── Artifact
├── Creator
└── Change Set

---

## Artifact Approval

Represents approval status.

---

### States

- Pending
- Approved
- Rejected

---

# Agent Domain

Agents are autonomous execution entities.

---

## Agent

Represents a specialized AI worker.

---

### Agent Types

- Research Agent
- Product Manager Agent
- Triage Agent
- Feedback Agent
- Architect Agent
- Developer Agent
- QA Agent
- Release Agent

---

### Relationships

Agent
├── Agent Runs
├── Configurations
├── Skills
└── Permissions

---

## Agent Run

Represents a single execution instance.

---

### Statuses

- Pending
- Running
- Completed
- Failed
- Cancelled

---

### Relationships

Agent Run
├── Agent
├── Inputs
├── Outputs
├── Artifacts
├── Runner
└── Events

---

## Agent Skill

Represents reusable capabilities.

---

### Examples

- Angular Expert
- React Expert
- Database Architect
- Security Auditor

---

### Relationships

Skill
├── Agent
├── Configuration
└── Prompt Templates

---

# Runner Domain

Runners provide execution environments.

---

## Runner

Represents an execution environment.

---

### Runner Types

- Managed
- Self Hosted

---

### Relationships

Runner
├── Agent Runs
├── Projects
├── Logs
└── Deployments

---

# Governing Context Domain

The Governing Context domain defines living documentation and policy resources that shape how workflows execute.

Governing Context is distinct from workflow artifacts.

Artifacts are execution records.

Governing Context defines the standards, constraints, and knowledge used to create and validate those records.

---

## Wiki Page

Represents living company, workspace, or project documentation.

Examples:

- Company overview
- Project overview
- Team onboarding
- Architecture overview
- Runbook
- Glossary

---

### Relationships

Wiki Page
├── Organization
├── Workspace
├── Project
├── Versions
├── Author
├── Approvals
└── Linked Artifacts

---

## Policy Definition

Represents a governing rule or standard that can affect workflow behavior.

Examples:

- Engineering standard
- Security policy
- Accessibility policy
- Release policy
- Definition of Done
- QA checklist

---

### Relationships

Policy Definition
├── Scope
├── Versions
├── Required Workflow States
├── Validation Rules
└── Approvals

---

## Design Lock

Represents a structured visual and interaction standard for a project.

Design Locks define UI and UX guardrails for design, implementation, and QA.

---

### Relationships

Design Lock
├── Project
├── Versions
├── Token Rules
├── Component Rules
├── Accessibility Rules
├── Prototype References
└── QA Validation Rules

---

## Architecture Decision Record

Represents a durable architecture decision.

Architecture decisions may be linked to PRDs, technical designs, implementations, incidents, and future stories.

---

## Feature Flag

Represents a controlled release mechanism.

Feature Flags support pre-release validation, beta exposure, canary rollout, kill switches, and staged live deployment.

---

### Relationships

Feature Flag
├── Project
├── Release
├── Environment
├── Audience Rules
├── Rollout State
└── Audit Events

---

## Runner Pool

Represents a collection of runners.

Used for scheduling and scaling.

---

### Relationships

Runner Pool
├── Runners
└── Organizations

---

# Memory Domain

Memory provides persistent organizational knowledge.

---

## Memory

Represents accumulated project knowledge.

---

### Components

- Documents
- Embeddings
- Graph Relationships
- Discussions

---

### Relationships

Memory
├── Documents
├── Embeddings
├── Graph Nodes
└── Graph Edges

---

## Memory Document

Represents stored content.

---

### Examples

- PRDs
- Requests
- Feedback
- Triage Decisions
- Research Reports
- Designs
- Meeting Notes

---

## Memory Embedding

Represents vectorized content.

Used for semantic retrieval.

---

## Knowledge Node

Represents an entity in the graph.

---

### Examples

- Story
- Agent
- Artifact
- User

---

## Knowledge Edge

Represents relationships.

---

### Examples

Story
→ Produces
→ Artifact

Artifact
→ Generated By
→ Agent

---

# Release Domain

Represents delivery outcomes.

---

## Release

Represents a deployable outcome.

---

### Relationships

Release
├── Artifacts
├── Approvals
├── Deployments
└── Version

---

## Deployment

Represents software deployment.

---

### Environments

- Development
- QA
- Staging
- Production

---

### Relationships

Deployment
├── Release
├── Environment
├── Logs
└── Status

---

# Comment Domain

Represents collaboration.

---

## Comment

Represents discussion attached to an entity.

---

### Relationships

Comment
├── User
├── Artifact
├── Story
├── Feedback
└── Workflow

---

# Approval Domain

Represents governance.

---

## Approval

Represents authorization to proceed.

---

### Statuses

- Pending
- Approved
- Rejected

---

### Relationships

Approval
├── User
├── Artifact
├── Workflow State
└── Agent Run

---

# Event Domain

Events describe changes within the system.

---

## Event

Represents a recorded occurrence.

Events are immutable.

---

### Examples

- StoryCreated
- RequestSubmitted
- FeedbackSubmitted
- ArtifactGenerated
- AgentStarted
- AgentCompleted
- ApprovalGranted
- WorkflowTransitioned

---

### Relationships

Event
├── Actor
├── Entity
├── Metadata
└── Timestamp

---

# Core Aggregate Roots

The following entities should be treated as aggregate roots.

- Organization
- Workspace
- Project
- Work Intake
- Workflow
- Artifact
- Agent
- Release

All other entities should belong to one of these aggregates.

---

# Core Relationships

Organization
└── Workspace
    └── Project
        ├── Work Intake
        │   ├── Request
        │   │   └── Story
        │   ├── Feedback
        │   │   └── Story
        │   └── Story
        ├── Roadmap
        │   └── Initiative
        │       └── Epic
        │           └── Story
        │               └── Task
        ├── Workflow
        ├── Artifact
        ├── Agent
        ├── Runner
        ├── Memory
        └── Release

---

# MVP Domain Scope

The MVP should implement:

## Required

- Organization
- Workspace
- Project
- Work Intake
- Request
- Feedback
- FeedbackComment
- FeedbackAttachment
- FeedbackAnalysis
- FeedbackStoryLink
- FeedbackSource
- Story
- Workflow
- Workflow State
- Artifact
- Agent
- Agent Run
- Runner
- Release
- Approval
- Memory

---

## Deferred

- Initiative
- Roadmap
- Milestone
- Knowledge Graph Visualization
- Marketplace
- Enterprise Governance
- Custom Entity Types

---

# Domain Model Summary

The Sydeso domain revolves around four primary concepts:

1. Work Intake
2. Stories
3. Workflows
4. Artifacts
5. Agents

Work Intake transforms incoming work into Stories.

Stories move through workflows.

Workflows produce artifacts.

Agents create artifacts.

Memory preserves artifacts.

Releases deliver artifacts.

The entire system exists to transform ideas into verified software outcomes through structured and observable execution.
