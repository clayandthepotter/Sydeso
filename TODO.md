# Sydeso Project Todo

This todo tracks implementation status against the public roadmap and architecture docs.

Primary collaboration/execution tracking is in GitHub Issues and GitHub Projects.

`TODO.md` is the in-repo mirror/index and should reference linked GitHub work when available.

## Current Status

- [x] Create initial application monorepo scaffold.
- [x] Add Next.js web app shell.
- [x] Add NestJS API shell.
- [x] Add runner app shell.
- [x] Add shared domain and API contract packages.
- [x] Add initial Prisma schema.
- [x] Configure Prisma datasource for Supabase pooler and direct migration URLs.
- [x] Add ignored local Supabase database environment file.
- [x] Add package-local Prisma env example for db CLI commands.
- [x] Fix API TypeScript build configuration for workspace package imports.
- [x] Add local Postgres, Redis, and MinIO Docker compose stack.
- [x] Verify scaffold with `pnpm typecheck`.
- [x] Verify scaffold with `pnpm build`.

## Security Follow-Up

- [ ] Rotate the Supabase database password after setup because it was shared in chat.

## Open Source Maintenance

- [x] Add source-available BSL 1.1 license.
- [x] Add README.
- [x] Add changelog.
- [x] Add contributing guide.
- [x] Add code of conduct.
- [x] Add security policy.
- [x] Add AGENTS.md.
- [x] Add CI workflow.
- [x] Add release validation workflow.
- [x] Add issue templates.
- [x] Add pull request template.
- [x] Add dependency update automation.
- [ ] Add first tagged release.

## Public Collaboration and Source-Available Readiness (Phase A)

- [x] Update root public `README.md` as the main project entry point.
- [x] Update `LICENSE` to BSL 1.1 with Sydeso parameters.
- [x] Add `LICENSE-FAQ.md`.
- [x] Add `OPEN_CORE.md`.
- [x] Add `COMMERCIAL.md`.
- [x] Restore public `docs/RULES.md`.
- [x] Keep `private_docs/RULES.md` as internal/private and maintain a sanitized public derivative in `docs/RULES.md`.
- [x] Add public `docs/product/roadmap.md`.
- [x] Update `CONTRIBUTING.md` with issue-first and project-first workflow.
- [x] Update `.github/pull_request_template.md` with boundary/design/license checks.
- [x] Add issue templates for epic/task/design/docs/licensing-boundary work.
- [x] Add `.github/project` source-of-truth directory for labels, Project config, issues, wiki pages, and scripts.
- [x] Add project sync workflow for labels, Project fields, and managed issues.
- [x] Add wiki publish workflow.
- [x] Add generated roadmap workflow.
- [x] Add semantic-release workflow and config for changelog/release automation.
- [ ] Create GitHub Project "Sydeso Roadmap" with required fields/views.
- [ ] Create roadmap epics and milestone issues in GitHub.
- [ ] Add labels taxonomy in GitHub (type/area/phase/priority/contributor labels).
- [ ] Configure branch protection to require PRs to `main`.
- [ ] Add `GH_PROJECTS_TOKEN` secret if repo-level Project v2 writes require a PAT.

## Documentation Propagation Checklist

Every major plan item must be documented in the correct location.

Public docs (must remain contributor-safe):

- [x] `README.md`
- [x] `docs/RULES.md`
- [x] `docs/product/roadmap.md`
- [x] `CONTRIBUTING.md`
- [x] `.github/pull_request_template.md`
- [x] `.github/ISSUE_TEMPLATE/*`
- [x] `LICENSE-FAQ.md`
- [x] `OPEN_CORE.md`
- [x] `COMMERCIAL.md`

Private docs (`private_docs`):

- [x] `private_docs/project-direction.md`
- [x] `private_docs/repository-structure.md`
- [x] `private_docs/provisioning-strategy.md`
- [x] `private_docs/pricing-strategy.md`
- [x] `private_docs/ui_design_inspo/README.md` (design inspiration index)

## Marketing Website

- [x] Build public waitlist landing page.
- [x] Add accessible waitlist form UI.
- [x] Persist waitlist signups through API and database.
- [ ] Add analytics and conversion tracking.
- [x] Add production deployment target for the marketing site.

## Design System and Brand Lock

- [x] Publish the Sydeso visual design lock and branding guide.
- [x] Add the in-product design guide generator and design compliance artifact flow.

## Strategic Product Documentation

- [x] Document Sydeso competitive positioning against Plane, Linear, Jira, and ClickUp.
- [x] Document governing documentation, company/project wikis, and guardrail concepts.
- [x] Document artifact drafts and direct human editing workflows.

## Persistent Core Loop

Target loop:

```txt
Feature Request -> Artifact -> Workflow Run -> Transition -> Job -> Runner -> Output Artifact -> Next Transition
```

