# Product - Roles and Permissions

Version: 0.1.0
Status: Draft
Owner: Product
Last Updated: 2026-06-02

---

# Purpose

This document defines the authorization model for Sydeso.

The permissions system determines:

- Who can access resources
- Who can create resources
- Who can modify resources
- Who can approve workflow progression
- Who can manage agents
- Who can manage runners
- Who can administer organizations

The MVP uses Role-Based Access Control (RBAC).

Future versions may introduce Attribute-Based Access Control (ABAC).

---

# Authorization Principles

## Least Privilege

Users should only receive permissions required for their responsibilities.

---

## Explicit Permissions

Permissions must be granted intentionally.

No implicit administrative access.

---

## Auditability

Every permission-sensitive action must be recorded.

Examples:

- Approval decisions
- Role changes
- Agent configuration changes
- Runner management actions

---

## Tenant Isolation

Users can only access resources belonging to their organization.

Cross-tenant access is prohibited.

---

# Authorization Hierarchy

Organization
└── Workspace
    └── Project
        └── Resource

Permissions inherit downward.

Example:

Organization Admin
↓
Workspace Access
↓
Project Access

---

# MVP Roles

The MVP supports six primary roles.

---

## Organization Owner

Highest level authority.

Responsible for:

- Billing
- Organization management
- Security
- Governance

---

### Intended User

- Founder
- Business Owner

---

## Organization Admin

Administrative role.

Responsible for:

- User management
- Workspace management
- Configuration

---

### Intended User

- Operations
- Technical Lead

---

## Product Manager

Responsible for:

- Planning
- Prioritization
- Approvals
- Workflow management

---

### Intended User

- Product Manager
- Founder

---

## Engineer

Responsible for:

- Technical review
- Development oversight
- Agent execution review

---

### Intended User

- Software Engineer
- Technical Lead

---

## Reviewer

Responsible for:

- Artifact review
- Approval workflows
- QA oversight

---

### Intended User

- QA
- Designer
- Stakeholder

---

## Viewer

Read-only access.

Responsible for:

- Monitoring
- Reporting
- Visibility

---

### Intended User

- Client
- Executive
- Observer

---

# Permission Categories

Permissions are grouped by domain.

---

## Organization Permissions

Controls organization-level resources.

---

## Workspace Permissions

Controls workspace resources.

---

## Project Permissions

Controls project resources.

---

## Workflow Permissions

Controls workflow progression.

Workflow execution applies only to Stories.

Requests and Feedback require intake permissions and must be converted into Stories before workflow permissions apply.

---

## Request Permissions

Controls natural language work requests.

---

## Feedback Permissions

Controls product feedback and triage.

---

## Artifact Permissions

Controls document access.

---

## Artifact Draft Permissions

Controls direct human editing of mutable artifact drafts.

Approved artifact versions remain immutable.

---

## Wiki Permissions

Controls company, workspace, and project wiki pages.

---

## Policy Permissions

Controls governing documents such as engineering standards, design standards, QA checklists, and release policies.

---

## Design Lock Permissions

Controls visual guide generation, editing, approval, and design compliance rules.

---

## Agent Permissions

Controls agent execution and configuration.

---

## Runner Permissions

Controls runner infrastructure.

---

## Administrative Permissions

Controls platform administration.

---

# Organization Permissions

| Permission | Description |
|------------|-------------|
| organization.read | View organization |
| organization.update | Modify organization |
| organization.delete | Delete organization |
| organization.billing.read | View billing |
| organization.billing.manage | Manage billing |
| organization.members.read | View members |
| organization.members.manage | Manage members |

---

# Workspace Permissions

| Permission | Description |
|------------|-------------|
| workspace.read | View workspace |
| workspace.create | Create workspace |
| workspace.update | Modify workspace |
| workspace.delete | Delete workspace |
| workspace.members.manage | Manage workspace users |

---

# Project Permissions

| Permission | Description |
|------------|-------------|
| project.read | View project |
| project.create | Create project |
| project.update | Modify project |
| project.archive | Archive project |
| project.delete | Delete project |

---

# Story Permissions

