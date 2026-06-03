# Architecture - System Overview

Version: 0.1.0
Status: Draft
Owner: Architecture
Last Updated: 2026-06-02

---

# Purpose

This document provides a high-level architectural overview of the Sydeso platform.

It defines:

- System goals
- Core architectural principles
- Major platform components
- Component responsibilities
- System boundaries
- Deployment model
- Future architecture direction

This document serves as the primary entry point for understanding the Sydeso architecture.

---

# Executive Summary

Sydeso is a multi-tenant, AI-native software delivery platform that transforms multiple intake sources into Stories, then orchestrates those Stories through structured workflows, specialized AI agents, persistent project memory, and managed execution environments.

The platform enables teams to transform Requests, Feedback, and user-defined Stories into validated software outcomes through a governed workflow consisting of:

Work Intake
→ Story
→ Research
→ PRD
→ Design
→ Development
→ QA
→ Approval
→ Release

Sydeso acts as a coordination layer between:

- Humans
- AI Agents
- Project Memory
- Governing Documentation
- Source Code Repositories
- Execution Runners
- Testing Systems
- Deployment Infrastructure

---

# Architectural Principles

## Workflow First

Workflows are the primary system abstraction.

Only Stories may enter the Workflow Engine.

Requests and Feedback are intake mechanisms.

Stories are execution mechanisms.

Workflows operate exclusively on Stories.

The Workflow Engine never receives Requests or Feedback directly.

Examples:

- Feature development
- Bug resolution
- Research
- Documentation
- Releases

Workflows define:

- States
- Transitions
- Approvals
- Automation triggers

---

## Artifact Driven

Artifacts are first-class entities.

Artifacts represent outputs produced during execution.

Examples:

- Research Reports
- PRDs
- Technical Designs
- Source Code
- Test Reports
- Release Packages

Every artifact:

- Has an owner
- Has a version
- Has a history
- Is traceable

---

## Event Driven

The platform operates through events.

Examples:

- Story Created
- Workflow Transitioned
- Artifact Generated
- Agent Started
- Agent Completed
- Approval Granted

Events drive:

- Automation
- Notifications
- Agent execution
- State transitions

---

## Human Governed

Humans remain responsible for:

- Priorities
- Approvals
- Governance
- Organizational policies

Agents assist with execution.

---

## Memory Native

Project memory is a foundational system.

All activities contribute to organizational knowledge.

Knowledge accumulates over time.

---

## Guardrail Native

Company and project wikis, policies, standards, design locks, runbooks, and architecture decisions are active workflow context.

They should be retrievable by agents, visible to reviewers, and usable by validation checks.

Guardrails do not replace artifacts.

Guardrails define how artifacts should be created, edited, approved, tested, and released.

---

# High-Level Architecture

┌───────────────────────────────────────┐
│ User Interface Layer                  │
└───────────────────────────────────────┘
↓
┌───────────────────────────────────────┐
│ Work Intake Layer                     │
└───────────────────────────────────────┘
↓
┌───────────────────────────────────────┐
│ Workflow Engine                       │
└───────────────────────────────────────┘
↓
┌───────────────────────────────────────┐
│ Agent Orchestration Layer             │
└───────────────────────────────────────┘
↓
┌─────────────┬─────────────┬─────────────┐
│ Memory      │ Agents      │ Runners     │
└─────────────┴─────────────┴─────────────┘
↓
┌───────────────────────────────────────┐
│ Governing Context Layer               │
└───────────────────────────────────────┘
↓
┌───────────────────────────────────────┐
│ External Integrations │
└───────────────────────────────────────┘

---

# Core Platform Components

## User Interface Layer

Provides all user-facing experiences.

Responsibilities:

- Project management
- Request management
- Feedback management
- Story management
- Workflow management
- Artifact review
- Agent monitoring
- Runner management
- Settings management

Primary Interfaces:

- Web Application
- Progressive Web App
- Future Desktop Application

---

## Work Intake Layer

The subsystem responsible for work origination before execution.

Structure:

```text
Work Intake Layer
├── Requests
├── Feedback
└── Stories
```

Responsibilities:

