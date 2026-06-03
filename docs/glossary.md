# Sydeso Glossary

Version: 0.1.0
Status: Draft
Owner: Product
Last Updated: 2026-06-02

---

# Purpose

This glossary defines the official terminology used throughout Sydeso.

All product documentation, workflows, APIs, agents, and user interfaces should use these definitions consistently.

When ambiguity exists, this glossary serves as the source of truth.

---

# A

## Agent

A software entity responsible for performing work within a workflow.

Agents consume inputs, execute tasks, and produce artifacts.

Examples:

- Research Agent
- Product Manager Agent
- Triage Agent
- Feedback Agent
- Architect Agent
- Developer Agent
- QA Agent
- Release Agent

---

## Agent Run

A single execution instance of an agent.

An agent run has:

- Inputs
- Outputs
- Status
- Logs
- Duration
- Cost

---

## Agent Workflow

A sequence of agent executions that work together toward a common outcome.

Example:

Research Agent
→ PM Agent
→ Architect Agent
→ Developer Agent
→ QA Agent

---

## Approval

A human or automated decision authorizing progression to the next workflow state.

Approvals are recorded and auditable.

---

## Artifact

A persistent output produced during a workflow.

Examples:

- Research Report
- PRD
- Technical Design
- Source Code
- Test Report
- Release Package

Artifacts are first-class entities within Sydeso.

---

## Artifact Draft

A mutable proposed change to an existing artifact version.

Drafts allow humans or agents to edit work without mutating approved artifact versions.

Approved drafts create new artifact versions.

---

# B

## Backlog

A prioritized collection of work that has not yet entered active execution.

May contain:

- Ideas
- Initiatives
- Epics
- Stories
- Tasks
- Bugs

---

## Bug

A defect that causes a system to behave differently than expected.

---

## Build

A compiled or packaged version of software produced during development.

---

## Canary Release

A limited release of functionality to a subset of users, organizations, or environments before full production rollout.

Canary releases reduce release risk and support additional QA before general availability.

---

# C

## Company Wiki

An organization-scoped knowledge space for standards, policies, operating principles, runbooks, and shared context.

Company Wiki content can act as governing documentation when attached to workflows, agents, approvals, or QA checks.

---

## Context

Information required to understand a project, task, artifact, or workflow.

Context may include:

- Requirements
- Decisions
- Discussions
- Documentation
- Prior Artifacts
- Governing Documentation

---

## Concept-to-Production

The Sydeso lifecycle model where a software idea progresses through research, requirements, design, implementation, QA, pre-release validation, and live deployment.

---

## Cycle Time

The amount of time required to move work from active execution to completion.

---

# D

## Dependency

A relationship where one item requires another item to be completed first.

---

## Deployment

The act of releasing software into an environment.

Examples:

- Development
- QA
- Staging
- Production

---

## Design

A specification describing how a requirement should be implemented.

---

## Design Lock

A versioned design guide that defines visual, interaction, accessibility, and component rules for a project.

Design Locks guide UI/UX design, implementation, and QA.

---

## Developer Agent

An AI agent responsible for implementation activities.

Responsibilities include:

- Code generation
- Refactoring
- Bug fixes
- Test generation

---

# E

## Epic

A large body of work that contains multiple stories.

Epics are typically delivered across multiple iterations.

---

## Escalation

The process of transferring responsibility from an automated workflow to a human decision maker.

Common causes:

- Repeated failures
- Ambiguous requirements
- Policy violations

---

## Event

A recorded occurrence within the system.

Examples:

- Story Created
- Artifact Generated
- Workflow Transitioned
- Approval Granted

---

# F

## Feedback

User-submitted product feedback, including bug reports, feature requests, and UX feedback.

Feedback is an intake mechanism and must be triaged before it can become execution-ready work.

---

## Feedback Agent

An AI agent responsible for feedback analysis, duplicate detection, priority scoring, and story creation recommendations.

---

## Feedback Item

An individual feedback submission.

---

## Feedback Queue

A collection of unprocessed feedback items awaiting triage.

---

## Feature

A user-facing capability delivered through software.

Examples:

- Kanban Board
- Project Memory
- Agent Configuration

---

## Feature Flag

A mechanism for enabling or disabling functionality without redeploying software.

---

# G

## Goal

A desired outcome or objective.

Goals guide prioritization and planning.

---

## Governing Documentation

Company, workspace, or project documentation that acts as an active guardrail for workflow execution.