| Permission | Description |
|------------|-------------|
| story.read | View stories |
| story.create | Create stories |
| story.update | Modify stories |
| story.delete | Delete stories |
| story.prioritize | Change priority |

---

# Wiki Permissions

| Permission | Description |
|------------|-------------|
| wiki.read | View wiki pages |
| wiki.create | Create wiki pages |
| wiki.update | Edit wiki page drafts |
| wiki.archive | Archive wiki pages |
| wiki.approve | Approve governed wiki page versions |

---

# Policy Permissions

| Permission | Description |
|------------|-------------|
| policy.read | View governing documents |
| policy.create | Create governing document drafts |
| policy.update | Edit governing document drafts |
| policy.approve | Approve governing document versions |
| policy.enforce | Attach policies to workflow transitions |

---

# Artifact Draft Permissions

| Permission | Description |
|------------|-------------|
| artifact_draft.create | Create mutable drafts from artifact versions |
| artifact_draft.update | Edit mutable artifact drafts |
| artifact_draft.submit | Submit drafts for approval |
| artifact_draft.review | Review draft diffs and validation results |
| artifact_draft.approve | Approve draft promotion to a new artifact version |

---

# Design Lock Permissions

| Permission | Description |
|------------|-------------|
| design_lock.read | View project design locks |
| design_lock.create | Create design lock drafts |
| design_lock.update | Edit design lock drafts |
| design_lock.approve | Approve design lock versions |
| design_lock.validate | Run design compliance validation |

---

# Request Permissions

| Permission | Description |
|------------|-------------|
| request.read | View requests |
| request.create | Create requests |
| request.update | Modify requests |

---

# Feedback Permissions

| Permission | Description |
|------------|-------------|
| feedback.read | View feedback |
| feedback.create | Create feedback |
| feedback.update | Modify feedback |
| feedback.triage | Triage feedback |
| feedback.convert_to_story | Convert accepted feedback into a story |

---

# Workflow Permissions

| Permission | Description |
|------------|-------------|
| workflow.read | View workflows |
| workflow.execute | Trigger workflows |
| workflow.transition | Move workflow states |
| workflow.cancel | Cancel workflows |
| workflow.escalate | Escalate workflows |

---

# Approval Permissions

| Permission | Description |
|------------|-------------|
| approval.read | View approvals |
| approval.request | Request approval |
| approval.approve | Approve workflow progression |
| approval.reject | Reject workflow progression |

---

# Artifact Permissions

| Permission | Description |
|------------|-------------|
| artifact.read | View artifacts |
| artifact.create | Create artifacts |
| artifact.update | Modify artifacts |
| artifact.delete | Delete artifacts |
| artifact.approve | Approve artifacts |
| artifact.reject | Reject artifacts |
| artifact.version.read | View history |

---

# Agent Permissions

| Permission | Description |
|------------|-------------|
| agent.read | View agents |
| agent.execute | Execute agents |
| agent.cancel | Stop execution |
| agent.configure | Modify agent settings |
| agent.logs.read | View execution logs |
| agent.skills.manage | Manage skills |

---

# Runner Permissions

| Permission | Description |
|------------|-------------|
| runner.read | View runners |
| runner.register | Register runner |
| runner.update | Modify runner |
| runner.delete | Remove runner |
| runner.assign | Assign workloads |
| runner.logs.read | View runner logs |

---

# Memory Permissions

| Permission | Description |
|------------|-------------|
| memory.read | Read project memory |
| memory.write | Store memory |
| memory.delete | Remove memory |
| memory.search | Search memory |

---

# Release Permissions

| Permission | Description |
|------------|-------------|
| release.read | View releases |
| release.create | Create release |
| release.approve | Approve release |
| release.publish | Publish release |
| release.rollback | Rollback release |

---

# Administrative Permissions

| Permission | Description |
|------------|-------------|
| audit.read | View audit logs |
| settings.read | View settings |
| settings.update | Modify settings |
| integrations.manage | Manage integrations |
| roles.manage | Manage permissions |

---

# Role Permission Matrix

## Organization Owner

Full access to all permissions.

