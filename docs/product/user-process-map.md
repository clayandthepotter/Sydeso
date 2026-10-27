# Product - User Process Map

Version: 0.1.0
Status: Draft for review
Owner: Product
Last Updated: 2026-10-27

---

# Purpose

This document defines what a person sees, is asked, and is told at every point in the Sydeso platform, in the person's own words. It is the contract the product UI is built against. Every screen, label, button and notification in `apps/web` must trace back to a line in this document, and every question a user could have must be answered here before it is answered in a chat with support.

It covers:

- The principles the interface follows, each tied to a rule.
- The vocabulary the interface uses, and where the system's own vocabulary still appears.
- The screens, and what each one is for.
- Every workflow state: what the user sees, what they are asked, what each answer does, what they are told afterwards, and every edge case.
- The flows that cut across states: first run, inviting someone, connecting a runner, returning from a notification, a viewer's day.
- Notifications and the installable app.
- The copy rules.
- What changes in the current UI.

It does not cover the API, the agent protocol or the data model. Those are in `docs/architecture`. Where this document and `docs/product/mvp-definition.md` describe a different workflow, the workflow implemented in `packages/domain/src/workflow.ts` wins for now; see Assumptions.

---

# Assumptions

- The workflow is the one implemented today: Backlog, Design, Design approval, Development, Automated QA, Manual review, Ready, Released, with Escalated reachable from any working state. Research and PRD gates from the MVP definition are not implemented and are not mapped here. When they land, each gets a row in the per-state map and reuses the approval pattern defined for Design approval.
- Roles are the six in `docs/product/roles-and-permissions.md`: Owner, Admin, Product manager, Engineer, Reviewer, Viewer.
- The remediation cap is the project's `maxRemediationIterations`, default 3.
- A request becomes a run the moment it is submitted. There is no separate Story object in the UI today. If intake conversion lands, the user still sees one thing, the request, and the conversion is an activity line, not a second object.
- The platform is used mostly by one of three people: a founder who may not be technical, a product manager, or an engineer. Everything here is written for the founder; the engineer gets the same screens plus the accordions open by default.

---

# Principles

Each principle produces a rule. The rule is what the UI is checked against.

1. **The user has four questions.** What did I ask for. Where is it. Is anything waiting on me. When is it done. Rule: every screen answers at least one of these in its first line, and Home answers the third before anything else.

2. **Open loops drive attention.** People return to unfinished things and forget finished ones. Rule: Home is an inbox ordered by what needs the user, then what is moving, then what finished. Organizations, workspaces, members and runners live behind Settings.

3. **One decision at a time.** More options means slower, less confident decisions. Rule: a gate shows one binary choice, Approve or Reject, as two buttons of equal weight. Anything else (Escalate, Regenerate) is in an overflow menu on the same row. No gate shows more than two primary buttons.

4. **Waiting is tolerable when work is visible.** Rule: a running step looks like an AI chat session: a status verb, a live timer in h:mm:ss, and a stream of activity lines. Details (diffs, files, command output, artifacts) sit behind accordions with no outline.

5. **Evidence, not assurance.** The user is judging AI output. Rule: an approval screen leads with what was produced, what it will touch and what the agent flagged, in that order, with the full document one click away. No sentence tells the user the output is good; the evidence does or does not.

6. **No dead ends.** Rule: every failure state names the cause in one line and offers at most three actions. Escalated is a page, not a badge.

7. **The first run is the product.** Rule: a new user reaches a submitted request within two minutes of signing up. The organization, workspace and project are created with defaults and renamed later.

8. **Say less.** Rule: no reassurance, no apology, no exclamation marks, no explanation of a thing the user did not ask about. Labels are nouns, buttons are verbs, states are one word where possible. See Copy rules.

9. **Design for returning.** People check status between other things, on a phone, from a notification. Rule: the app installs as a PWA, sends push notifications for the events that need a person, and every notification deep-links to the exact decision.

10. **The system's words stay in the system.** Rule: artifact, workflow run, transition, job and runner appear in the audit log, the API and the activity accordions. They do not appear in a title, a button or a notification.

---

# Vocabulary

