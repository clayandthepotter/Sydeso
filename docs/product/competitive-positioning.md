# Product - Competitive Positioning

Version: 0.1.0
Status: Draft
Owner: Product
Last Updated: 2026-06-02

---

# Purpose

This document defines how Sydeso should be positioned relative to project management, work management, and AI-assisted development platforms.

The goal is to clarify Sydeso's product boundary so the platform can learn from competitors without becoming another noisy work tracker.

---

# Positioning Statement

Sydeso is a state-driven software delivery platform for AI-native teams.

It transforms concepts into production-ready outcomes through governed workflows, artifacts, agents, QA, runners, release controls, and active project memory.

Sydeso is not primarily a task tracker.

Sydeso is a concept-to-production execution system.

---

# Primary Competitors

Sydeso's closest competitive references are:

- Plane
- Linear
- Jira
- ClickUp

These products help teams organize, track, document, and coordinate work.

Sydeso should differentiate by helping teams execute and verify software delivery work end-to-end.

---

# Competitive Distinction

| Product | Primary Job | Sydeso Distinction |
| --- | --- | --- |
| Plane | Open-source project, wiki, and AI workspace | Sydeso adds state-driven software delivery, artifacts, runners, QA, and release governance. |
| Linear | Fast issue and project management | Sydeso moves beyond issue tracking into generated artifacts, governed workflows, and verified delivery. |
| Jira | Enterprise work tracking and process configuration | Sydeso focuses on outcome execution and agent-assisted delivery instead of administrative process overhead. |
| ClickUp | Broad all-in-one productivity and work management | Sydeso stays focused on software delivery and avoids generic productivity noise. |

---

# Product Boundary

Sydeso should include project management capabilities only when they support concept-to-production execution.

Included when they support delivery:

- Requests
- Stories
- Workflow states
- Artifacts
- Approvals
- Company and project wikis
- Governing documentation
- Design locks
- Project memory
- QA reports
- Releases
- Saved views over delivery state

Avoid or defer when they do not support delivery:

- Generic task sprawl
- Unbounded dashboard customization
- Social collaboration feeds
- General-purpose productivity modules
- Freeform project management features disconnected from workflow state

---

# Strategic Principle

Every product capability should answer at least one of these questions:

- Does this help transform a concept into production software?
- Does this improve artifact quality?
- Does this improve workflow governance?
- Does this improve agent context?
- Does this improve QA or release safety?
- Does this improve traceability?

If the answer is no, the capability should be deferred.

---

# Differentiated Product Promise

Traditional tools help teams manage work.

Sydeso helps teams produce verified software.

The platform should make this transformation explicit:

```text
Concept
→ Research
→ Requirements
→ Design
→ Prototype
→ Approval
→ Implementation
→ QA
→ Canary / Feature Flag
→ Release
→ Post-release Learning
```

The source of truth is always:

```text
Workflow State + Artifact History + Approval Gates
```

---

# Plane Inspiration Boundary

Plane is a useful reference for open-source product structure, work item hierarchy, docs/pages, views, self-hosting, and AI inside work management.

Because Plane is AGPL-3.0 licensed, Sydeso must not copy Plane source code, components, schemas, styles, assets, or documentation text unless the project intentionally accepts AGPL obligations.

Sydeso may study Plane for architectural and product inspiration, including:

- Monorepo boundaries
- Workspace/project hierarchy
- Work item views
- Docs and pages as first-class product areas
- Self-hosting posture
- Admin and deployment packaging concepts

Sydeso must remain differentiated as a software delivery execution platform, not a Plane clone.
