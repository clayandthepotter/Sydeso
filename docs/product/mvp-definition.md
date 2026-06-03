# Product - MVP Definition

Version: 0.1.0
Status: Draft
Owner: Product
Last Updated: 2026-06-02

---

# Purpose

This document defines the Sydeso MVP.

The MVP represents the smallest deliverable version of Sydeso capable of validating market demand and generating revenue.

The MVP is intentionally constrained.

The objective is not to build the complete vision.

The objective is to prove that AI-native software delivery workflows provide meaningful value to real users.

---

# MVP Goal

Enable a user to submit a natural language software request, user-defined Story, or product Feedback and move the resulting Story through a structured AI-driven software delivery workflow that produces:

- Requirements
- Technical Design
- Implementation
- QA Validation

using specialized agents, persistent project memory, and managed execution environments.

Only Stories may enter the Workflow Engine.

Requests and Feedback are intake mechanisms that must be converted into Stories before workflow execution.

---

# Core Value Proposition

Current Process:

Idea
→ Meetings
→ Documentation
→ Development
→ Testing
→ Delivery

Often involving:

- Multiple tools
- Multiple systems
- Multiple handoffs

---

Sydeso Process:

Request
→ Story
→ Workflow
→ Agents
→ Validation
→ Delivery Ready Output

within a single platform.

MVP positioning addendum:

Sydeso should not compete by matching every generic project management feature from Plane, Linear, Jira, or ClickUp.

The MVP should prove that a state-driven platform can move software from concept to verified output with less coordination noise.

The MVP should include project management, wiki, and documentation features only where they directly improve:

- Workflow execution
- Artifact quality
- Agent context
- Approval governance
- QA and release safety

---

# Primary MVP Outcome

A user can submit:

"Create a Kanban board for project management."

and Sydeso will:

1. Generate a PRD
2. Generate a Technical Design
3. Generate Implementation Artifacts
4. Execute Automated QA
5. Produce Validation Results
6. Return Approval Decision

without requiring manual coordination.

---

# MVP Success Criteria

The MVP is successful if users can:

- Create projects
- Submit requests
- Generate requirements
- Generate technical designs
- Generate implementation artifacts
- Execute QA workflows
- Review outputs
- Manage workflow progression

inside a single platform.

Additional success criteria:

- Users can define or reference project guardrails before execution.
- Users can maintain project wiki/context that agents can consume.
- Users can directly edit artifact drafts and submit the edits for approval.
- Approved edits create new artifact versions rather than mutating prior versions.

Only Stories may enter the Workflow Engine.

Requests and Feedback are intake mechanisms.

Stories are execution mechanisms.

Workflows operate exclusively on Stories.

The Workflow Engine never receives Requests or Feedback directly.

---

# MVP Personas

Primary personas:

- Founder
- Product Manager
- Software Engineer

The MVP is optimized exclusively for these personas.

---

# MVP Workflow

The MVP supports a single default workflow.

---

## Workflow States

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

## Workflow Rules

Research completion required before PRD.

PRD approval required before Design.

Design approval required before Development.

Development completion required before QA.

QA approval required before Approval.

Approval required before Done.

---

## UI/UX Workflow Addendum

When a Story includes UI or UX work, the workflow should support additional design and prototype gates.