| System term | User sees | Where the system term still appears |
|---|---|---|
| Feature | Request | API, audit log |
| Feature request artifact | The request (the text they typed) | Artifacts accordion |
| Workflow run | Not shown. The request *is* the run. | Audit log, activity accordion as "run 7fcabbfc" |
| Workflow state | Status | Nowhere else |
| Transition | The status changing; an activity line "Moved to Building" | Audit log |
| Job | An agent working; "Architect · working · 4:12" | Activity accordion |
| Runner | Machine | Settings → Machines; "Waiting for a machine" |
| Artifact | Document, or by its type: Design, Code, Test results | Artifacts accordion, artifact pages |
| Design package | Design | Artifact page |
| Implementation package | Code changes | Artifact page |
| QA report | Test results | Artifact page |
| Agent type (architect, developer, qa) | Architect, Developer, Tester | Activity lines |
| Remediation | Fix attempt, "Fix attempt 2 of 3" | Audit log |
| Escalated | Needs you | Audit log |
| Organization / Workspace / Project | Shown only in Settings and in the project switcher. A new user never types them. | Settings |

Status labels, in the user's words. The short label is for lists and notifications; the long line is for the request page.

| State | Short label | Long line |
|---|---|---|
| backlog | Submitted | Submitted. Starts when you press Start, or automatically if auto-start is on. |
| design | Designing | The Architect is writing the technical design. |
| design_approval | Approve design | The design is ready. Approve it to start building. |
| development | Building | The Developer is writing the code. |
| automated_qa | Testing | The Tester is running the checks. |
| manual_review | Approve result | The checks passed. Review the result to finish. |
| ready | Ready | Done. The pull request is open. |
| released | Released | Merged and released. |
| escalated | Needs you | Stopped. See why below. |

Two lists on Home use these labels directly: "Waiting on you" holds Approve design, Approve result and Needs you. "In progress" holds Designing, Building and Testing. Everything else is "Done" or "Not started".

---

# The four questions, answered

| Question | Where it is answered |
|---|---|
| What did I ask for | The request page title and the request text, always at the top, never collapsed. |
| Where is it | The status line under the title, with the step indicator (nine steps, current one lit). |
| Is anything waiting on me | Home, first group. A badge on the app icon and on the Home nav item with the count. A push notification when it becomes true. |
| When is it done | The timer on the running step and the typical duration beside it: "Designing · 4:12 · usually 5 to 10 min". When the run is complete, the date. |

---

# Screen map

## Home

The first screen after sign-in. One column, three groups, each a list of request rows.

- **Waiting on you** (count in the heading). Requests in Approve design, Approve result or Needs you. Row: status glyph, title, status label, how long it has been waiting. Click goes to the decision, scrolled into view.
- **In progress.** Requests in Designing, Building or Testing. Row: status glyph, title, status label, live timer. The timer ticks.
- **Recent.** Requests that reached Ready, Released or were stopped in the last 14 days. Row: title, final status, date.

Above the groups: the project switcher if the user has more than one project, and the one primary button, New request. Below the groups: nothing.

If all three groups are empty: the New request form itself, inline, with one line above it: "Describe what you want built." No illustration, no tour.

## Request

One page per request. Two columns on desktop, one on a phone.

**Main column, top to bottom:**

1. Title. Status line beneath it: status glyph, short label, timer if running, typical duration if known.
2. The request text, as typed. Never collapsed.
3. The step indicator: the existing PCB trace, nine nodes, lit through the current one. Escalated hangs off the current node in red when active.
4. The session. This is the body of the page and behaves like an AI chat transcript, read top to bottom, newest at the bottom, auto-scrolled while running.

**The session** is a sequence of blocks, one per step the run has been through. Each block has:

- A header row: agent name or "You", the step label, the duration (final for finished steps, ticking for the current one). Example: "Architect · Designing · 7:41".
- Activity lines beneath it, one per thing that happened, in plain words: "Read 14 files in `apps/web`", "Wrote the technical design", "Ran `pnpm test`, 112 passed". Lines arrive live during the step.
- Accordions, with no border and no background, a chevron and a label only, collapsed by default for the founder and open by default for engineers (a per-user preference): Files changed (diff), Commands run (output), Documents produced (artifact list), Raw log.
- For a gate block: the decision row (see per-state map) and, once decided, who decided, when, and the reason if one was given.

A finished step collapses to its header row and a one-line summary. The current step is expanded. The blocks are not cards; they are separated by whitespace and a hairline.

