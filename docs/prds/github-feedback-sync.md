# PRDs - PRD: GitHub Feedback Sync

Version: 0.1.0
Status: Future Capability
Owner: Product
Last Updated: 2026-06-02

---

# Executive Summary

GitHub Feedback Sync is a future capability for synchronizing Feedback with GitHub Issues.

GitHub Issues are intake sources.

They must be imported into the Work Intake layer and converted into Stories before workflow execution.

Only Stories may enter the Workflow Engine.

---

# Goals

- Import GitHub Issues as Feedback or future intake items
- Link Feedback to GitHub Issues
- Synchronize status changes
- Process GitHub webhooks
- Preserve traceability from GitHub Issue to Feedback to Story

---

# Non-Goals

- Direct Workflow Engine integration with GitHub Issues
- Bidirectional code synchronization
- GitHub Projects replacement
- Automated issue acceptance

---

# Sync Model

```text
GitHub Issue
↓
Feedback
↓
Story
↓
Workflow
```

The Workflow Engine remains unaware of GitHub Issue details.

---

# Status Mapping

| GitHub Issue State | Sydeso Feedback Status |
|--------------------|------------------------|
| Open | New |
| Labeled triaged | Triaged |
| Labeled accepted | Accepted |
| Labeled rejected | Rejected |
| Linked Story created | Converted |
| Closed | Archived |

---

# Issue Linking

Each synchronized item stores:

- GitHub repository
- Issue number
- Issue URL
- Sync status
- Last synced timestamp
- Linked Feedback ID
- Linked Story ID when converted

---

# Webhook Processing

Supported webhook events:

- Issues opened
- Issues edited
- Issues labeled
- Issues unlabeled
- Issues closed
- Issue comments created

Webhook processing must be idempotent.

---

# Events

- GithubIssueImported
- FeedbackSyncedToGithub
- FeedbackSubmitted
- FeedbackTriaged
- FeedbackConvertedToStory

---

# Permissions

- integrations.manage
- feedback.read
- feedback.create
- feedback.update
- feedback.triage

---

# Acceptance Criteria

- GitHub Issues can be imported as Feedback.
- Feedback can link back to GitHub Issues.
- Webhooks update synchronized Feedback metadata.
- Status mapping is auditable.
- GitHub Issues never enter the Workflow Engine directly.
- Converted GitHub-originated Feedback preserves Story traceability.
