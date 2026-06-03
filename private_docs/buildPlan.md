Phase 1: Real App Foundation
Build auth, org/workspace/project CRUD, memberships, RBAC, Prisma migrations, API validation, error handling, and seed data.

Exit criteria:

A user can sign in.
A user can create an organization, workspace, and project.
API access is tenant-scoped.
Phase 2: Artifact System
Build immutable artifact storage with versioning, checksums, S3/MinIO support, and artifact browsing.

Exit criteria:

Creating a feature request stores a feature_request artifact.
Artifacts cannot be overwritten.
Artifact versions are browsable.
Phase 3: Workflow Engine
Build persisted workflow runs, transitions, audit logs, approval gates, and job enqueueing.

Exit criteria:

A feature can move from Backlog to Design Approval.
Every transition creates an audit record.
Workflow state is the source of truth.
Phase 4: Agent Orchestration
Build PM/Architect/Developer/QA agent abstractions, OpenAI integration, skill injection, memory hooks, and structured artifact output.

Exit criteria:

The Design stage generates a valid design package artifact.
Phase 5: Runner Protocol
Build runner registration, token auth, heartbeat, capability matching, job claiming, job completion, and logs.

Exit criteria:

A self-hosted runner can claim and complete a real queued job.
Phase 6: Development Execution
Build repository checkout, branch/worktree creation, patch generation, test generation, migration generation, and implementation package output.

Exit criteria:

Development stage can produce code/test artifacts from an approved design.
Phase 7: Automated QA
Build test execution, Playwright, accessibility, Lighthouse, visual regression capture, acceptance criteria checks, and QA reports.

Exit criteria:

QA can pass/fail an implementation and produce a QA report artifact.
Phase 8: Remediation Loop
Build failed QA routing back to development, iteration tracking, and escalation after max attempts.

Exit criteria:

Failed QA loops through Developer Agent and QA Agent up to the configured max, then escalates.
Phase 9: Human Review and Ready
Build manual review screens, approval/rejection/escalation actions, artifact/report viewers, and Ready state completion.

Exit criteria:

A feature can reach Ready after manual review.
Phase 10: Productionization
Build deployment, secrets, observability, backups, managed runners, billing/entitlements, and security hardening.

Exit criteria:

Sydeso can run as a production SaaS with self-hosted and managed runners.