Examples include engineering standards, release policies, security policies, design locks, QA checklists, and runbooks.

---

# H

## Human-in-the-Loop

A workflow model where human approval or intervention is required before proceeding.

---

## Human Editing

Direct user modification of an artifact draft, wiki page, policy draft, prototype reference, or code-linked implementation artifact.

Human editing is versioned and routed through approval when required.

---

# I

## Idea

An unrefined concept representing potential future work.

Ideas typically enter the backlog before refinement.

---

## Intake Pipeline

The process that transforms incoming work into Stories.

Examples include Request analysis, Feedback triage, and GitHub Issue import.

---

## Intake Source

The origin of work before it becomes a Story.

Examples include Request, Feedback, GitHub Issue, Jira Ticket, Slack Message, Discord Message, Email, API Request, Voice Request, and Customer Portal Submission.

---

## Initiative

A large strategic body of work composed of multiple epics.

Initiatives are aligned with roadmap objectives.

---

# J

## Job

A unit of executable work assigned to an agent or runner.

---

# K

## Kanban

A workflow visualization model representing work moving through lifecycle states.

Common columns:

- Backlog
- Research
- PRD
- Design
- Development
- QA
- Approval
- Done

---

## Knowledge Graph

A structured representation of relationships between entities.

Examples:

- Projects
- Artifacts
- Agents
- Stories
- Decisions

Used to provide contextual intelligence and memory retrieval.

---

# L

## Lifecycle

A sequence of states through which work progresses.

Example:

Idea
→ Research
→ PRD
→ Design
→ Development
→ QA
→ Approval
→ Release
→ Done

---

## Lead Time

The amount of time required for work to move from request to completion.

---

# M

## Managed Runner

A Sydeso-hosted execution environment used by agents to perform work.

Examples:

- Code generation
- Testing
- Build execution
- Deployment preparation

---

## Memory

Persistent contextual knowledge accumulated by the system.

Memory includes:

- Documents
- Artifacts
- Decisions
- Conversations
- Relationships

---

## Milestone

A significant checkpoint representing progress toward a larger objective.

---

## MVP

Minimum Viable Product.

The smallest version of a product capable of delivering meaningful value.

---

# O

## Objective

A desired business or product outcome.

Objectives are often measured using Key Results.

---

## Organization

A top-level account boundary containing users, projects, settings, billing, and permissions.

---

# P

## Persona

A representation of a user type.

Used to guide product design and prioritization.

---

## Policy Definition

A versioned governing document or rule set that can influence workflow validation, agent execution, approval gates, QA, or release decisions.

Examples include security policies, release policies, engineering standards, accessibility standards, and definitions of done.

---

## Project

A container for work, artifacts, workflows, agents, and memory.

Projects are the primary operational unit within Sydeso.

---

## Project Wiki

A living knowledge space for project-specific context, product principles, architecture notes, runbooks, decisions, and standards.

Project Wikis provide context to humans, agents, workflows, and QA.

---

## Prototype

A design artifact representing the intended UI or UX before implementation.

In the MVP, prototypes may be represented by Figma links, frame snapshots, comments, and approval metadata.

---

## PRD

Product Requirements Document.

Defines:

- Problem
- Goals
- Requirements
- Success Criteria

A PRD explains what should be built and why.

---

## Product Manager Agent

An AI agent responsible for requirement generation and backlog refinement.

---

# Q

## QA

Quality Assurance.

The process of validating that outcomes meet requirements and expectations.

---

## QA Agent

An AI agent responsible for testing and validation activities.

---

# R

## Request

A natural language work request submitted by a Sydeso user.

Requests are intake mechanisms and must be converted into Stories before entering the Workflow Engine.

---

## Release

A version of software approved for deployment.

---

## Release Gate

A workflow checkpoint that must be satisfied before software can move to a pre-release, canary, or live deployment state.

---

## Release Agent

An AI agent responsible for release preparation and deployment workflows.

---

## Research

The process of gathering information required to support decision making.

---

## Research Agent

An AI agent responsible for discovery, investigation, and information synthesis.

---

## Roadmap

A strategic plan describing future initiatives and milestones.

---

## Runner

An execution environment capable of performing agent tasks.

Runners may be:

- Managed by Sydeso
- Self-hosted by customers

---

# S

## Sprint

A fixed period of work execution.

Typically:

- One week
- Two weeks

---

## Sprint Goal

