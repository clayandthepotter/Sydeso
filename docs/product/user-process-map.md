# Product - User Process Map

Version: 0.2.0
Status: Draft for review
Owner: Product
Last Updated: 2026-10-28

Changes from 0.1.0: Research and PRD mapped; one plain-language gate before code by default, the design gate optional per project; typical-duration lines removed; the ten open questions settled (see Decisions); projects without a repository get a Sydeso-hosted one; proposals added for a live preview at review, follow-up requests, splitting large requests, automatic release detection and a project context page.

---

# Purpose

This document defines what a person sees, is asked, and is told at every point in the Sydeso platform, in the person's own words. It is the contract the product UI is built against. Every screen, label, button and notification in `apps/web` must trace back to a line in this document, and every question a user could have must be answered here before it is answered in a chat with support.

It covers:

- The principles the interface follows, each tied to a rule.
- The vocabulary the interface uses, and where the system's own vocabulary still appears.
- The screens, and what each one is for.
- Every workflow state: what the user sees, what they are asked, what each answer does, what they are told afterwards, and every edge case.
- The flows that cut across states: first run, inviting someone, connecting a machine, returning from a notification, a viewer's day.
- Notifications and the installable app.
- The copy rules.
- Decisions taken, proposals still open, and what changes in the current UI.

It does not cover the API, the agent protocol or the data model. Those are in `docs/architecture`.

---

# Assumptions

- The engine's states are: Backlog, Research, PRD, PRD approval, Design, Design approval, Development, Automated QA, Manual review, Ready, Released, with Escalated reachable from any working state. Research, PRD and PRD approval are in `docs/product/mvp-definition.md` and not yet in `packages/domain/src/workflow.ts`; this document maps them so the engine work and the UI work land together.
- Roles are the six in `docs/product/roles-and-permissions.md`: Owner, Admin, Product manager, Engineer, Reviewer, Viewer.
- The remediation cap is the project's `maxRemediationIterations`, default 3.
- A request becomes a run the moment it is submitted. The user sees one thing, the request. If intake conversion to a Story lands in the engine, it is an activity line, not a second object.
- Every project has a git repository from the moment it exists: the user's, connected through GitHub, or one Sydeso hosts for the project until a repository is connected. The Developer commits to whichever one the project has.
- The platform is used mostly by one of three people: a founder who may not be technical, a product manager, or an engineer. Everything here is written for the founder; the engineer gets the same screens with the accordions open by default and, optionally, one more gate.

---

# Principles

Each principle produces a rule. The rule is what the UI is checked against.

1. **The user has four questions.** What did I ask for. Where is it. Is anything waiting on me. When is it done. Rule: every screen answers at least one of these in its first line, and Home answers the third before anything else.

2. **Open loops drive attention.** People return to unfinished things and forget finished ones. Rule: Home is an inbox ordered by what needs the user, then what is moving, then what finished. Organizations, workspaces, members and machines live behind Settings.

3. **Gate on what the user can judge.** A founder can judge a plan in plain words and a working result. They cannot judge a technical design, and asking them to approve one produces rubber-stamping. Rule: by default there are two gates, Approve plan before any code and Approve result after the checks pass. The technical design gate is a project setting, off by default, for teams with an engineer who wants it.

4. **One decision at a time.** More options means slower, less confident decisions. Rule: a gate shows one binary choice, Approve or Reject, as two buttons of equal weight. Anything else (Escalate, Regenerate) is in an overflow menu on the same row. No gate shows more than two primary buttons.

5. **Waiting is tolerable when work is visible.** Rule: a running step looks like an AI chat session: the agent's name, the step verb, a live timer in h:mm:ss, and a stream of activity lines. Details (diffs, files, command output, documents) sit behind accordions with no outline. Nothing else is said about the wait.

6. **Evidence, not assurance.** The user is judging AI output. Rule: an approval screen leads with what was produced, what it will touch and what the agent flagged, in that order, with the full document one click away. No sentence tells the user the output is good; the evidence does or does not.

7. **No dead ends.** Rule: every failure state names the cause in one line and offers at most three actions. Needs you is a page section, not a badge.

8. **The first run is the product.** Rule: a new user reaches a running request within two minutes of signing up, with no repository, no API key and no teammates. The organization, workspace and project are created with defaults and renamed later.

9. **Say less.** Rule: no reassurance, no apology, no exclamation marks, no explanation of a thing the user did not ask about, no estimate the system cannot stand behind. Labels are nouns, buttons are verbs, states are one word where possible. See Copy rules.