---

## Organization Admin

| Permission Group | Access |
|------------------|----------|
| Organization | Full |
| Workspace | Full |
| Projects | Full |
| Requests | Full |
| Feedback | Full |
| Workflows | Full |
| Artifacts | Full |
| Agents | Full |
| Runners | Full |
| Releases | Full |
| Settings | Full |

---

## Product Manager

| Permission Group | Access |
|------------------|----------|
| Organization | Read |
| Workspace | Read |
| Projects | Full |
| Requests | Full |
| Feedback | Full |
| Stories | Full |
| Workflows | Full |
| Approvals | Full |
| Artifacts | Full |
| Agents | Execute |
| Runners | Read |
| Releases | Read |

---

## Engineer

| Permission Group | Access |
|------------------|----------|
| Projects | Full |
| Requests | Read |
| Feedback | Read |
| Stories | Full |
| Workflows | Execute |
| Artifacts | Full |
| Agents | Execute |
| Agent Logs | Read |
| Memory | Read |
| Releases | Read |

---

## Reviewer

| Permission Group | Access |
|------------------|----------|
| Projects | Read |
| Requests | Read |
| Feedback | Triage |
| Stories | Read |
| Artifacts | Read |
| Approvals | Approve |
| QA Reports | Read |
| Releases | Read |

---

## Viewer

| Permission Group | Access |
|------------------|----------|
| Projects | Read |
| Requests | Read |
| Feedback | Read |
| Stories | Read |
| Artifacts | Read |
| Workflow Status | Read |
| Agent Activity | Read |

---

# Workflow Approval Model

Certain workflow states require approval.

---

## PRD Approval

Required Permission:

approval.approve

Eligible Roles:

- Product Manager
- Organization Admin
- Organization Owner

---

## Design Approval

Required Permission:

approval.approve

Eligible Roles:

- Engineer
- Product Manager
- Organization Admin
- Organization Owner

---

## QA Approval

Required Permission:

approval.approve

Eligible Roles:

- Reviewer
- Engineer
- Organization Admin
- Organization Owner

---

## Release Approval

Required Permission:

release.approve

Eligible Roles:

- Product Manager
- Organization Admin
- Organization Owner

---

# Agent Configuration Permissions

Only authorized users may modify agents.

---

## Allowed Roles

- Organization Owner
- Organization Admin

---

## Premium Plan Permissions

Additional permissions available on higher tiers:

| Permission | Description |
|------------|-------------|
| agent.profile.manage | Create custom agents |
| agent.skill.manage | Create custom skills |
| workflow.template.manage | Create templates |
| prompt.manage | Manage system prompts |

---

# Runner Management Permissions

Managed runners are controlled by Sydeso.

Self-hosted runners require registration.

---

## Allowed Roles

- Organization Owner
- Organization Admin

---

# Future Role Expansion

Future releases may introduce:

- Designer
- QA Specialist
- Security Reviewer
- Compliance Officer
- External Client
- Contractor
- Custom Roles

---

# Custom Roles

Not included in MVP.

Planned for future releases.

Users will be able to:

- Create custom roles
- Assign custom permissions
- Create approval groups

---

# Audit Requirements

The following actions must always generate audit records:

- Role assignments
- Permission changes
- Approval decisions
- Runner registration
- Agent configuration changes
- Integration changes
- Release approvals

---

# Default Workspace Access

When a user is invited:

1. User joins organization
2. User receives role
3. Role grants permissions
4. Permissions determine resource access

No resources are accessible without an assigned role.

---

# Security Constraints

The following actions always require elevated permissions:

- Billing management
- Organization deletion
- Runner registration
- Runner deletion
- Agent configuration
- Integration management
- Release publication

---

# MVP Authorization Summary

The MVP authorization model is intentionally simple:

- Organization Owner
- Organization Admin
- Product Manager
- Engineer
- Reviewer
- Viewer

Permissions are assigned through RBAC.

Approvals govern workflow progression.

All permission-sensitive actions are audited.

The authorization system ensures that AI-driven software delivery remains observable, governed, and secure while minimizing complexity during MVP development.