- [x] Create feature request through API.
- [x] Persist feature request as immutable `feature_request` artifact.
- [x] Create workflow run for feature.
- [x] Persist initial workflow transition.
- [x] Persist user/system workflow transition to executable state.
- [x] Enqueue job from workflow transition.
- [x] Register runner with token.
- [x] Accept runner heartbeat.
- [x] Match runner capabilities to queued jobs.
- [x] Allow runner to claim queued job.
- [x] Allow runner to complete job.
- [x] Persist runner output as immutable artifact.
- [x] Advance workflow to next state after job completion.
- [x] Enqueue follow-up job when the next transition requires execution.
- [x] Persist failed QA remediation loop.
- [x] Escalate after configured remediation limit.

## Phase 1: Real App Foundation

- [ ] Implement authentication.
- [ ] Implement organization CRUD.
- [ ] Implement workspace CRUD.
- [ ] Implement project CRUD.
- [ ] Implement memberships.
- [ ] Implement RBAC roles: Organization Owner, Product Lead, Developer, QA Reviewer, Viewer.
- [ ] Enforce tenant-safe query scoping.
- [ ] Add API validation and consistent error responses.
- [ ] Add seed data for local development.
- [ ] Exit criteria: user can sign in.
- [ ] Exit criteria: user can create organization, workspace, and project.
- [ ] Exit criteria: API access is tenant-scoped.

## Phase 2: Artifact System

- [ ] Implement immutable artifact table and service.
- [ ] Implement artifact versioning.
- [ ] Implement artifact checksums.
- [ ] Integrate S3-compatible storage for large artifacts.
- [ ] Add artifact lineage/source metadata.
- [ ] Add artifact browser UI.
- [ ] Exit criteria: creating a feature request stores a `feature_request` artifact.
- [ ] Exit criteria: artifacts cannot be overwritten.
- [ ] Exit criteria: artifact versions are browsable.

## Phase 3: Workflow Engine

- [ ] Implement persisted workflow templates.
- [x] Implement persisted workflow runs.
- [x] Implement transition validation.
- [ ] Implement approval gates.
- [x] Implement audit logs.
- [x] Implement job enqueueing from workflow transitions.
- [ ] Add feature workflow timeline UI.
- [ ] Exit criteria: feature can move from Backlog to Design Approval.
- [ ] Exit criteria: every transition creates an audit record.
- [ ] Exit criteria: workflow state is the source of truth.

## Phase 4: Agent Orchestration

- [ ] Implement PM Agent abstraction.
- [ ] Implement Architect Agent abstraction.
- [ ] Implement Developer Agent abstraction.
- [ ] Implement QA Agent abstraction.
- [ ] Integrate OpenAI using BYO API keys.
- [ ] Inject skill files into agent context.
- [ ] Inject memory search results into agent context.
- [ ] Validate structured agent outputs.
- [ ] Exit criteria: Design stage generates a valid design package artifact.

## Phase 5: Runner Protocol

- [x] Implement runner registration.
- [x] Implement runner token authentication.
- [x] Implement runner heartbeat.
- [x] Implement runner capability matching.
- [x] Implement job claiming.
- [x] Implement job completion.
- [ ] Persist runner logs and metrics.
- [ ] Add runner dashboard UI.
- [ ] Exit criteria: self-hosted runner can claim and complete a real queued job.

## Phase 6: Development Execution

- [ ] Implement repository checkout.
- [ ] Implement branch/worktree creation.
- [ ] Implement implementation patch generation.
- [ ] Implement test generation.
- [ ] Implement migration generation.
- [ ] Generate implementation package artifact.
- [ ] Exit criteria: Development stage can produce code/test artifacts from approved design.

## Phase 7: Automated QA

- [ ] Execute unit tests.
- [ ] Execute integration tests.
- [ ] Execute Playwright E2E tests.
- [ ] Execute axe-core accessibility checks.
- [ ] Execute Lighthouse checks.
- [ ] Capture visual regression evidence.
- [ ] Validate implementation against acceptance criteria.
- [ ] Generate QA report artifact.
- [ ] Exit criteria: QA can pass/fail implementation and produce QA report artifact.

## Phase 8: Remediation Loop

- [x] Route failed QA back to Developer Agent.
- [x] Track remediation iteration count.
- [x] Re-run QA after remediation.
- [x] Escalate after configured maximum attempts.
- [ ] Exit criteria: failed QA loops through Developer Agent and QA Agent up to configured max, then escalates.

## Phase 9: Human Review and Ready

- [ ] Build manual review screen.
- [ ] Add QA report viewer.
- [ ] Add screenshot viewer.
- [ ] Add coverage/compliance report viewer.
- [ ] Implement approve action.
- [ ] Implement reject action.
- [ ] Implement escalate action.
- [ ] Exit criteria: feature can reach Ready after manual review.

## Phase 10: Productionization

- [ ] Deploy web app.
- [ ] Deploy API.
- [ ] Provision production PostgreSQL.
- [ ] Provision production Redis.
- [ ] Provision S3-compatible storage.
- [ ] Implement secrets management.
- [ ] Add logging and observability.
- [ ] Add backup and restore process.
- [ ] Implement DigitalOcean managed runner provisioning.
- [ ] Implement billing and plan entitlements.
- [ ] Perform security hardening.
- [ ] Exit criteria: Sydeso can run as production SaaS with self-hosted and managed runners.
