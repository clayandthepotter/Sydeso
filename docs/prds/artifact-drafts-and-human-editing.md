# PRDs - PRD: Artifact Drafts and Human Editing

Version: 0.1.0
Status: Draft
Owner: Product
Last Updated: 2026-06-02

---

# Executive Summary

Artifact Drafts and Human Editing make humans first-class contributors inside Sydeso workflows.

Agents can generate drafts, but humans must be able to directly edit PRDs, technical designs, wiki pages, design locks, prototypes, code-linked implementation artifacts, QA notes, and release documentation without prompting an agent for every change.

Manual edits should preserve immutability by creating draft revisions that become new artifact versions only after submission and approval.

---

# Problem Statement

Prompt-only editing is not reliable for every workflow.

Designers, PMs, engineers, QA reviewers, and stakeholders often need to make direct edits because:

- The change is faster to perform manually
- The user has domain expertise or design skill
- The change requires taste, judgment, or precise wording
- The user needs predictable control over the artifact
- The artifact must be resubmitted through approval after the change

Sydeso needs direct editing without sacrificing artifact immutability, traceability, or workflow governance.

---

# Goals

- Allow humans to directly edit mutable artifact drafts
- Preserve approved artifact versions as immutable records
- Automatically bump artifact versions after approved edits
- Generate diffs between source version and draft
- Route submitted drafts through approval gates
- Let agents validate and summarize human edits
- Support direct edits for content, structured docs, design artifacts, and code-linked implementation artifacts

---

# Non-Goals

The MVP will not support:

- Arbitrary production database edits through artifact editors
- Freeform visual app building
- Direct mutation of approved artifact versions
- Publishing edits without audit records
- Bypassing workflow approval gates

---

# Core Concept

Approved artifacts are immutable.

Drafts are mutable.

```text
Artifact Version N
→ Create Draft
→ Human or Agent Edits Draft
→ Diff + Validation
→ Submit for Approval
→ Approval Gate
→ Artifact Version N+1
```

The workflow should not care whether a draft was created by a human or agent.

It should care that the draft is versioned, validated, approved, and traceable.

---

# Editable Artifact Types

- Research Report
- PRD
- Technical Design
- UI/UX Wireframe
- UI/UX Prototype Snapshot
- Design Lock
- Wiki Page
- Policy Definition
- QA Report Notes
- Release Notes
- Implementation Package Metadata

Source code itself remains edited through Git branches, worktrees, or pull requests, then linked back to implementation package artifacts.

---

# Human Editing Modes

## Structured Document Editor

For PRDs, research, technical designs, QA notes, and release notes.

Supports markdown or rich text with versioned drafts.

## Wiki Editor

For company and project documentation.

Supports page versioning, direct editing, and approval requirements for governing pages.

## CMS Editor

For marketing pages and content blocks.

Supports constrained fields, preview, approval, and publish revalidation.

## Prototype Attachment Editor

For Figma links, snapshots, comments, and prototype approval metadata.

Does not attempt to replace Figma in the MVP.

## Code-Linked Editing

For developers working directly in Git branches or worktrees.

Sydeso links the resulting PR, diff, test result, and implementation package artifact back into the workflow.

---

# Agent Role

Agents should assist rather than control every edit.

Appropriate agent responsibilities:

- Generate initial drafts
- Summarize human edits
- Validate edits against governing documents
- Detect inconsistencies
- Suggest remediation
- Update implementation plans after approved edits

Agents should not be required for simple copy, layout, prototype, or code edits that a qualified human can perform directly.

---

# Success Criteria

- A user can create an editable draft from an approved artifact version.
- A user can submit the draft for approval.
- Sydeso shows a diff between the source version and draft.
- Approval creates a new immutable artifact version.
- Rejected drafts remain traceable but do not replace approved versions.
- Agents can validate and summarize human edits before approval.
