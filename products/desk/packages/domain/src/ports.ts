import type { AnyEvent } from "./events/envelope.js";
import type { EventType } from "./events/catalog.js";
import type { DeskCalendar, ExtractedItem, Interval, LinearState, Priority } from "./model.js";

/**
 * Ports. Domain logic depends on these interfaces only.
 * Adapters (Claude, Linear, Google Calendar, D1) live in the services.
 * Fakes for tests live in @desk/testing.
 */

/** Gives the current time. Tests use a fixed clock. */
export interface Clock {
  now(): Date;
}

/** Gives new unique IDs. */
export interface IdGenerator {
  next(): string;
}

/* Extraction (Claude through AI Gateway) */

export interface ExtractionRequest {
  readonly noteId: string;
  readonly text: string;
  /** The instant the note was captured. Relative dates such as "Friday" resolve from it. */
  readonly capturedAt: string;
  readonly timeZone: string;
  /** The Linear projects the model can route to. */
  readonly projects: readonly string[];
}

export interface ExtractionPort {
  extract(request: ExtractionRequest): Promise<readonly ExtractedItem[]>;
}

/* Issue tracker (Linear) */

export interface IssueDraft {
  /** A stable key, so a retry does not make a second issue. */
  readonly idempotencyKey: string;
  readonly title: string;
  readonly project: string;
  readonly state: LinearState;
  readonly priority: Priority;
  readonly dueDate: string | null;
}

export interface IssueRef {
  readonly issueId: string;
  readonly issueKey: string;
}

export interface IssueChanges {
  readonly title?: string;
  readonly state?: LinearState;
  readonly priority?: Priority;
}

export interface IssueQuery {
  readonly state?: LinearState;
  readonly priority?: Priority;
}

/** The Linear projects that triage can route to. */
export interface ProjectDirectoryPort {
  listProjects(): Promise<readonly string[]>;
}

export interface IssueTrackerPort extends ProjectDirectoryPort {
  createIssue(draft: IssueDraft): Promise<IssueRef>;
  updateIssue(issueId: string, changes: IssueChanges): Promise<void>;
  countIssues(query: IssueQuery): Promise<number>;
}

/* Calendar writes (Google Calendar) */

export interface CalendarEventDraft {
  /** A stable key, for example the iCalUID or the time block ID. */
  readonly externalKey: string;
  /** A short title or "Busy". Never confidential details. */
  readonly title: string;
  readonly start: string;
  readonly end: string;
}

export interface CalendarPort {
  /** Creates the event, or replaces the event with the same external key. */
  upsertEvent(calendar: DeskCalendar, draft: CalendarEventDraft): Promise<{ readonly calendarEventId: string }>;
  removeEvent(calendar: DeskCalendar, calendarEventId: string): Promise<void>;
}

/* Availability (reads the unified Google calendar) */

export interface AvailabilityPort {
  busyIntervals(range: Interval): Promise<readonly Interval[]>;
}

/* Raw storage (R2 desk-raw) */

export interface RawStorePort {
  put(key: string, body: string): Promise<void>;
  get(key: string): Promise<string | null>;
}

/* Event store (D1 desk-events) */

export type AppendResult = "appended" | "duplicate";

/** The append only event log. A duplicate ID is ignored, not an error. */
export interface EventStorePort {
  append(event: AnyEvent): Promise<AppendResult>;
  byType<T extends EventType>(type: T): Promise<ReadonlyArray<Extract<AnyEvent, { type: T }>>>;
  all(): Promise<readonly AnyEvent[]>;
}

/** Records which event IDs a consumer has processed. */
export interface InboxPort {
  /** Returns true the first time, and false for a repeat delivery. */
  markProcessed(consumer: string, eventId: string): Promise<boolean>;
}

/**
 * A context that reacts to events. A queue consumer Worker wraps it.
 * It returns the events it publishes. One message per step keeps CPU time small.
 */
export interface EventConsumer {
  readonly name: string;
  readonly consumes: readonly EventType[];
  handle(event: AnyEvent): Promise<readonly AnyEvent[]>;
}
