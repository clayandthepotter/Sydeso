import {
  appendOnce,
  type AnyEvent,
  type AppendResult,
  type AvailabilityPort,
  type CalendarEventDraft,
  type CalendarPort,
  type DeskCalendar,
  type EventStorePort,
  type EventType,
  type ExtractedItem,
  type ExtractionPort,
  type ExtractionRequest,
  type InboxPort,
  type Interval,
  type IssueChanges,
  type IssueDraft,
  type IssueQuery,
  type IssueRef,
  type IssueTrackerPort,
  type RawStorePort,
} from "@desk/domain";

/** Returns scripted items for a note text. Unknown text gives no items. */
export class FakeExtraction implements ExtractionPort {
  readonly calls: ExtractionRequest[] = [];
  private readonly responses = new Map<string, readonly ExtractedItem[]>();

  respondTo(text: string, items: readonly ExtractedItem[]): this {
    this.responses.set(text, items);
    return this;
  }

  async extract(request: ExtractionRequest): Promise<readonly ExtractedItem[]> {
    this.calls.push(request);
    return this.responses.get(request.text) ?? [];
  }
}

export interface FakeIssue extends IssueDraft, IssueRef {}

/** An in memory Linear. It creates one issue per idempotency key. */
export class FakeIssueTracker implements IssueTrackerPort {
  readonly issues: FakeIssue[] = [];

  constructor(private readonly projects: readonly string[]) {}

  async listProjects(): Promise<readonly string[]> {
    return this.projects;
  }

  async createIssue(draft: IssueDraft): Promise<IssueRef> {
    if (!this.projects.includes(draft.project)) throw new Error(`Unknown project: ${draft.project}`);
    const existing = this.issues.find((issue) => issue.idempotencyKey === draft.idempotencyKey);
    if (existing) return { issueId: existing.issueId, issueKey: existing.issueKey };

    const number = this.issues.length + 1;
    const issue: FakeIssue = { ...draft, issueId: `issue-${number}`, issueKey: `DESK-${number}` };
    this.issues.push(issue);
    return { issueId: issue.issueId, issueKey: issue.issueKey };
  }

  async updateIssue(issueId: string, changes: IssueChanges): Promise<void> {
    const index = this.issues.findIndex((issue) => issue.issueId === issueId);
    const issue = this.issues[index];
    if (!issue) throw new Error(`Unknown issue: ${issueId}`);
    this.issues[index] = { ...issue, ...changes };
  }

  async countIssues(query: IssueQuery): Promise<number> {
    return this.issues.filter(
      (issue) =>
        (query.state === undefined || issue.state === query.state) &&
        (query.priority === undefined || issue.priority === query.priority),
    ).length;
  }
}

export interface FakeCalendarEvent extends CalendarEventDraft {
  readonly calendarEventId: string;
}

/** An in memory Google Calendar for the two Desk calendars. */
export class FakeCalendar implements CalendarPort {
  private readonly store = new Map<DeskCalendar, FakeCalendarEvent[]>();
  private count = 0;

  events(calendar: DeskCalendar): readonly FakeCalendarEvent[] {
    return this.store.get(calendar) ?? [];
  }

  async upsertEvent(calendar: DeskCalendar, draft: CalendarEventDraft): Promise<{ calendarEventId: string }> {
    const events = [...this.events(calendar)];
    const index = events.findIndex((event) => event.externalKey === draft.externalKey);
    const calendarEventId = events[index]?.calendarEventId ?? `gcal-${++this.count}`;
    const next = { ...draft, calendarEventId };
    if (index >= 0) events[index] = next;
    else events.push(next);
    this.store.set(calendar, events);
    return { calendarEventId };
  }

  async removeEvent(calendar: DeskCalendar, calendarEventId: string): Promise<void> {
    this.store.set(
      calendar,
      this.events(calendar).filter((event) => event.calendarEventId !== calendarEventId),
    );
  }
}

const overlaps = (a: Interval, b: Interval): boolean =>
  Date.parse(a.start) < Date.parse(b.end) && Date.parse(b.start) < Date.parse(a.end);

/** Busy time on the unified calendar. */
export class FakeAvailability implements AvailabilityPort {
  constructor(private busy: readonly Interval[] = []) {}

  setBusy(busy: readonly Interval[]): void {
    this.busy = busy;
  }

  async busyIntervals(range: Interval): Promise<readonly Interval[]> {
    return this.busy.filter((interval) => overlaps(interval, range));
  }
}

/** An append only event log in memory. A duplicate ID is ignored. */
export class InMemoryEventStore implements EventStorePort {
  private log: readonly AnyEvent[] = [];

  async append(event: AnyEvent): Promise<AppendResult> {
    const result = appendOnce(this.log, event);
    this.log = result.log;
    return result.outcome;
  }

  async byType<T extends EventType>(type: T): Promise<ReadonlyArray<Extract<AnyEvent, { type: T }>>> {
    return this.log.filter((event): event is Extract<AnyEvent, { type: T }> => event.type === type);
  }

  async all(): Promise<readonly AnyEvent[]> {
    return this.log;
  }
}

export class InMemoryInbox implements InboxPort {
  private readonly seen = new Set<string>();

  async markProcessed(consumer: string, eventId: string): Promise<boolean> {
    const key = `${consumer}\u0000${eventId}`;
    if (this.seen.has(key)) return false;
    this.seen.add(key);
    return true;
  }
}

/** An in memory R2 bucket. */
export class FakeRawStore implements RawStorePort {
  readonly objects = new Map<string, string>();

  async put(key: string, body: string): Promise<void> {
    this.objects.set(key, body);
  }

  async get(key: string): Promise<string | null> {
    return this.objects.get(key) ?? null;
  }
}