**Side column:** the properties panel as built today, with the system identifiers (run id, request id, checksum) moved to the bottom under an accordion labelled Details.

**Primary action** lives in the current step's block, never in the page header. The header carries only the overflow menu: Stop this request, Copy link, Open in GitHub (when a branch exists).

## New request

One text area, "Describe what you want built", and the project if the user has more than one. One button, Submit. Below the button, one line: "Starts designing right away" or "Waits in Submitted until you press Start", depending on the project's auto-start setting. Nothing else on the page.

Title is derived from the first line of the text, editable later. The user is not asked for a title.

## Project

Reached from the project switcher. Lists every request in the project, grouped by status in the order of the workflow, with the board view behind the segmented control as built. A project has a Settings tab: name, repository, branch, auto-start, fix attempts (default 3), which machine pool to use.

## Settings

Behind the gear in the sidebar footer. Tabs: Account, Organization (name, plan), Members, Machines, Audit log. Workspaces appear only if the organization has more than one; the first workspace is created silently and named after the organization.

---

# Per-state map

For each state: what the user sees, what the system is doing, what the user is asked, what each answer does and whether it can be undone, what the user is told afterwards, who is notified, who can act and what everyone else sees, and the edge cases. The transition rules referenced are the ones in `packages/domain/src/workflow.ts`.

## Submitted (backlog)

| | |
|---|---|
| Sees | Status "Submitted". If auto-start is on, this state lasts under a second and is never seen. If off: one button, Start. |
| System | Nothing. The feature request artifact exists. |
| Asked | Start? One button. |
| Start does | Moves to Designing and queues an Architect job. Cannot be undone, but the request can be stopped from any state. |
| Told after | The Designing block appears with the timer at 0:00. |
| Notified | No one. |
| Who can act | Product manager, Engineer, Admin, Owner. Reviewer and Viewer see the status and no button. |

Edge cases:

- No machine is online that has the Architect's required capabilities. Start is still allowed. The Designing block shows "Waiting for a machine" with the timer running and one line: "No machine is online. Connect one in Settings → Machines." with a link. The job stays queued. When a machine appears the line is replaced by activity.
- The project has no repository. Start is allowed for design (the Architect can design without code) and the Build step will refuse later. Better: the New request form shows "No repository connected. Design will run; building needs one." and a link to project settings. Decision needed: block at submit or warn and allow. This document says warn and allow.

## Designing (design)

| | |
|---|---|
| Sees | Status "Designing · 4:12 · usually 5 to 10 min". The Designing block, expanded, activity lines arriving. |
| System | The Architect job runs on a machine. It produces a design package. |
| Asked | Nothing. The overflow menu has Stop. |
| Stop does | Cancels the job and moves the request to Needs you with the reason "Stopped by [name]". Cannot be undone; the user can start again from Needs you, which runs the Architect from scratch. |
| Told after | On completion the block collapses to "Architect · Designed · 7:41" and the Approve design block appears. |
| Notified | The requester and every member who can approve designs: "Design ready: [title]". |
| Who can act | Same as Submitted. |

Typical duration comes from the project's last ten completed Design steps; before there are three, the line reads "first run, no estimate".

Edge cases:

- Job fails (agent error, machine lost). The run moves to Needs you with the error in one line and the raw error under an accordion. See Needs you.
- Job runs past twice the typical duration. The status line gains "longer than usual" and nothing else changes. At four times, the run moves to Needs you with "Took too long. Stopped after 41:00." Decision needed: the multiplier.
- Machine goes offline mid-job. Same as job fails, reason "Machine [name] went offline".
- The design package is produced but is empty or fails validation. Same as job fails, reason "The design was empty".

## Approve design (design_approval)

This is the most important screen in the product. The user is judging a document they did not write about code they may not read.