10. **Design for returning.** People check status between other things, on a phone, from a notification. Rule: the app installs as a PWA, sends push notifications for the events that need a person, and every notification deep-links to the exact decision.

11. **The system's words stay in the system.** Rule: artifact, workflow run, transition, job and runner appear in the audit log, the API and the activity accordions. They do not appear in a title, a button or a notification.

---

# Vocabulary

| System term | User sees | Where the system term still appears |
|---|---|---|
| Feature | Request | API, audit log |
| Feature request artifact | The request (the text they typed) | Documents accordion |
| Workflow run | Not shown. The request *is* the run. | Audit log, activity accordion as "run 7fcabbfc" |
| Workflow state | Status | Nowhere else |
| Transition | The status changing; an activity line "Moved to Building" | Audit log |
| Job | An agent working: "Planner · Planning · 4:12" | Activity accordion |
| Runner | Machine | Settings → Machines; "Waiting for a machine" |
| Artifact | Document, or by its type: Plan, Design, Code changes, Test results | Documents accordion, document pages |
| Research report | Findings, inside the plan | Document page |
| PRD | Plan | Document page |
| Design package | Design | Document page |
| Implementation package | Code changes | Document page |
| QA report | Test results | Document page |
| Agent type (research, pm, architect, developer, qa) | Researcher, Planner, Architect, Developer, Tester | Activity lines |
| Remediation | Fix attempt, "Fix attempt 2 of 3" | Audit log |
| Escalated | Needs you | Audit log |
| Organization / Workspace / Project | Shown only in Settings and in the project switcher. A new user never types them. | Settings |
| Sydeso-hosted repository | "Sydeso's repository for this project" | Project settings |

Status labels, in the user's words. The short label is for lists and notifications; the long line is for the request page.

| State | Short label | Long line |
|---|---|---|
| backlog | Submitted | Submitted. Starts when you press Start. (Seen only when the project has auto-start off.) |
| research | Planning | The Researcher is reading the project and the request. |
| prd | Planning | The Planner is writing what will be built and how it will be checked. |
| prd_approval | Approve plan | The plan is ready. Approve it to start the build. |
| design | Designing | The Architect is writing the technical design. |
| design_approval | Approve design | The design is ready. (Seen only when the project requires design approval.) |
| development | Building | The Developer is writing the code. |
| automated_qa | Testing | The Tester is running the checks. |
| manual_review | Approve result | The checks passed. Review the result to finish. |
| ready | Ready | Done. The pull request is open. |
| released | Released | Merged. |
| escalated | Needs you | Stopped. See why below. |

Research and PRD share the label Planning because the user experiences them as one step with two agents. The session shows them as two blocks under one heading.

Home groups by label: "Waiting on you" holds Approve plan, Approve design, Approve result and Needs you. "In progress" holds Planning, Designing, Building and Testing. Everything else is "Recent".

---

# The four questions, answered

| Question | Where it is answered |
|---|---|
| What did I ask for | The request page title and the request text, always at the top, never collapsed. |
| Where is it | The status line under the title, with the step indicator (current step lit). |
| Is anything waiting on me | Home, first group. A badge on the app icon and on the Home nav item with the count. A push notification when it becomes true. |
| When is it done | The live timer on the running step. When the run is complete, the date and the total time. No estimates. |

---

# Screen map

## Home

The first screen after sign-in. One column, three groups, each a list of request rows.

- **Waiting on you** (count in the heading). Requests in Approve plan, Approve design, Approve result or Needs you. Row: status glyph, title, status label, how long it has been waiting. Click goes to the decision, scrolled into view.
- **In progress.** Requests in Planning, Designing, Building or Testing. Row: status glyph, title, status label, live timer.
- **Recent.** Requests that reached Ready, Released or were closed in the last 14 days. Row: title, final status, date.

Above the groups: the project switcher if the user has more than one project, and the one primary button, New request. Below the groups: nothing.

If all three groups are empty: the New request form itself, inline, with one line above it: "Describe what you want built."

## Request

One page per request. Two columns on desktop, one on a phone.

**Main column, top to bottom:**

1. Title. Status line beneath it: status glyph, short label, timer if running.
2. The request text, as typed. Never collapsed.
3. The step indicator: the PCB trace, one node per step the project's settings expose (seven by default: Planning, Approve plan, Building, Testing, Approve result, Ready, Released; Designing and Approve design appear when the project requires design approval), lit through the current one. Needs you hangs off the current node in red when active.
4. The session: the body of the page, a transcript read top to bottom, newest at the bottom, auto-scrolled while running.

