import {
  NotBuiltError,
  type AvailabilityPort,
  type CalendarPort,
  type Clock,
  type TenantDirectoryPort,
  type EventConsumer,
  type EventEnvelope,
  type IdGenerator,
  type InboxPort,
} from "@desk/domain";

export interface MirrorDeps {
  readonly calendar: CalendarPort;
  readonly inbox: InboxPort;
  readonly clock: Clock;
}

/**
 * desk-mirror. Reads InviteParsed. The iCalUID is the dedupe key.
 * A higher SEQUENCE replaces the event. METHOD CANCEL removes it.
 */
export function createMirror(_deps: MirrorDeps): EventConsumer {
  return {
    name: "desk-mirror",
    consumes: ["InviteParsed"],
    async handle() {
      throw new NotBuiltError("desk-mirror", 4);
    },
  };
}

export interface SchedulerDeps {
  readonly availability: AvailabilityPort;
  readonly calendar: CalendarPort;
  readonly inbox: InboxPort;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly tenants: TenantDirectoryPort;
}

export interface Scheduler extends EventConsumer {
  /** Writes the block to the Desk Focus Blocks calendar. */
  confirm(timeBlockId: string): Promise<EventEnvelope<"TimeBlockConfirmed">>;
  reject(timeBlockId: string, reason?: string): Promise<EventEnvelope<"TimeBlockRejected">>;
}

/**
 * desk-scheduler. Reads ItemRouted and the unified calendar.
 * Publishes TimeBlockProposed. Writes a calendar event only after the user confirms.
 */
export function createScheduler(_deps: SchedulerDeps): Scheduler {
  const notBuilt = (): never => {
    throw new NotBuiltError("desk-scheduler", 5);
  };
  return {
    name: "desk-scheduler",
    consumes: ["ItemRouted"],
    handle: async () => notBuilt(),
    confirm: async () => notBuilt(),
    reject: async () => notBuilt(),
  };
}