| | |
|---|---|
| Sees | Status "Approve design". The Approve design block, expanded, containing in order: a summary (the design package's own summary field, five lines at most), what it will touch (the list of areas or files the design names), what the Architect flagged (risks, open questions, assumptions), then an accordion "Full design" holding the whole document, then the decision row. |
| System | Waiting. No job. |
| Asked | Approve or Reject. Two buttons, equal weight, side by side. Beneath them one optional field, "Note", single line, that is recorded with the decision. The overflow menu has Regenerate design and Escalate. |
| Approve does | Moves to Building and queues a Developer job. Needs a machine with git, filesystem, terminal and node. Cannot be undone; the request can be stopped during Building. The button is labelled Approve, and under it in the muted size: "Starts building on branch `sydeso/[slug]`". That is the only consequence line. |
| Reject does | Moves back to Designing and queues the Architect again with the note as additional input. The note is required for Reject; the field label changes to "What should change" and the button is disabled until it has text. Cannot be undone, but costs only a new design. |
| Regenerate does | Same transition as Reject without a note. Kept in the overflow because Reject with a note produces better designs. |
| Escalate does | Moves to Needs you with the reason "Escalated by [name]: [note]". Used when the user wants a person to look before anything runs. |
| Told after | Approve: the block collapses to "You · Approved · [time]" and the Building block appears. Reject: "You · Asked for changes · [note]" and a new Designing block appears. |
| Notified | On Approve: the requester if different from the approver. On Reject: no one. |
| Who can act | Engineer, Product manager, Admin, Owner. Reviewer and Viewer see the same block with the decision row replaced by "Waiting for [list of who can approve]". |

Edge cases:

- Two people approve within the same second. The second receives "Already approved by [name]" inline and the page refreshes. The API already rejects the second transition; the UI must show the reason, not an error code.
- Someone approves while someone else is typing a rejection note. Same handling on submit.
- The approver is also the requester. Allowed. Nothing special is shown.
- The design was rejected three times. No cap. A counter appears in the block header after the second, "3rd design". No warning text.
- The approver wants to edit the design rather than reject it. Not supported in this version. The overflow menu does not offer it; the Note field is where the change goes. When artifact drafts land, Edit joins the overflow.
- No machine online with build capabilities at the moment of Approve. Approve still succeeds. The Building block shows "Waiting for a machine" as in Submitted.

## Building (development)

| | |
|---|---|
| Sees | Status "Building · 12:07 · usually 15 to 40 min". The Building block with activity lines such as "Created branch `sydeso/kanban-board`", "Changed 9 files", "Ran `pnpm typecheck`", and the Files changed accordion filling in as the diff grows. If this is a fix attempt: the header reads "Developer · Fix attempt 2 of 3". |
| System | The Developer job runs. Produces an implementation package and a branch. |
| Asked | Nothing. Overflow: Stop. |
| Stop does | Cancels the job, keeps the branch as it is, moves to Needs you with "Stopped by [name]". |
| Told after | Block collapses to "Developer · Built · 23:50 · 9 files" and the Testing block appears. |
| Notified | No one. Building flows into Testing without a person. |
| Who can act | Same as Submitted. |

Edge cases:

- Repository access was revoked or the token expired. Job fails, reason "Could not reach the repository. Check the connection in project settings." with the link. Needs you.
- The branch already exists from an earlier attempt. The Developer reuses it; the activity line says so. No user action.
- Merge conflict with the default branch. The Developer resolves it as part of the job; if it cannot, job fails with "Could not merge with `main`" and the raw git output under an accordion.
- Agent produces no code changes. Treated as a failure: "No changes were made" and Needs you.

## Testing (automated_qa)

| | |
|---|---|
| Sees | Status "Testing · 3:15 · usually 5 to 15 min". The Testing block with lines such as "Ran 112 unit tests, 112 passed", "Ran 8 browser tests, 7 passed", "Checked accessibility on 4 pages". A Commands run accordion with output and a Screenshots accordion. |
| System | The Tester job runs. Produces a QA report with a pass or fail verdict. |
| Asked | Nothing. Overflow: Stop. |
| Told after, pass | Block collapses to "Tester · Passed · 112 of 112". The Approve result block appears. |
| Told after, fail, attempts remaining | Block collapses to "Tester · Failed · 3 of 112 failed". A new Building block appears headed "Developer · Fix attempt 1 of 3", with the failures listed as its first activity lines. |
| Told after, fail, attempts exhausted | Block collapses to "Tester · Failed · 3 of 112 failed". The request moves to Needs you with "Tests still failing after 3 fix attempts". |
| Notified | Pass: everyone who can approve results. Fail with attempts remaining: no one. Attempts exhausted: the requester and project admins, "Needs you: [title]". |
| Who can act | Same as Submitted. |

Edge cases:

- The tests cannot run at all (missing dependency, environment broken). Distinguished from failing tests: reason "Tests could not run" with the output, and it counts as a fix attempt only if the Developer can fix it; decision needed. This document says it counts.
- A flaky test fails once and passes on the fix attempt with no code change. Shown honestly: "Fix attempt 1 of 3 · no changes needed · Tester · Passed". No commentary.
- The fix loop keeps changing the same file back and forth. The cap stops it. Nothing in the UI detects it.

## Approve result (manual_review)

| | |
|---|---|
| Sees | Status "Approve result". The block contains in order: the verdict in numbers ("112 of 112 tests passed · 4 pages checked · 9 files changed"), the screenshots inline as a strip, the Files changed accordion, the Test results accordion, "Open the pull request" as a link if one exists or "Open the branch", then the decision row. |
| System | Waiting. |
| Asked | Approve or Reject. Same row as Approve design. Overflow: Escalate. |
| Approve does | Moves to Ready. Cannot be undone; it is the end of the run. Under the button: "Marks the pull request ready for review". |
| Reject does | Moves back to Building with the note as the Developer's instruction. Note required. Does not count against the fix attempt cap, because a person asked for it. |
| Told after | Approve: "You · Approved · [time]", the Ready block appears. Reject: a new Building block. |
| Notified | Approve: the requester if different. |
| Who can act | Reviewer, Engineer, Admin, Owner. Product manager and Viewer see "Waiting for [list]". |

Edge cases:

- The reviewer wants to test it themselves. The branch link is there. The decision can wait indefinitely; the row shows how long it has been waiting on Home.
- The reviewer approves without opening anything. Allowed. The audit log records that no accordion was opened. Decision needed: whether to show this to anyone.
- Someone pushes to the branch by hand. The UI does not notice. Decision needed for later: re-run tests on external pushes.

## Ready (ready)

| | |
|---|---|
| Sees | Status "Ready". The Ready block: "Done. Pull request #41 is open." with the link as the one button, Open pull request. Below it: what was built, in the Developer's own summary, and the total time from submit to ready. |
| System | Nothing. Released is set when the pull request is merged, if the GitHub integration reports it; otherwise there is a Mark released item in the overflow. |
| Asked | Nothing. |
| Notified | The requester: "Ready: [title]". |

This is the moment the person remembers. It is quiet: one line, one link, the numbers. No animation beyond the trace node lighting.

## Released (released)

| | |
|---|---|
| Sees | Status "Released" with the merge date. The page is otherwise unchanged. |
| Asked | Nothing. The request drops out of Recent after 14 days and lives in the project list. |

## Needs you (escalated)

The only state where the page changes shape. The step indicator lights the escalated node in red. The top block is the Needs you block, above the session, not at its end.

| | |
|---|---|
| Sees | One line with the cause, in these fixed forms: "Stopped by [name]", "Escalated by [name]: [note]", "Tests still failing after 3 fix attempts", "The [Architect/Developer/Tester] failed: [one-line error]", "Machine [name] went offline during [step]", "Took too long. Stopped after [time]", "Could not reach the repository", "No changes were made". Under it, an accordion with the raw detail. |
| Asked | At most three buttons, chosen by cause: |

| Cause | Buttons |
|---|---|
| Stopped by a person, or escalated | Start again from [last step] · Close request |
| Agent failed, machine lost, took too long | Try again · Close request |
| Tests still failing | Open the branch (fix by hand, then) Run tests again · Approve anyway · Close request |
| Could not reach the repository | Fix the connection (link to settings) · Try again |
| No changes were made | Reject with a note (sends the Developer a new instruction) · Close request |

Approve anyway moves to Ready and is recorded as "Approved with failing tests by [name]". It exists because the alternative is a request stuck forever.

Close request marks the run cancelled, keeps everything, and removes it from Home. It cannot be reopened in this version; the user submits a new request. Decision needed: allow reopen.

| | |
|---|---|
| Notified | On entering Needs you: the requester and project admins, by push and email. |
| Who can act | Engineer, Product manager, Admin, Owner. |

---

# Cross-cutting flows

## First run

1. Sign up: name, email, password. One screen.
2. Immediately after: "Connect a repository" with the GitHub button and a Skip link. On skip, the project is created without one and the New request form notes it.
3. Immediately after: the New request form, with a muted example beneath the text area ("Add a dark mode toggle to the settings page").
4. On submit: the request page, with the Designing block running or the Start button, depending on the default. The default for a new account is auto-start on.

The organization is created with the user's name, the workspace is created with the organization's name, the project is created from the repository name or "First project". None of this is shown. All of it is renameable in Settings.

What the first run skips and when it comes back:

- No machine is connected. The first request's Designing block shows "Waiting for a machine" with the link. Accounts on a plan with a managed machine never see this.
- No API key. Decision needed: BYO keys are in the pricing model. If required, the form at step 3 asks for it with one line on where to get it, and the request cannot be submitted without one.
- No teammates. Nothing prompts for them. Members is in Settings.

## Inviting someone

Settings → Members → Invite: email and role. The role picker shows what each role can do in one line each: "Reviewer: approves results, cannot start or stop requests." The invite is a link the inviter sends themselves. The invitee signs up with the invited email and lands on Home for that organization.

## Connecting a machine

Settings → Machines → Add: name, and the install command shown once with the token inside it. One line: "Run this on the machine. It appears here when it connects." The row shows Online, Busy or Offline with the last-seen time. No other configuration is exposed.

## Returning from a notification

Every notification deep-links to the request page with the relevant block scrolled into view and, for gates, the decision row focused. If the decision was already made by someone else, the block shows who and when; no error.

## A viewer's day

A Viewer sees Home with the same three groups and no buttons anywhere. Decision rows read "Waiting for [names]". The overflow menu has Copy link only. The New request button is absent.

## On a phone

One column. The step indicator becomes the vertical trace already built for the marketing site. Accordions stay collapsed. The decision row is sticky at the bottom of the screen while its block is in view. The properties panel moves under the session behind a Details accordion.

---

# Edge-case register

Conditions that are not tied to one state. Each has what the user sees, the options, and the outcome.

| Condition | User sees | Options | Outcome |
|---|---|---|---|
| Session expired while on a request page | The page, dimmed, with a Sign in button in place of the decision row. The draft note is kept in local storage. | Sign in | Returns to the same place with the note restored. |
| Offline (PWA) | Home from cache with a one-line banner "Offline. Showing the last update from [time]". Buttons disabled. | None | Reconnects silently. |
| Role removed while viewing | Next action returns "You no longer have access to this project". | Back to Home | Home reloads for the roles that remain. |
| Request deleted or project archived | "This request was closed" with the final status. | Back to Home | None. |
| Two tabs open on the same request | Both update live. A decision in one appears in the other within a second. | None | The second decision is refused with the name of who decided. |
| Push notifications denied by the browser | Nothing in the app. Settings → Account → Notifications shows "Blocked in your browser" with the browser's own instructions linked. | Email stays on | Email is the fallback for every push. |
| The user submits an empty or one-word request | Submit is disabled until the text is at least one sentence. No message until they try. | Write more | None. |
| The user submits a request that is a question, not work | The Architect answers it in the design summary and produces an empty plan; Approve design shows "Nothing to build" with Close request. | Close | Decision needed: detect at intake instead. |
| The user wants to change the request text after submit | Not supported mid-run. The overflow has Stop; a new request is the path. | Stop, resubmit | Decision needed: allow edit in Submitted only. |
| Plan limit reached (machines, requests) | The action that would exceed it is replaced by a line naming the limit and a link to the plan. | Upgrade | None. |
| Agent provider outage (API keys invalid, quota exhausted) | Job fails with "The AI provider refused the request: [provider's message]" and Needs you. | Fix the key in Settings · Try again | None. |

---

# Notifications and the installable app

## Events that notify

Only events that need a person or close a loop a person opened.

| Event | Who | Push | Email | Text |
|---|---|---|---|---|
| Design ready | Everyone who can approve designs | Yes | Yes | Design ready: [title] |
| Result ready | Everyone who can approve results | Yes | Yes | Review: [title] |
| Needs you | Requester, project admins | Yes | Yes | Needs you: [title] · [cause] |
| Ready | Requester | Yes | Yes | Ready: [title] |
| Approved or rejected by someone else | Requester | Yes | No | [Name] approved the design for [title] |
| Waiting on you for 24 hours | The people it waits on | Yes | Yes | Still waiting: [title] |

No notification for Building, Testing, fix attempts, or anything an agent does. No daily digest in this version.

## Push opt-in

The browser prompt is asked once, at the first moment it has value: when the user's first request enters Designing, the request page shows one line under the status, "Get notified when the design is ready", with a Turn on button. Pressing it triggers the browser prompt. Dismissing it hides the line for that account. It is never asked at sign-up.

## Installable app (PWA)

- A web manifest with the mark, the name Sydeso, standalone display, the lime theme colour and the near-black background.
- A service worker that caches the shell and the last Home response for offline viewing, and receives push.
- Push through the Web Push protocol with VAPID keys held server-side; subscriptions stored per user and device.
- iOS requires the app to be added to the Home Screen before push is available. The "Turn on" line on iOS Safari says "Add Sydeso to your Home Screen first" with the share-sheet instruction, in one line.
- The badge API sets the app icon count to the size of Waiting on you.
- Deep links from notifications open inside the installed app.

Email remains on by default for every push event and is the fallback where push is blocked.

---

# Copy rules

- Buttons are verbs: Approve, Reject, Start, Stop, Try again, Open pull request. Never "Approve → Development".
- Decisions are binary and the two options have equal visual weight. A third option goes in the overflow.
- No reassurance. Not "Don't worry, your work is safe." Say what is true: "Kept the branch."
- No apology. Not "Sorry, something went wrong." Say what happened: "The Developer failed: [error]".
- No exclamation marks, no emoji, no "successfully", no "please".
- One consequence line under a button, only where the consequence is not obvious from the verb. "Starts building on branch `sydeso/kanban-board`." Nothing under Reject.
- Numbers over adjectives. "112 of 112 passed", not "All tests passed".
- Time as the user reads it: a live timer in h:mm:ss or m:ss while running, "7:41" when done, a relative time ("2 hours ago") for events, the date for anything older than two days.
- Agents are named by role, capitalised: Architect, Developer, Tester. Never "AI", never "the agent".
- Status labels are one or two words. The long line is only on the request page.
- The user is "you". Other people are named. The system is not referred to at all; things happen or the named agent does them.

Examples:

| Before | After |
|---|---|
| Your design has been generated successfully and is ready for your review! | Design ready. |
| Please note that approving will start the development job on an available runner. | Starts building on branch `sydeso/kanban-board`. |
| Oops, the QA agent encountered an error. | The Tester failed: `playwright` is not installed on this machine. |
| Remediation 2 | Fix attempt 2 of 3 |
| No workflow run exists for this feature. | Not started. |

---

# What changes in the current UI

Against what is on `main` today, in priority order:

1. Home becomes the inbox. The organization list moves to Settings. The project switcher replaces the organization switcher in the sidebar.
2. The request page body becomes the session, with blocks, activity lines, timers and borderless accordions. Transitions and Jobs panels are removed; their content is the session.
3. The transition panel becomes the decision row: Approve and Reject with an optional or required note, overflow for the rest. The current panel listing every legal transition is removed.
4. Status labels and the vocabulary table are applied everywhere: nav, rows, badges, notifications.
5. New request becomes one text area with no title field.
6. Sign-up flows into repository connection and the first request. Organization, workspace and project are created silently.
7. Needs you becomes a page section with cause and buttons.
8. Push notifications, email notifications and the PWA manifest, service worker and badge.
9. Settings gathers Organization, Members, Machines, Audit log.
10. Typical durations are computed from past runs and shown beside timers.

Items 1 to 5 are UI only. Items 6 to 10 need API work: default hierarchy on sign-up, a live activity stream per job, notification delivery, duration statistics.

---

# Open questions for review

1. Auto-start on by default for new accounts, so Submitted is never seen. Yes or no.
2. A request with no repository: warn and allow design, or block at submit.
3. The "took too long" multiplier before a step is stopped. Proposed: four times the typical duration, minimum 30 minutes.
4. Tests that cannot run at all: counts as a fix attempt, or not.
5. Approve anyway on failing tests: keep, or require Escalate to a human with Owner role.
6. Close request is final, or a closed request can be reopened.
7. Record and show when a reviewer approved without opening any evidence. Proposed: record, do not show.
8. BYO API key required before the first request, or the first request runs on a platform key with a limit.
9. The word for the thing the user submits: Request, as proposed, or keep Feature.
10. The word for runners: Machine, as proposed, or Runner.