**The session** is a sequence of blocks, one per step the run has been through. Each block has:

- A header row: agent name or "You", the step label, the duration (final for finished steps, ticking for the current one). Example: "Planner · Planning · 7:41".
- Activity lines beneath it, one per thing that happened, in plain words: "Read 14 files in `apps/web`", "Wrote the plan", "Ran `pnpm test`, 112 passed". Lines arrive live during the step.
- Accordions, no border and no background, a chevron and a label only, collapsed by default for founders and open by default for engineers (a per-user preference): Files changed, Commands run, Documents, Raw log.
- For a gate block: the evidence, the decision row, and once decided, who decided, when, and the note if one was given.

A finished step collapses to its header row and a one-line summary. The current step is expanded. Blocks are separated by whitespace and a hairline, not cards.

**Side column:** the properties panel, with system identifiers (run id, request id, checksum) at the bottom under an accordion labelled Details.

**Primary action** lives in the current step's block, never in the page header. The header carries only the overflow menu: Stop this request, Copy link, Open repository.

## New request

One text area, "Describe what you want built", and the project if the user has more than one. One button, Submit. Below the button, one line only when it applies:

- No repository on the project: "No repository connected. Changes are kept in Sydeso's repository for this project until you connect one." with a link to project settings.
- On the trial key: "2 trial requests left." When none are left, Submit is replaced by "Add your API key" linking to Settings → Account.
- Auto-start off on the project: "Waits in Submitted until you press Start."

The title is derived from the first line of the text, editable later. The user is not asked for a title.

## Project

Reached from the project switcher. Lists every request in the project, grouped by status in workflow order, with the board view behind the segmented control. Settings tab: name, repository, branch, auto-start (on by default), require design approval (off by default), allow approve with failing tests (on by default), fix attempts (3), machine pool.

## Settings

Behind the gear in the sidebar footer. Tabs: Account (name, email, password, API key, notifications), Organization (name, plan, trial status), Members, Machines, Audit log. Workspaces appear only if the organization has more than one.

---

# Per-state map

For each state: what the user sees, what the system is doing, what the user is asked, what each answer does and whether it can be undone, what the user is told afterwards, who is notified, who can act and what everyone else sees, and the edge cases.

## Submitted (backlog)

Seen only when the project has auto-start off. With auto-start on, the default, this state lasts under a second.

| | |
|---|---|
| Sees | Status "Submitted". One button, Start. |
| System | Nothing. The request text is stored. |
| Asked | Start. |
| Start does | Moves to Planning and queues the Researcher. Cannot be undone; the request can be stopped from any state. |
| Told after | The Planning block appears with the timer at 0:00. |
| Notified | No one. |
| Who can act | Product manager, Engineer, Admin, Owner. Reviewer and Viewer see the status and no button. |

Edge cases:

- No machine online with the needed capabilities. Start is allowed. The Planning block shows "Waiting for a machine" with the timer running and one line: "No machine is online. Connect one in Settings → Machines." The job stays queued; when a machine appears the line is replaced by activity. Accounts whose plan includes a managed machine never see this.

## Planning (research, then prd)

Two engine states, one user step. The session shows a Planning heading with two blocks under it: "Researcher · Reading" then "Planner · Writing the plan".

| | |
|---|---|
| Sees | Status "Planning · 4:12". Researcher lines such as "Read 23 files", "Found the existing settings page at `apps/web/src/app/settings`", "No design guide in this project". Then Planner lines such as "Wrote 6 acceptance criteria", "Marked 2 open questions". |
| System | The Researcher produces findings; the Planner produces the plan (the PRD: what, for whom, acceptance criteria, out of scope, open questions, risks). |
| Asked | Nothing. Overflow: Stop. |
| Stop does | Cancels the running job and moves to Needs you with "Stopped by [name]". Cannot be undone; the user can start again from Needs you. |
| Told after | Both blocks collapse to their header rows and the Approve plan block appears. |
| Notified | The requester and everyone who can approve plans: "Plan ready: [title]". |
| Who can act | Same as Submitted. |

Edge cases:

- Job fails, machine lost, output empty or invalid: Needs you with the cause. See Needs you.
- Step runs past its limit: Needs you with "Took too long. Stopped after [time]." The limit is computed internally from the project's past runs (four times the median, never under 30 minutes) and is not shown.
- The request is a question, not work ("How does login work?"). The Planner answers it in the plan's summary and produces no acceptance criteria. Approve plan shows the answer and one button, Close request. Decision: detect at intake later.
- The request is too large for one run. The Planner says so in the plan and proposes a split. See Proposals: splitting large requests. Until that lands, the plan proceeds as one.