- Accept natural language Requests
- Accept user-defined Stories
- Accept product Feedback
- Triage and classify intake
- Convert accepted Requests and Feedback into Stories
- Preserve links between intake sources and generated Stories

Approved MVP backlog input mechanisms:

- Natural Language Request
- User Defined Story
- Product Feedback

Natural Language Request flow:

```text
Request
↓
PM Agent Analysis
↓
Story Draft
↓
Approval
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

Product Feedback flow:

```text
Feedback
↓
Triage
↓
Accepted
↓
Story
↓
Backlog
```

Only the generated Story enters backlog and workflow execution.

The original Feedback remains a Work Intake record and is never passed directly to the Workflow Engine.

Future intake sources must follow:

```text
Intake Source
↓
Story
↓
Workflow
```

The Workflow Engine remains unaware of intake source types.

---

## Workflow Engine

The core system responsible for lifecycle management.

Stories are the only entities permitted to enter the Workflow Engine.

Responsibilities:

- State management
- Transition validation
- Approval enforcement
- Automation triggers
- Workflow execution

Examples:

Story
↓
Design Approved
↓
Trigger Architect Agent

---

## Agent Orchestration Layer

Coordinates all agent execution.

Responsibilities:

- Agent scheduling
- Agent routing
- Agent communication
- Agent lifecycle management
- Context injection

The orchestration layer determines:

- Which agent executes
- When it executes
- What context it receives
- Where it executes

---

## Memory System

Stores organizational knowledge.

Responsibilities:

- Context retrieval
- Artifact storage
- Knowledge graph maintenance
- Semantic search
- Historical tracking

Subsystems:

- Vector Store
- Knowledge Graph
- Document Store
- Artifact Repository

---

## Governing Context Layer

Provides active organizational and project guardrails.

Responsibilities:

- Store organization and project wiki pages
- Store standards, policies, runbooks, and architecture decisions
- Store project design locks
- Version governing documents
- Retrieve relevant guardrails for agents and reviewers
- Validate artifact drafts and workflow transitions against required guardrails

Examples:

- Engineering standards
- Security policy
- Accessibility policy
- Design lock
- Definition of Done
- Release policy
- Feature flag policy

The Governing Context Layer feeds the Memory System, Agent Orchestration Layer, Workflow Engine, and QA checks.

---

## Runner System

Provides execution environments.

Responsibilities:

- Agent execution
- Code generation
- Testing
- Build execution
- Deployment preparation

Runner Types:

### Managed Runner

Hosted by Sydeso.

Provisioned automatically.

### Self-Hosted Runner

Provisioned and managed by customers.

Runs inside:

- VPS
- Cloud VM
- On-premise infrastructure

---

# Agent System

Agents are specialized execution units.

Each agent has:

- Role
- Context
- Inputs
- Outputs
- Permissions

---

## Research Agent

Responsibilities:

- Research
- Discovery
- Analysis

Outputs:

- Research Reports

---

## Product Manager Agent

Responsibilities:

- Requirement generation
- Request analysis
- Story creation
- Backlog refinement

Outputs:

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

Outputs:

- Classification
- Story Draft
- Suggested Priority

---

## Feedback Agent

Responsibilities:

- Feedback analysis
- Duplicate detection
- Priority scoring
- Story creation recommendations

Outputs:

- Feedback Analysis
- Story Recommendation
- Priority Recommendation

---

## Architect Agent

Responsibilities:

- System design
- Technical planning

Outputs:

- Technical Designs
- Architecture Documents

---

## Developer Agent

Responsibilities:

- Implementation
- Refactoring
- Bug fixes

Outputs:

- Source Code

---

## QA Agent

Responsibilities:

- Validation
- Testing
- Requirement verification

Outputs:

- Test Reports
- Defect Reports

---

## Release Agent

Responsibilities:

- Release preparation
- Deployment workflows

Outputs:

- Release Artifacts

---

# Project Memory Architecture

The memory system consists of multiple layers.

---

## Document Memory

Stores:

- PRDs
- Research
- Technical Designs
- Notes

---

## Artifact Memory

Stores:

- Generated outputs
- Historical revisions
- Build artifacts

---

## Semantic Memory

Stores:

- Embeddings
- Vectorized content
- Similarity relationships

Supports:

- Retrieval
- Context augmentation
- Search

---

## Graph Memory

Stores:

- Relationships
- Dependencies
- Traceability links

Examples:

Story
→ PRD

PRD
→ Design

Design
→ Code

Code
→ Tests

Tests
→ Release

---

# Managed Runner Architecture

Managed runners are isolated execution environments.

Each runner contains:

- Workspace
- Agent Runtime
- Git Integration
- Build Environment

Capabilities:

- Clone repositories
- Execute commands
- Run tests
- Generate artifacts

---

# Multi-Tenant Architecture

The platform is multi-tenant.

---

## Organization

Top-level tenant boundary.

Contains:

- Workspaces
- Users
- Projects
- Billing

---

## Workspace

Operational boundary.

Contains:

- Projects
- Workflows
- Agents
- Memory

---

## Project

Delivery boundary.

Contains:

- Stories
- Requests
- Feedback
- Artifacts
- Executions
- Releases

---

# External Integrations

The platform integrates with external systems.

---

## Source Control

Examples:

- GitHub
- GitLab
- Bitbucket

Capabilities:

- Repository sync
- Pull requests
- Commit generation

---

## LLM Providers

Examples:

- OpenAI
- Anthropic
- Google
- OpenRouter

Capabilities:

- Agent execution
- Prompt processing
- Artifact generation

---

## Communication Platforms

Examples:

- Slack
- Discord
- Email

Capabilities:

- Notifications
- Approvals
- Alerts

---

## Deployment Platforms

Examples:

- Vercel
- Railway
- Fly.io
- AWS

Capabilities:

- Release execution
- Deployment monitoring

---

# Primary User Workflow

User submits Request, Feedback, or Story
↓
Work Intake Layer
↓
Request or Feedback converted to Story
↓
Workflow created
↓
Research Agent executes
↓
PM Agent generates PRD
↓
Human approval
↓
Architect Agent executes
↓
Human approval
↓
Developer Agent executes
↓
QA Agent validates
↓
Pass?
├── No → Return to Development
└── Yes → Approval
↓
Release
↓
Done

---

# QA Feedback Loop

The platform supports iterative validation.

Development
↓
QA
↓
Pass?

Yes
↓
Approval

No
↓
Development

Maximum Retry Count:

Default: 3

After threshold:

Escalation Required

---

# Security Model

Core principles:

- Tenant isolation
- Role-based access control
- Audit logging
- Artifact traceability
- Secure runner isolation

All actions must be attributable.

Every action produces an audit record.

---

# Scalability Strategy

The architecture should support:

- Thousands of organizations
- Millions of artifacts
- Concurrent agent execution
- Distributed runners
- Distributed memory retrieval

The platform should scale horizontally.

---

# Open Core Boundary

Potential future open-source components:

- Workflow Engine
- Agent Protocol
- Runner SDK
- Agent SDK
- Workflow Templates

Commercial components:

- Cloud Platform
- Managed Runners
- Billing
- Organization Management
- Hosted Memory Services
- Marketplace

---

# Future Architecture Direction

Future platform capabilities may include:

- Multi-agent collaboration
- Agent marketplaces
- Custom agent creation
- Custom workflow creation
- Enterprise governance
- Compliance automation
- Cross-project memory
- Autonomous project execution
- GitHub Issue intake
- Jira Ticket intake
- Slack Message intake
- Discord Message intake
- Email intake
- API Request intake
- Voice Request intake
- Customer Portal Submission intake

---

# Summary

Sydeso is an AI-native software delivery operating system.

Requests and Feedback are intake mechanisms.

Stories are execution mechanisms.

Workflows operate exclusively on Stories.

The Workflow Engine never receives Requests or Feedback directly.

The platform combines:

- Work Intake
- Workflow Management
- Agent Orchestration
- Project Memory
- Managed Execution
- Quality Assurance
- Release Automation

into a unified system capable of transforming ideas into verified software through structured, observable, and governed workflows.
