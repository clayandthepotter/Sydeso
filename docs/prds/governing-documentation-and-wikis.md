# PRDs - PRD: Governing Documentation and Wikis

Version: 0.1.0
Status: Draft
Owner: Product
Last Updated: 2026-06-02

---

# Executive Summary

Governing Documentation and Wikis provide the active knowledge and guardrail layer for Sydeso.

Company and project wikis are not passive documentation repositories.

They provide the context, standards, constraints, and decision history that humans, agents, workflows, and QA checks use to move software from concept to production safely.

---

# Problem Statement

Software delivery fails when important context lives outside the delivery system.

Common problems include:

- Documentation drift
- Repeated explanations to agents and collaborators
- Inconsistent engineering practices
- Unclear design standards
- Forgotten architectural decisions
- Weak release guardrails
- QA that does not understand project-specific expectations

Sydeso needs wikis and governing documents that actively shape workflow execution.

---

# Goals

- Provide company-level and project-level knowledge spaces
- Store standards, policies, runbooks, architecture notes, and design guidance
- Make governing documents available to agents and reviewers as workflow context
- Allow humans to directly edit documentation through versioned drafts
- Validate artifacts and workflow transitions against relevant policies
- Preserve documentation history for auditability

---

# Non-Goals

The MVP will not support:

- A general-purpose enterprise document management suite
- Cross-tenant knowledge sharing
- Public community knowledge bases
- Full compliance framework automation
- Unbounded wiki customization unrelated to software delivery

---

# Core Concept

Documentation becomes an active guardrail.

```text
Wiki / Policy / Standard
→ Context Injection
→ Artifact Generation or Human Editing
→ Validation
→ Approval Gate
→ Workflow Transition
```

The system should treat governing documents as context-bearing resources that can influence agents, approvals, QA, and release decisions.

---

# Documentation Scopes

## Organization Scope

Organization-level documentation applies across workspaces and projects.

Examples:

- Company engineering standards
- Security policy
- Release policy
- Accessibility policy
- Brand standards
- Organizational glossary
- Incident response runbooks

## Workspace Scope

Workspace-level documentation applies to teams or departments.

Examples:

- Team operating agreements
- Shared architecture patterns
- Team-specific process notes
- Cross-project reusable decisions

## Project Scope

Project-level documentation applies to one product or codebase.

Examples:

- Project wiki
- Project overview
- Product principles
- Architecture overview
- Design lock
- Coding standards
- Feature flag policy
- Release history

---

# MVP Capabilities

- Create, edit, and archive wiki pages
- Store organization and project pages
- Version wiki pages
- Submit documentation edits for approval when required
- Attach wiki pages to projects, stories, workflows, and artifacts
- Mark pages as governing documents
- Retrieve relevant wiki/policy context for agents
- Search wiki and governing documents
- Audit documentation changes

---

# Governing Document Types

- Engineering Standard
- Security Policy
- Release Policy
- QA Checklist
- Accessibility Standard
- Design Lock
- Brand Standard
- Architecture Decision Record
- Definition of Done
- Runbook

---

# Workflow Integration

Governing documents may be required inputs for workflow transitions.

Examples:

- PRD approval requires product principles and project wiki context.
- Design approval requires the design lock and accessibility standard.
- Development execution requires coding standards and architecture decisions.
- QA requires acceptance criteria, QA checklist, and design lock.
- Release requires release policy, feature flag policy, and rollback plan.

---

# Success Criteria

- Users can create company and project wiki pages.
- Users can mark pages as governing documents.
- Agents can receive relevant wiki/policy context during execution.
- Documentation edits are versioned and auditable.
- Workflow transitions can require specific governing documents.
- QA and approval screens can reference the governing documents used for validation.
