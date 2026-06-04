# Product - Public Roadmap

Version: 0.1.0
Status: Draft
Owner: Product
Last Updated: 2026-06-04

---

## Purpose

This is the public roadmap for Sydeso core collaboration.

GitHub Issues and GitHub Projects are the definitive execution trackers.

`TODO.md` mirrors implementation status inside the repository.

---

## Product Direction

Sydeso is a state-driven, AI-native software delivery platform.

Primary outcome:

```txt
Concept -> Verified Production Outcome
```

Primary system model:

```txt
Workflow State + Artifact History + Approval Gates
```

---

## Now / Next / Later

### Now

- Public collaboration readiness
- Source-available licensing transition (BSL 1.1)
- Roadmap/project governance setup
- Public/private documentation boundary cleanup
- Design lock refinement and marketing UI alignment

### Next

- Phase 1: Real App Foundation
- Phase 2: Artifact System
- Phase 3: Workflow Engine completion
- Phase 4: Agent Orchestration baseline

### Later

- Phase 5: Runner Protocol visibility and dashboard
- Phase 6: Development Execution
- Phase 7: Automated QA
- Phase 8: Remediation loop completion
- Phase 9: Human Review and Ready
- Phase 10: Productionization

---

## Phase Roadmap (P1-P10)

### P1 Real App Foundation

Auth, org/workspace/project CRUD, memberships, RBAC, tenant scoping, API validation, seed data.

### P2 Artifact System

Immutable/versioned artifacts, checksums, storage integration, lineage metadata, artifact browser.

### P3 Workflow Engine

Workflow templates, approval gates, timeline UI, transition/audit completeness.

### P4 Agent Orchestration

PM/Architect/Developer/QA abstractions, BYO API keys, context injection, structured outputs.

### P5 Runner Protocol

Runner logs/metrics persistence, dashboard visibility, real queued job completion proof.

### P6 Development Execution

Repo checkout, branch/worktree flow, patch/test/migration generation, implementation package artifacts.

### P7 Automated QA

Unit/integration/E2E, accessibility, Lighthouse, visual regression, acceptance validation, QA artifacts.

### P8 Remediation Loop

Failed QA routing loop and escalation behavior finalized.

### P9 Human Review and Ready

Manual review screens, report viewers, approval/reject/escalate actions.

### P10 Productionization

Production deployment, managed infrastructure, observability, backup/restore, hardening, billing/entitlements.

---

## Cross-Cutting Tracks

- Source-available open-core governance
- GitHub collaboration model
- Public/internal docs split
- Design lock and UI standards
- Contributor onboarding

---

## Collaboration Rules

- Every implementation item must have a GitHub Issue and Project item.
- Work should not start without a tracked issue/project entry.
- Owner may make emergency direct fixes only when needed; issue tracking must be added retroactively.

---

## Non-Goals

- Becoming a generic project management platform
- Shipping ungoverned visual editors in MVP
- Exposing private strategic documentation in public core
- Bypassing workflow/artifact invariants for speed

---

## References

- `docs/vision.md`
- `docs/product/mvp-definition.md`
- `docs/product/competitive-positioning.md`
- `docs/prds/core-workflow-engine.md`
- `docs/prds/design-system-governance.md`
- `docs/RULES.md`
- `TODO.md`
