# PRDs - PRD: Feedback Management System

Version: 0.1.0
Status: Draft
Owner: Product
Last Updated: 2026-06-02

---

# Executive Summary

The Feedback Management System allows product end users to submit feedback and allows Sydeso teams to triage accepted feedback into Stories.

Only Stories may enter the Workflow Engine.

Requests and Feedback are intake mechanisms.

Stories are execution mechanisms.

Workflows operate exclusively on Stories.

The Workflow Engine never receives Requests or Feedback directly.

Feedback lifecycle states belong to the Work Intake layer, not the Workflow Engine.

---

# Goals

- Capture product feedback
- Provide a feedback queue
- Support triage decisions
- Convert accepted feedback into Stories
- Preserve traceability from Feedback to Story
- Support continuous product improvement

---

# Non-Goals

- Community voting
- Public roadmap
- Multi-channel feedback ingestion
- Automated acceptance
- Feedback reputation systems

---

# Feedback Domain

Feedback includes:

- Bug reports
- Feature requests
- UX feedback
- Product improvement suggestions

Entities:

- Feedback
- FeedbackComment
- FeedbackAttachment
- FeedbackAnalysis
- FeedbackStoryLink
- FeedbackSource

---

# Feedback Lifecycle

Accepted flow:

```text
Submitted
↓
Triaged
↓
Accepted
↓
Story Created
↓
Archived
```

Only the created Story may enter the backlog and workflow lifecycle.

The original Feedback remains an intake record linked to the Story.

Rejected flow:

```text
Submitted
↓
Rejected
↓
Archived
```

---

# Feedback Queue

The Feedback Queue contains unprocessed feedback.

Queue views support:

- Filtering by status
- Filtering by source
- Filtering by priority
- Duplicate review
- Conversion status tracking

---

# Triage Board

The Triage Board is a Kanban-style view.

Columns:

- New
- Triaged
- Accepted
- Rejected
- Converted

---

# Functional Requirements

## FM-001

System shall allow product end users to submit Feedback.

Priority: Critical

---

## FM-002

System shall display submitted Feedback in a Feedback Queue.

Priority: Critical

---

## FM-003

System shall allow authorized users to triage Feedback.

Priority: Critical

---

## FM-004

System shall allow authorized users to accept or reject Feedback.

Priority: Critical

---

## FM-005

System shall allow accepted Feedback to be manually converted into a Story.

Priority: Critical

---

## FM-006

System shall preserve Feedback-to-Story relationships.

Priority: Critical

---

## FM-007

System shall block Feedback from entering the Workflow Engine directly.

Priority: Critical

---

# Feedback UI

The MVP includes:

- Feedback List
- Feedback Detail
- Triage Board

Feedback detail displays:

- Submitted text
- Submitter or source metadata
- Attachments
- Status
- Triage decision
- Analysis
- Linked Story
- Activity history

---

# API Requirements

## Submit Feedback

POST

`/feedback`

---

## List Feedback

GET

`/feedback`

---

## Get Feedback

GET

`/feedback/:id`

---

## Triage Feedback

POST

`/feedback/:id/triage`

---

## Convert Feedback To Story

POST

`/feedback/:id/convert-to-story`

---

# Events

- FeedbackSubmitted
- FeedbackTriaged
- FeedbackAccepted
- FeedbackRejected
- FeedbackConvertedToStory
- StoryCreated

---

# Permissions

- feedback.read
- feedback.create
- feedback.update
- feedback.triage
- feedback.convert_to_story

---

# Dependencies

- Authentication
- Organizations
- Projects
- Stories
- Event Bus
- Project Memory System

---

# Acceptance Criteria

- Product end users can submit Feedback.
- Teams can view Feedback in a queue.
- Feedback can be triaged.
- Feedback can be accepted or rejected.
- Accepted Feedback can be converted into a Story.
- Converted Stories can enter the backlog.
- Feedback never enters the Workflow Engine directly.
- Feedback-to-Story traceability is preserved.
