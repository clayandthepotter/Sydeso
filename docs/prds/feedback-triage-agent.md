# PRDs - PRD: Feedback Triage Agent

Version: 0.1.0
Status: Future Capability
Owner: Product
Last Updated: 2026-06-02

---

# Executive Summary

The Feedback Triage Agent is a future capability that analyzes incoming Feedback and recommends triage outcomes.

The agent operates in the Work Intake layer.

It does not send Feedback directly into the Workflow Engine.

Only Stories may enter the Workflow Engine.

---

# Goals

- Classify feedback type
- Score priority
- Detect duplicates
- Recommend whether feedback should become a Story
- Produce traceable Feedback Analysis artifacts

---

# Non-Goals

- Automated acceptance
- Automated rejection without human review
- Direct workflow creation
- Public voting analysis

---

# Trigger

Feedback Submission

---

# Inputs

- Feedback text
- Feedback metadata
- Attachments metadata
- Similar feedback history
- Existing Stories
- Product area context
- Prior triage decisions

---

# Outputs

- Analysis
- Classification
- Duplicate candidates
- Priority recommendation
- Story recommendation
- Confidence score

---

# Classification

Supported classifications:

- Bug report
- Feature request
- UX feedback
- Usability issue
- Performance issue
- Documentation issue
- General comment

---

# Priority Scoring

Priority recommendations consider:

- User impact
- Severity
- Frequency
- Strategic alignment
- Existing duplicate count
- Implementation urgency

---

# Duplicate Detection

The agent searches:

- Existing Feedback
- Converted Stories
- Open Stories
- Project Memory

Duplicate recommendations must include rationale and linked candidates.

---

# Story Recommendation

When Feedback should become work, the agent recommends:

- Story title
- Story description
- Acceptance criteria
- Suggested priority
- Source Feedback links

Human approval is required before Story creation.

---

# Events

- FeedbackAgentStarted
- FeedbackAgentCompleted
- FeedbackTriaged

---

# Acceptance Criteria

- The agent analyzes submitted Feedback.
- The agent recommends classification and priority.
- The agent identifies duplicate candidates.
- The agent can recommend Story creation.
- The agent never creates workflow runs directly.