## Approve plan (prd_approval)

The first gate, and the one a founder can judge. It answers "is this what you meant?" in plain language.

| | |
|---|---|
| Sees | Status "Approve plan". The block contains in order: what will be built (the plan's summary, five lines at most), for whom and why (one paragraph), how it will be checked (the acceptance criteria as a checklist, each one a sentence a non-engineer can read), what is out of scope, what the Planner found (findings, risks, open questions), then an accordion "Full plan", then the decision row. |
| System | Waiting. No job. |
| Asked | Approve or Reject. Two buttons, equal weight, side by side. Beneath them one optional single-line field, "Note". Overflow: Escalate. |
| Approve does | Moves to Designing and queues the Architect. With design approval off (default), the design flows into Building without a gate. Cannot be undone; the request can be stopped during any later step. Under the button, in the muted size: "Starts the build." |
| Reject does | Moves back to Planning with the note as the Planner's instruction. The note is required: the field label becomes "What should change" and Reject is disabled until it has text. Cannot be undone, but costs only a new plan. |
| Escalate does | Moves to Needs you with "Escalated by [name]: [note]". |
| Told after | Approve: the block collapses to "You · Approved · [time]" and the Designing block appears. Reject: "You · Asked for changes · [note]" and a new Planning block appears. |
| Notified | On Approve: the requester if different from the approver. On Reject: no one. |
| Who can act | Product manager, Admin, Owner. Engineer, Reviewer and Viewer see the same block with the decision row replaced by "Waiting for [names]". |

Edge cases:

- Two people decide within the same second. The second sees "Already approved by [name]" inline and the block refreshes. The API refuses the second transition; the UI shows the reason, not an error code.
- The approver is the requester. Allowed.
- The plan is rejected repeatedly. No cap. After the second, the block header reads "3rd plan". No commentary.
- The approver wants to edit the plan rather than reject it. Not supported in this version; the note carries the change. When document drafts land, Edit joins the overflow.
- The plan has open questions. They are listed in the block. Approving with open questions is allowed; the Architect and Developer treat them as decisions they may make. Reject with a note is how the user answers them. Decision: a per-question answer field at the gate, later.

## Designing (design)

| | |
|---|---|
| Sees | Status "Designing · 2:30". Architect lines such as "Chose a server action over a new API route", "Will change 4 files", "Flagged: no tests cover the settings page". |
| System | The Architect produces the technical design. |
| Asked | Nothing. Overflow: Stop. |
| Told after, design approval off | Block collapses to "Architect · Designed · 5:10" and the Building block appears. The design is in Documents. |
| Told after, design approval on | Block collapses and the Approve design block appears. |
| Notified | Design approval off: no one. On: everyone who can approve designs, "Design ready: [title]". |

Edge cases: as Planning.

## Approve design (design_approval)

Shown only when the project has "Require design approval" on.

| | |
|---|---|
| Sees | Status "Approve design". The block: the design's summary, what it will touch (files and areas), what the Architect flagged, accordion "Full design", the decision row. |
| Asked | Approve or Reject. Optional note on Approve, required on Reject. Overflow: Regenerate, Escalate. |
| Approve does | Moves to Building and queues the Developer. Needs a machine with git, filesystem, terminal and node. Under the button: "Starts building on branch `sydeso/[slug]`." |
| Reject does | Moves back to Designing with the note. |
| Regenerate does | Same as Reject without a note. |
| Who can act | Engineer, Product manager, Admin, Owner. |

Edge cases: as Approve plan.

## Building (development)

| | |
|---|---|
| Sees | Status "Building · 12:07". Developer lines such as "Created branch `sydeso/kanban-board`", "Changed 9 files", "Committed: add board columns", "Ran `pnpm typecheck`". The Files changed accordion fills as the diff grows. On a fix attempt the header reads "Developer · Fix attempt 2 of 3" and the first lines are the failures it is fixing. |
| System | The Developer commits to the project's repository, the user's or Sydeso's, on a branch. |
| Asked | Nothing. Overflow: Stop. |
| Stop does | Cancels the job, keeps the branch and its commits, moves to Needs you with "Stopped by [name]". |
| Told after | Block collapses to "Developer · Built · 23:50 · 9 files · 4 commits" and the Testing block appears. |
| Notified | No one. |

Edge cases:

- Repository access revoked or token expired: Needs you, "Could not reach the repository. Check the connection in project settings." with the link.
- Branch exists from an earlier attempt: reused; an activity line says so.
- Merge conflict with the default branch: the Developer resolves it as part of the job; if it cannot, Needs you with "Could not merge with `main`" and the git output under an accordion.
- No code changes produced: Needs you, "No changes were made".
- The project uses Sydeso's repository: identical, except Open repository shows the clone URL and the in-app file view instead of GitHub.

## Testing (automated_qa)

| | |
|---|---|
| Sees | Status "Testing · 3:15". Tester lines such as "Ran 112 unit tests, 112 passed", "Ran 8 browser tests, 7 passed", "Checked 4 pages for accessibility", "Checked acceptance criteria: 5 of 6 met". Accordions: Commands run, Screenshots. |
| System | The Tester runs the checks and writes the test results with a pass or fail verdict, including an acceptance-criteria checklist against the plan. |
| Asked | Nothing. Overflow: Stop. |
| Told after, pass | Block collapses to "Tester · Passed · 112 of 112 · 6 of 6 criteria". The Approve result block appears. |
| Told after, fail, attempts remaining | Block collapses to "Tester · Failed · 3 of 112 failed". A Building block appears headed "Developer · Fix attempt 1 of 3". |
| Told after, fail, attempts exhausted | Block collapses to "Tester · Failed · 3 of 112 failed" and the request moves to Needs you with "Tests still failing after 3 fix attempts". |
| Notified | Pass: everyone who can approve results. Fail with attempts remaining: no one. Attempts exhausted: the requester and project admins, "Needs you: [title]". |

Edge cases:

- The tests cannot run at all. This is distinct from failing tests and must say why in one line: the missing thing, the command that failed, and the output under an accordion. Fixed forms: "Tests could not run: `playwright` is not installed on machine [name]", "Tests could not run: `pnpm install` failed", "Tests could not run: no test command is configured for this project". It counts as a fix attempt only when the cause is in the project (a broken test command, a missing dependency the Developer can add). When the cause is the machine, it does not count and the request moves to Needs you with the machine named.
- A flaky test fails once and passes on the fix attempt with no code change. Shown as it happened: "Fix attempt 1 of 3 · no changes needed · Tester · Passed".
- The fix loop keeps changing the same file back and forth. The cap stops it.

## Approve result (manual_review)

The second gate. It answers "is this what you wanted?" with the thing itself.

| | |
|---|---|
| Sees | Status "Approve result". The block, in order: the verdict in numbers ("112 of 112 tests passed · 6 of 6 criteria met · 9 files changed"), the acceptance-criteria checklist with each item ticked or not, the preview link as one button, Open preview (see Proposals: live preview; until it exists, the screenshot strip stands in its place), the Files changed accordion, the Test results accordion, "Open the pull request" or "Open the branch", then the decision row. |
| System | Waiting. |
| Asked | Approve or Reject. Optional note on Approve, required on Reject. Overflow: Escalate. |
| Approve does | Moves to Ready. Cannot be undone; it is the end of the run. Under the button: "Marks the pull request ready for review." |
| Reject does | Moves back to Building with the note as the Developer's instruction. Does not count against the fix-attempt cap, because a person asked for it. |
| Told after | Approve: "You · Approved · [time]", the Ready block appears. Reject: a new Building block. |
| Notified | Approve: the requester if different. |
| Who can act | Reviewer, Engineer, Admin, Owner. Product manager and Viewer see "Waiting for [names]". |

Edge cases:

- The reviewer wants to try it themselves: the preview and the branch are there. The decision can wait indefinitely; Home shows how long.
- The reviewer approves without opening any evidence. Allowed. Recorded in the audit log, not shown anywhere.
- Someone pushes to the branch by hand. Not noticed in this version. Later: re-run Testing on external pushes.

## Ready (ready)

| | |
|---|---|
| Sees | Status "Ready". The Ready block: "Done. Pull request #41 is open." with one button, Open pull request. On a Sydeso-hosted repository: "Done. The changes are on branch `sydeso/kanban-board`." with Open repository. Below: what was built, in the Developer's summary, and the total time from submit to ready. |
| System | Released is set when GitHub reports the pull request merged. On a Sydeso-hosted repository, the overflow has Merge, which merges the branch into the project's default branch and sets Released. |
| Asked | Nothing. |
| Notified | The requester: "Ready: [title]". |

This is the moment the person remembers. It is quiet: one line, one link, the numbers.

## Released (released)

| | |
|---|---|
| Sees | Status "Released" with the merge date. |
| Asked | Nothing. Overflow: Follow up (see Proposals). The request drops out of Recent after 14 days. |

## Needs you (escalated)

The only state where the page changes shape. The step indicator lights the escalated node in red. The Needs you block sits above the session.

| | |
|---|---|
| Sees | One line with the cause, in these fixed forms: "Stopped by [name]", "Escalated by [name]: [note]", "Tests still failing after 3 fix attempts", "Tests could not run: [cause]", "The [Researcher/Planner/Architect/Developer/Tester] failed: [one-line error]", "Machine [name] went offline during [step]", "Took too long. Stopped after [time]", "Could not reach the repository", "No changes were made", "The AI provider refused the request: [provider's message]", "Trial limit reached". Under it, an accordion with the raw detail. |
| Asked | At most three buttons, chosen by cause: |

| Cause | Buttons |
|---|---|
| Stopped by a person, or escalated | Start again from [last step] · Close request |
| Agent failed, machine lost, took too long | Try again · Close request |
| Tests still failing | Open the branch · Run tests again · Approve anyway (only when the project allows it) · Close request |
| Tests could not run, cause on the machine | Fix the machine (link to Settings → Machines) · Run tests again |
| Could not reach the repository | Fix the connection (link to project settings) · Try again |
| No changes were made | Reject with a note · Close request |
| AI provider refused | Fix the API key (link to Settings → Account) · Try again |
| Trial limit reached | Add your API key · Close request |

Approve anyway moves to Ready and is recorded as "Approved with failing tests by [name]". It is governed by the project setting "Allow approve with failing tests", on by default.

Close request marks the run closed, keeps everything, and removes it from Home. It is final in this version; the user submits a new request.

| | |
|---|---|
| Notified | On entering Needs you: the requester and project admins, by push and email. |
| Who can act | Engineer, Product manager, Admin, Owner. |

---

# Cross-cutting flows

## First run

1. Sign up: name, email, password. One screen.
2. "Connect a repository" with the GitHub button and a Start without one link. Without one, Sydeso creates a repository for the project and says so in one line on the next screen.
3. The New request form, with a muted example beneath the text area ("Add a dark mode toggle to the settings page") and the trial line, "3 trial requests left".
4. On submit: the request page with the Planning block running.

The organization is created with the user's name, the workspace with the organization's name, the project from the repository name or "First project". None of this is shown. All of it is renameable in Settings.

What the first run skips and when it comes back:

- No machine connected: the first request shows "Waiting for a machine" with the link, unless the plan includes a managed machine. Decision: the trial includes a managed machine, otherwise the first run stalls on the first screen that matters.
- No API key: the first three requests run on a platform key. The form shows the count. When it reaches zero, Submit is replaced by Add your API key.
- No teammates: nothing prompts for them.

## A project without a repository

Sydeso hosts a git repository for the project. The Developer commits to it exactly as it would to GitHub, so every change has a commit and a branch from the first request. The project's settings show the clone URL and Connect GitHub. When a repository is connected later, Sydeso pushes the hosted history to it and switches; the hosted copy is kept read-only for 30 days. Open repository on a request shows the branch in an in-app file view with the commit list. Decision: the in-app file view ships after the clone URL.

## Inviting someone

Settings → Members → Invite: email and role. The role picker shows what each role can do in one line each: "Reviewer: approves results. Cannot start, stop or approve plans." The invite is a link the inviter sends. The invitee signs up with the invited email and lands on Home for that organization.

## Connecting a machine

Settings → Machines → Add: name, and the install command shown once with the token inside it. One line: "Run this on the machine. It appears here when it connects." The row shows Online, Busy or Offline with the last-seen time.

## Returning from a notification

Every notification deep-links to the request page with the relevant block scrolled into view and, for gates, the decision row focused. If the decision was already made, the block shows who and when.

## A viewer's day

A Viewer sees Home with the same three groups and no buttons. Decision rows read "Waiting for [names]". The overflow has Copy link only. New request is absent.

## On a phone

One column. The step indicator becomes the vertical trace. Accordions stay collapsed. The decision row is sticky at the bottom while its block is in view. The properties panel moves under the session behind a Details accordion.

---

# Edge-case register

Conditions not tied to one state.

| Condition | User sees | Options | Outcome |
|---|---|---|---|
| Session expired on a request page | The page, dimmed, with Sign in in place of the decision row. A draft note is kept locally. | Sign in | Same place, note restored. |
| Offline (PWA) | Home from cache with one line, "Offline. Last update [time]". Buttons disabled. | None | Reconnects silently. |
| Role removed while viewing | Next action returns "You no longer have access to this project". | Back to Home | Home reloads. |
| Request closed or project archived | "This request was closed" with the final status. | Back to Home | None. |
| Two tabs on the same request | Both update live. | None | A second decision is refused with the name of who decided. |
| Push blocked in the browser | Settings → Account → Notifications shows "Blocked in your browser" with the browser's instructions linked. | Email stays on | Email is the fallback. |
| Empty or one-word request | Submit is disabled until the text has a sentence. | Write more | None. |
| Change the request text after submit | Not supported mid-run. | Stop, resubmit | None. |
| Plan limit reached | The action is replaced by a line naming the limit and a link to the plan. | Upgrade | None. |
| AI provider outage or bad key | Needs you with the provider's message. | Fix the key · Try again | None. |

---

# Notifications and the installable app

## Events that notify

Only events that need a person or close a loop a person opened.

| Event | Who | Push | Email | Text |
|---|---|---|---|---|
| Plan ready | Everyone who can approve plans | Yes | Yes | Plan ready: [title] |
| Design ready (when the gate is on) | Everyone who can approve designs | Yes | Yes | Design ready: [title] |
| Result ready | Everyone who can approve results | Yes | Yes | Review: [title] |
| Needs you | Requester, project admins | Yes | Yes | Needs you: [title] · [cause] |
| Ready | Requester | Yes | Yes | Ready: [title] |
| Approved or rejected by someone else | Requester | Yes | No | [Name] approved the plan for [title] |
| Waiting on you for 24 hours | The people it waits on | Yes | Yes | Still waiting: [title] |

No notification for Planning, Building, Testing, fix attempts, or anything an agent does.

## Push opt-in

Asked once, when it first has value: when the user's first request enters Planning, the request page shows one line under the status, "Get notified when the plan is ready", with a Turn on button that triggers the browser prompt. Dismissing hides the line for that account. Never asked at sign-up.

## Installable app (PWA)

- A web manifest: the mark, the name Sydeso, standalone display, the lime theme colour, the near-black background.
- A service worker that caches the shell and the last Home response, and receives push.
- Web Push with VAPID keys held server-side; subscriptions stored per user and device.
- iOS requires Add to Home Screen before push. The Turn on line on iOS Safari reads "Add Sydeso to your Home Screen first" with the share-sheet step.
- The badge API sets the app icon count to the size of Waiting on you.
- Notification deep links open inside the installed app.

Email is on by default for every push event and is the fallback where push is blocked.

---

# Copy rules

- Buttons are verbs: Approve, Reject, Start, Stop, Try again, Open preview. Never "Approve → Development".
- Decisions are binary and the two options have equal visual weight. A third option goes in the overflow.
- No reassurance. Not "Don't worry, your work is safe." Say what is true: "Kept the branch."
- No estimates. Not "usually 5 to 10 min". The timer is the only statement about time.
- No apology. Not "Sorry, something went wrong." Say what happened: "The Developer failed: [error]".
- No exclamation marks, no emoji, no "successfully", no "please".
- One consequence line under a button, only where the consequence is not obvious from the verb. Nothing under Reject.
- Numbers over adjectives. "112 of 112 passed", not "All tests passed".
- Time as the user reads it: a live timer in h:mm:ss or m:ss while running, "7:41" when done, a relative time for events, the date for anything older than two days.
- Agents are named by role, capitalised: Researcher, Planner, Architect, Developer, Tester. Never "AI", never "the agent".
- Status labels are one or two words. The long line is only on the request page.
- The user is "you". Other people are named. The system is not referred to; things happen or the named agent does them.

| Before | After |
|---|---|
| Your design has been generated successfully and is ready for your review! | Plan ready. |
| Designing · 4:12 · usually 5 to 10 min | Designing · 4:12 |
| Please note that approving will start the development job on an available runner. | Starts the build. |
| Oops, the QA agent encountered an error. | Tests could not run: `playwright` is not installed on machine build-01. |
| Remediation 2 | Fix attempt 2 of 3 |
| No workflow run exists for this feature. | Not started. |

---

# Decisions

Settled on 2026-10-28.

1. Auto-start is on by default. Submitted is seen only on projects that turn it off.
2. A request with no repository is allowed, with one line of warning. Sydeso hosts a git repository for the project until one is connected; every change is committed.
3. A step that runs too long is stopped at four times the project's median for that step, never under 30 minutes. The limit is internal and not shown.
4. Tests that cannot run must say why, in one line, with the output under an accordion. It counts as a fix attempt only when the cause is in the project, not the machine.
5. Approve anyway on failing tests is a project setting, on by default.
6. Close request is final. Reopening may come later from user feedback.
7. Approving without opening any evidence is recorded in the audit log and not shown.
8. The first three requests run on a platform key as a free trial. After that, the user adds their own key.
9. The thing the user submits is a Request.
10. Runners are Machines.
11. Typical durations are not shown anywhere.
12. Research and PRD are mapped as one user step, Planning, with one gate, Approve plan. Design approval is a project setting, off by default.

---

# Proposals

Changes to the model that this document recommends and that need a decision. Each says what the user gets and what it costs.

## Live preview at Approve result

The reviewer opens the feature running, on a URL, instead of looking at screenshots. The machine that ran the tests serves the branch for the life of the review, or the project's preview deployment (Vercel, Cloudflare) is linked when one exists. This is the single largest change to how the result gate feels: the user judges software by using it, which they can do, rather than by reading a report, which they often cannot. Cost: a preview-serving capability on machines, or a preview-deployment integration per project. Recommendation: build it; use the project's own preview deployment first because most repositories already have one.

## Follow-up requests

From a Ready or Released request, Follow up opens the New request form with the original request linked. The Researcher starts from the previous plan, design and changes, so "the button is in the wrong place" takes a minute of planning, not ten. The new request shows "Follows [title]" in its properties and the old one lists its follow-ups. Cost: a parent link on requests and the Researcher reading linked requests. Recommendation: build it in the first UI pass; it is small and it is how people actually work.

## Splitting large requests

When the Planner judges a request too large for one run, the plan proposes a split into ordered child requests, each with its own acceptance criteria. The Approve plan gate shows the split as a list; Approve creates the children and runs them in order, each through its own build, test and review. The parent shows "2 of 5 done". Cost: parent and child requests, ordering, and a Planner that can judge size. Recommendation: second pass. Until then, the Planner says in the plan that the request is large and the user may split it by hand.

## Automatic release detection

Released is set from GitHub's merge event, never by hand. On Sydeso-hosted repositories, Merge is a button. Cost: a GitHub webhook per connected repository. Recommendation: build it with the GitHub integration; a manual Mark released is a chore nobody will do.

## Project context page

A page under Project where the user writes, in plain language, what every agent should know: the product, the users, the rules ("never change the billing code without a note", "use the existing design system"). Agents read it on every run. The user sees what Sydeso knows, and the platform visibly gets better with use. This is the governing documentation PRD with a plain front. Cost: already specified in `docs/prds/governing-documentation-and-wikis.md`. Recommendation: ship the single page before the full wiki.

## What this document deliberately leaves out

- Progress percentages. The system cannot know them; a wrong number is worse than a timer.
- Chat with an agent mid-run. Communication goes through documents and gates, which keeps every decision auditable. The reply at a gate is the conversation.
- Gamification, streaks, confetti. The Ready block is the reward.
- A kanban board as the primary view. The board stays one click away for people who think in columns; the inbox is where decisions are.

---

# What changes in the current UI

Against what is on `main` today, in priority order:

1. Home becomes the inbox. The organization list moves to Settings. The project switcher replaces the organization switcher in the sidebar.
2. The request page body becomes the session: blocks, activity lines, timers, borderless accordions. The Transitions and Jobs panels are removed; their content is the session.
3. The transition panel becomes the decision row: Approve and Reject with a note, overflow for the rest.
4. Status labels and the vocabulary table are applied everywhere: nav, rows, badges, notifications.
5. New request becomes one text area with no title field, plus the three conditional lines.
6. Sign-up flows into repository connection and the first request. Organization, workspace and project are created silently.
7. Needs you becomes a page section with cause and buttons.
8. Project settings: auto-start, require design approval, allow approve with failing tests, fix attempts, repository.
9. Push and email notifications, the PWA manifest, service worker and badge.
10. Settings gathers Account, Organization, Members, Machines, Audit log.

Engine work the UI depends on: the Research, PRD and PRD approval states and the Researcher and Planner agents; the default hierarchy on sign-up; Sydeso-hosted repositories; a live activity stream per job; the platform trial key with its counter; notification delivery; the step time limit; the project settings above; and, from Proposals, follow-up links and the GitHub merge webhook.

---

# Open questions

New since 0.1.0.

1. Live preview: the project's own preview deployment first, or machine-served previews first.
2. Follow-up requests in the first UI pass, as recommended, or later.
3. The trial: three requests, as written, or a token budget.
4. Does the trial include a managed machine. Without one the first run stalls at "Waiting for a machine".
5. The in-app file view for Sydeso-hosted repositories: with the first pass, or clone URL only at first.