Recommended expanded lifecycle:

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
```

The MVP may start with Figma links and prototype snapshots rather than an in-product canvas editor.

Designers should be able to perform design work directly in their tools and attach approved snapshots or references to Sydeso artifacts.

---

# MVP Functional Scope

---

# Work Intake System

Included:

- Request submission
- Story creation
- Feedback submission
- Feedback queue
- Manual conversion to story

Not Included:

- Community voting
- Public roadmap
- Multi-channel feedback ingestion
- Automated acceptance
- Feedback reputation systems

Approved backlog input mechanisms:

- Natural Language Request
- User Defined Story
- Product Feedback

Future intake sources must be converted into Stories before workflow execution.

---

# Governing Documentation Scope

Included:

- Organization wiki pages
- Project wiki pages
- Project overview pages
- Engineering standards
- Design standards and design locks
- QA checklists
- Release policies
- Architecture Decision Records

MVP behavior:

- Wiki and governing documents are editable drafts until submitted.
- Approved governing documents become versioned context sources.
- Agents may receive relevant wiki, policy, memory, and artifact context.
- Workflow transitions may require specific governing documents.

Not Included:

- Full enterprise document management
- Public knowledge base publishing
- Cross-tenant documentation sharing
- General-purpose collaboration docs unrelated to software delivery

---

# Human Editing Scope

Humans must be able to directly edit drafts without prompting an agent for every change.

Included:

- PRD draft editing
- Technical design draft editing
- Wiki page editing
- Design lock editing
- QA note editing
- Release note editing
- Marketing/content editing through a constrained CMS integration later
- Code-linked edits through Git branches, worktrees, and pull requests later

All submitted edits must preserve auditability:

```text
Artifact Version N
→ Editable Draft
→ Human or Agent Edits
→ Diff + Validation
→ Approval
→ Artifact Version N+1
```

---

# Epic 1

Project Management Foundation

---

## Features

### Organizations

Users can:

- Create organizations
- Manage organizations
- Configure organization settings

---

### Workspaces

Users can:

- Create workspaces
- Manage workspaces

---

### Projects

Users can:

- Create projects
- Archive projects
- Configure projects

---

### Stories

Users can:

- Create stories
- Update stories
- Delete stories
- Prioritize stories

---

### Kanban Board

Users can:

- View workflow states
- Drag stories between states
- View workflow progress

---

# Epic 2

Natural Language Intake

---

## Features

### Request Submission

Users can submit:

- Ideas
- Features
- Bugs
- Enhancements

using natural language.

---

### Request Processing

System automatically:

- Categorizes request
- Creates story
- Assigns initial state

Workflow creation begins only after a Story exists.

---

### Story Generation

System generates:

- Title
- Description
- Acceptance Criteria

---

# Epic 2A

Feedback Intake

---

## Features

### Feedback Submission

Product end users can submit:

- Bug reports
- Feature requests
- UX feedback

---

### Feedback Queue

Product teams can view unprocessed feedback.

---

### Manual Conversion To Story

Authorized users can convert accepted feedback into Stories.

---

### Triage Board

Displays columns:

- New
- Triaged
- Accepted
- Rejected
- Converted

---

# Epic 3

PRD Generation

---

## Features

### PM Agent

Generates:

- Problem Statement
- Objectives
- Requirements
- Acceptance Criteria
- Success Metrics

---

### PRD Approval

Users can:

- Approve PRD
- Reject PRD
- Request revisions

---

# Epic 4

Technical Design Generation

---

## Features

### Architect Agent

Generates:

- Architecture Overview
- Data Model
- API Design
- Component Design
- Testing Strategy

---

### Design Approval

Users can:

- Approve design
- Reject design
- Request revisions

---

# Epic 5

Implementation Generation

---

## Features

### Developer Agent

Generates:

- Source code
- Pull requests
- Supporting artifacts

---

### Git Integration

Supports:

- GitHub

Initial MVP integration only.

---

### Repository Sync

System can:

- Clone repositories
- Create branches
- Commit changes
- Open pull requests

---

# Epic 6

QA Validation

---

## Features

### QA Agent

Performs:

- Acceptance criteria verification
- Functional validation
- Artifact comparison

---

### Validation Sources

QA Agent validates:

PRD
↓
Design
↓
Implementation

---

### QA Output

Produces:

- Test report
- Pass / Fail decision
- Defect report

---

# Epic 7

QA Feedback Loop

---

## Features

### Automatic Rework

If QA fails:

QA
↓
Developer Agent
↓
QA

---

### Retry Policy

Default:

3 retries

Configurable per project.

---

### Escalation

After retry limit:

Escalation required

Human intervention required.

---

# Epic 8

Project Memory

---

## Features

### Document Memory

Store:

- PRDs
- Designs
- Research
- QA Reports

---

### Vector Search

Enable:

- Semantic retrieval
- Context retrieval

---

### Context Assembly

Agents receive:

- Relevant documents
- Related artifacts
- Historical decisions

---

# Epic 9

Agent Orchestration

---

## Features

### Agent Execution

Support:

- PM Agent
- Architect Agent
- Developer Agent
- QA Agent

---

### Agent Monitoring

Users can view:

- Status
- Duration
- Cost
- Outputs

---

### Agent Logs

Users can inspect:

- Inputs
- Outputs
- Events

---

# Epic 10

Runner Infrastructure

---

## Features

### Managed Runner

System-provided execution environment.

Supports:

- Repository access
- Agent execution
- Testing

---

### Self Hosted Runner

User-provided runner.

Supports:

- VPS
- Dedicated server
- Cloud VM

---

### Runner Registration

Users can:

- Register runners
- Manage runners
- Monitor runners

---

# MVP User Interface

---

# Requests

Displays:

- Request List
- Request Detail
- Request Conversion History

---

# Feedback

Displays:

- Feedback List
- Feedback Detail
- Triage Board

---

# Triage Board

Kanban-style feedback triage board.

Columns:

- New
- Triaged
- Accepted
- Rejected
- Converted

---

# Dashboard

Displays:

- Active projects
- Recent workflows
- Agent activity
- Pending approvals

---

# Project Page

Displays:

- Stories
- Artifacts
- Workflow status
- Releases

---

# Kanban Board

Displays:

Columns:

- Backlog
- Research
- PRD
- Design
- Development
- QA
- Approval
- Done

---

# Story Detail Page

Displays:

- Description
- Acceptance criteria
- Artifacts
- Comments
- Activity timeline

---

# Artifact Viewer

Displays:

- Content
- Version history
- Approval status

---

# Agent Activity Page

Displays:

- Agent runs
- Status
- Cost
- Duration
- Outputs

---

# Runner Page

Displays:

- Runner status
- Health
- Capacity
- Workload

---

# Settings

Displays:

- Organization settings
- Integrations
- Agent settings
- Workflow settings

---

# MVP Integrations

Required:

---

## GitHub

Capabilities:

- Repository sync
- Branch creation
- Pull requests

---

## OpenAI

Primary agent provider.

---

## Anthropic

Secondary provider.

---

## OpenRouter

Optional provider abstraction.

---

# MVP Agent Chain

Request or Feedback Submitted
↓
Work Intake Processing
↓
Story Created
↓
PRD Generated
↓
Approval
↓
Architect Agent
↓
Design Generated
↓
Approval
↓
Developer Agent
↓
Code Generated
↓
QA Agent
↓
Pass?

No
↓
Developer Agent

Yes
↓
Approval
↓
Done

---

# MVP Data Requirements

Required entities:

- Organization
- Workspace
- Project
- Request
- Feedback
- Story
- Workflow
- Workflow State
- Artifact
- Agent
- Agent Run
- Approval
- Runner

---

# MVP Non-Functional Requirements

---

## Performance

Page Load:

< 2 seconds

---

Agent Startup:

< 10 seconds

---

Workflow Transition:

< 1 second

---

## Reliability

Target Uptime:

99.5%

---

## Security

Requirements:

- Authentication
- Authorization
- Audit Logs
- Tenant Isolation

---

# Explicitly Excluded

The following are not MVP requirements.

---

## Custom Workflow Builder

Deferred

---

## Custom Agent Builder

Deferred

---

## Marketplace

Deferred

---

## Multi-Agent Swarms

Deferred

---

## Production Deployments

Deferred

Deployment preparation only.

---

## Enterprise Governance

Deferred

---

## Compliance Frameworks

Deferred

---

## Advanced Analytics

Deferred

---

## Community Voting

Deferred

---

## Public Roadmap

Deferred

---

## Multi-Channel Feedback Ingestion

Deferred

---

## Automated Feedback Acceptance

Deferred

---

## Feedback Reputation Systems

Deferred

---

# Pricing Assumptions

Tier 1

$19/month

Includes:

- BYO API Keys
- No managed runner included

---

Tier 2

$59/month

Includes:

- BYO API Keys
- 1 managed runner

---

Tier 3

$299/month

Includes:

- BYO API Keys
- 1 managed runner
- Advanced agent configuration
- Custom skills
- Custom agent profiles

---

# MVP Validation Questions

The MVP exists to answer the following questions:

1. Will users trust AI-managed software workflows?

2. Will users pay for workflow orchestration?

3. Will users adopt structured AI delivery lifecycles?

4. Is project memory valuable enough to become a differentiator?

5. Are managed runners a compelling premium feature?

---

# Definition of MVP Success

The MVP is considered successful when users can:

- Submit a request
- Submit feedback
- Convert approved intake into a Story
- Generate a PRD
- Generate a Design
- Generate Implementation
- Execute QA
- Review results
- Complete a workflow

without leaving Sydeso.

The system must demonstrate that AI agents can participate in a structured software delivery lifecycle while remaining observable, auditable, and governed by human approval.