The primary outcome a sprint intends to achieve.

---

## Stakeholder

Any individual or group impacted by project outcomes.

---

## State

The current lifecycle position of a work item.

Examples:

- Backlog
- Design
- Development
- QA
- Done

---

## Story

A user-focused unit of work and the canonical execution object in Sydeso.

Only Stories may enter the Workflow Engine.

Format:

As a [user]

I want [capability]

So that [outcome]

---

## Subtask

A smaller implementation unit within a task.

---

# T

## Task

A specific implementation activity required to complete a story.

---

## Triage

The review and classification process used to determine whether incoming work should be rejected, deferred, or converted into a Story.

---

## Triage Agent

An AI agent responsible for request classification, story suggestion, and priority recommendation.

---

## Technical Design

A document describing how requirements should be implemented.

Technical Designs typically include:

- Architecture
- Data Models
- APIs
- Workflows

---

## Test Case

A specific validation scenario.

---

## Test Plan

A collection of test cases used to validate functionality.

---

## Traceability

The ability to connect artifacts, decisions, workflows, and outcomes.

Traceability enables auditing and governance.

---

# U

## User

A human participant within the platform.

Users may have one or more roles.

---

# V

## Vector Memory

A memory system using embeddings to retrieve semantically relevant information.

Used for:

- Context retrieval
- Knowledge augmentation
- Artifact discovery

---

## Verification

The process of confirming that a solution satisfies requirements.

---

## Validation

The process of confirming that the correct solution was built.

---

## Version

A specific revision of an artifact.

All artifacts in Sydeso are versioned.

---

# W

## Work Intake

Any incoming work item before it becomes a Story.

Work Intake includes Requests, Feedback, and user-defined Stories.

Requests and Feedback are intake mechanisms.

Stories are execution mechanisms.

Workflows operate exclusively on Stories.

The Workflow Engine never receives Requests or Feedback directly.

---

## Workflow

A sequence of states, transitions, and actions used to move work toward completion.

---

## Workflow Engine

The system responsible for:

- State management
- Transition validation
- Automation triggers
- Approval enforcement

---

## Workflow State

A lifecycle stage within a workflow.

Examples:

- Research
- Design
- Development
- QA

---

## Workspace

A collaborative environment within an organization.

Contains:

- Projects
- Users
- Workflows
- Agents
- Settings

---

# Core Lifecycle Terms

| Term | Definition |
|----------|----------|
| Idea | Potential future work |
| Research | Discovery and validation phase |
| PRD | Requirement definition phase |
| Design | Technical planning phase |
| Development | Implementation phase |
| QA | Validation phase |
| Approval | Human review phase |
| Release | Deployment preparation phase |
| Done | Completed state |

---

# Core Planning Terms

| Term | Definition |
|----------|----------|
| Work Intake | Any incoming work item before it becomes a Story |
| Request | Natural language work request |
| Feedback | User-submitted product feedback |
| Triage | Review and classification process |
| Feedback Item | Individual feedback submission |
| Feedback Queue | Collection of unprocessed feedback |
| Intake Source | Origin of work |
| Intake Pipeline | Transformation process into Stories |
| Vision | Long-term destination |
| Roadmap | Strategic plan |
| Initiative | Strategic work stream |
| Epic | Large feature area |
| Story | Canonical execution object |
| Task | Implementation activity |
| Subtask | Granular implementation work |

---

# Core Artifact Terms

| Artifact | Description |
|----------|----------|
| Research Report | Discovery output |
| PRD | Product requirements |
| Technical Design | Architecture and implementation plan |
| Source Code | Implementation artifact |
| Test Report | Validation results |
| Release Package | Deployable output |

---

# Core Agent Terms

| Agent | Responsibility |
|----------|----------|
| Research Agent | Research and discovery |
| Product Manager Agent | Requirements and planning |
| Feedback Agent | Feedback analysis and recommendations |
| Triage Agent | Request classification and prioritization |
| Architect Agent | Technical design |
| Developer Agent | Implementation |
| QA Agent | Validation and testing |
| Release Agent | Deployment and release |

---

# Naming Convention

The following terminology should be preferred throughout the platform:

Use:

- Story
- Work Intake
- Request
- Feedback
- Artifact
- Workflow
- Agent
- Lifecycle
- Initiative
- PRD
- Technical Design

Avoid introducing duplicate terminology that creates ambiguity.

This glossary is the authoritative vocabulary reference for Sydeso.
