# Public Contributor Rules

Version: 1.0.0
Status: Active
Owner: Maintainers
Last Updated: 2026-06-04

---

## Purpose

This file defines public contributor-safe engineering rules for the Sydeso core repository.

These rules are sufficient for community contribution without access to private documentation.

---

## Core Invariant

Sydeso is workflow-first and artifact-driven.

```txt
Feature Request -> Artifact -> Workflow Run -> Transition -> Job -> Runner -> Output Artifact -> Next Transition
```

Workflow state is the source of truth.

Artifacts are the system of record.

---

## Engineering Rules

- Keep code typed and buildable.
- Keep modules small and composable.
- Do not hardcode runtime data that belongs in configuration or database state.
- Preserve multi-tenant boundaries in API and data-access changes.
- Do not modify applied migrations after publication.
- Do not commit secrets.

---

## Validation Requirements

Before opening a PR for code changes:

```bash
pnpm typecheck
pnpm build
```

For database changes:

```bash
pnpm db:generate
pnpm db:migrate
```

---

## Contribution Workflow

GitHub Issues and GitHub Projects are the definitive collaboration and execution trackers.

Expected flow:

Issue -> Project item -> Branch/PR -> Checks/review -> Merge -> Status update

Do not implement untracked work.

Instead of assuming/presuming project direction, or making any executive decisions, ask clarifying questions you may need answered before any implementation.

Roadmap and collaboration automation lives in `.github/project`.

Changes to managed labels, issue seeds, wiki pages, and roadmap automation should be made there first.

Use conventional commit-style PR titles/merge commits so semantic-release can maintain changelog and releases.

---

## Pull Request Requirements

PRs must include:

- Linked issue
- Summary and scope
- Validation run output summary
- Risk notes (tenant/workflow/data impact)
- Screenshots for UI changes
- Migration notes for DB changes

---

## Design Lock Requirements

For UI changes:

- Follow `docs/brand/visual-branding-guide.md`
- Follow `docs/prds/design-system-governance.md`
- Keep radius small (5-10px max unless explicitly approved)
- Keep typography and tokens aligned with the design lock

---

## Public vs Private Documentation

- Public contributor docs belong in `docs/` and root governance files.
- Internal strategy and non-public planning materials belong in `private_docs/`.
- Public contribution must not require private docs.
