# PRDs - PRD: Work Intake System

Version: 0.1.0
Status: Draft
Owner: Product
Last Updated: 2026-06-02

---

# Executive Summary

The Work Intake System is the domain responsible for collecting incoming work and transforming it into execution-ready Stories.

Only Stories may enter the Workflow Engine.

Requests and Feedback are intake mechanisms.

Stories are execution mechanisms.

Workflows operate exclusively on Stories.

The Workflow Engine never receives Requests or Feedback directly.

---

# Problem Statement

Sydeso previously assumed that all work originated as Stories.

The revised model supports multiple intake sources while preserving a simple workflow lifecycle.

Without a dedicated Work Intake layer, the Workflow Engine would need to understand every intake source type, creating unnecessary complexity and coupling.

---

# Goals

- Support natural language Request submission
- Support direct user-defined Story creation
- Transform Requests into Stories
- Preserve source-to-Story traceability
- Keep the Workflow Engine unaware of intake source types
- Provide UI for request review and conversion history

---

# Non-Goals

- Automated acceptance without human approval
- Multi-channel feedback ingestion
- Public roadmap management
- Community voting
- Feedback reputation systems

---

# Domain Model

```text
Work Intake
├── Request
├── Feedback
└── Story
```

Request flow:

```text
Request
↓
PM Agent Analysis
↓
Story Draft
↓
Approval
↓
Backlog
```

User-defined Story flow:

```text
Story
↓
Backlog
```

or

```text
Story
↓
PM Review
↓
Backlog
```

Feedback flow:

```text
Feedback
↓
Triage
↓
Accepted
↓
Story
↓
Backlog
```

The backlog receives Stories only. Requests and Feedback remain source records linked to generated Stories.

---

# Request Lifecycle

```text
Submitted
↓
Analyzed
↓
Expanded
↓
Story Created
↓
Archived
```

---

# Functional Requirements

## WI-001

System shall allow Sydeso users to submit natural language Requests.

Priority: Critical

---

## WI-002

System shall analyze Requests and produce a structured Story draft.

Priority: Critical

---

## WI-003

System shall allow authorized users to approve Request-to-Story conversion.

Priority: Critical

---

## WI-004

System shall create a Story only after conversion is approved.

Priority: Critical

---

## WI-005

System shall preserve the relationship between the original Request and generated Story.

Priority: Critical

---

## WI-006

System shall allow users to submit structured Stories directly.

Priority: Critical

---

## WI-007

System shall block Requests from entering the Workflow Engine directly.

Priority: Critical

---

# Request UI

The MVP includes:

- Request List
- Request Detail
- Request Conversion History

Request detail displays:

- Original text
- Submitter
- Status
- Analysis
- Story draft
- Approval state
- Converted Story link

---

# API Requirements

## Submit Request

POST

`/requests`

---

## List Requests

GET

`/requests`

---

## Get Request

GET

`/requests/:id`

---

## Convert Request To Story

POST

`/requests/:id/convert-to-story`

---

# Events

- RequestSubmitted
- RequestAnalyzed
- RequestExpanded
- RequestConvertedToStory
- StoryCreated

---

# Permissions

- request.read
- request.create
- request.update
- story.create

---

# Dependencies

- Authentication
- Organizations
- Projects
- Stories
- PM Agent
- Triage Agent
- Event Bus
- Project Memory System

---

# Acceptance Criteria

- Users can submit natural language Requests.
- Requests can be analyzed into Story drafts.
- Authorized users can approve conversion.
- Approved Requests create Stories.
- Created Stories can enter the backlog.
- Requests never enter the Workflow Engine directly.
- Request-to-Story traceability is preserved.

---

# Future Intake Sources

Future intake types:

- GitHub Issue
- Jira Ticket
- Slack Message
- Discord Message
- Email
- API Request
- Voice Request
- Customer Portal Submission

All future sources must follow:

```text
Intake Source
↓
Story
↓
Workflow
```
