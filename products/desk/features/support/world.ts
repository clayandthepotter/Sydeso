import { createInviteParser, createEmailWorker } from "@desk/ingestion";
import { createPlanner } from "@desk/planning";
import { createMirror, createScheduler } from "@desk/scheduling";
import { createTriage } from "@desk/triage";
import {
  USER_TIME_ZONE,
  createEvent,
  type TenantSettings,
  type EventConsumer,
  type EventEnvelope,
  type PayloadOf,
} from "@desk/domain";
import {
  FakeAvailability,
  FakeCalendar,
  FakeExtraction,
  FakeIssueTracker,
  FakeRawStore,
  FakeTenantDirectory,
  FixedClock,
  InMemoryBus,
  InMemoryEventStore,
  InMemoryInbox,
  SequentialIds,
  loadInviteFixture,
} from "@desk/testing";

/** A synthetic tenant for the scenarios. Real settings come from the identity tables. */
export const SCENARIO_TENANT: TenantSettings = {
  tenantId: "tenant-a",
  timeZone: USER_TIME_ZONE,
  confidenceThreshold: 0.7,
  allowedSenders: ["clayton@corp.example"],
  inviteAddressToken: "k7m2q9",
};

/** A second tenant. Scenarios use it to prove isolation. */
export const OTHER_TENANT: TenantSettings = {
  tenantId: "tenant-b",
  timeZone: "America/New_York",
  confidenceThreshold: 0.7,
  allowedSenders: ["someone@elsewhere.example"],
  inviteAddressToken: "p3x8w1",
};

export const SCENARIO_PROJECTS = ["Client Work", "Sydeso", "Operations", "Personal"];

/** Wednesday 2026-10-28 at 09:00 in La Paz. */
export const SCENARIO_NOW = "2026-10-28T09:00:00.000-04:00";

/**
 * One fresh world per scenario. It wires the real services to fakes.
 * Each scenario picks the consumers it needs, so an unbuilt context
 * does not break the scenarios of another context.
 */
export function createWorld() {
  const clock = new FixedClock(SCENARIO_NOW);
  const ids = new SequentialIds("evt");
  const store = new InMemoryEventStore();
  const inbox = new InMemoryInbox();
  const extraction = new FakeExtraction();
  const issueTracker = new FakeIssueTracker(SCENARIO_PROJECTS);
  const calendar = new FakeCalendar();
  const availability = new FakeAvailability();
  const rawStore = new FakeRawStore();
  const tenant = SCENARIO_TENANT;
  const tenants = new FakeTenantDirectory([SCENARIO_TENANT, OTHER_TENANT]);

  const services = {
    triage: createTriage({ extraction, projects: () => issueTracker, inbox, clock, tenants }),
    planner: createPlanner({ issueTracker: () => issueTracker, inbox, clock }),
    parser: createInviteParser({ rawStore, inbox, clock, tenants }),
    mirror: createMirror({ calendar, inbox, clock }),
    scheduler: createScheduler({ availability, calendar, inbox, clock, ids: new SequentialIds("tb"), tenants }),
    emailWorker: createEmailWorker({ rawStore, clock, ids, tenants }),
  };

  const busFor = (...consumers: EventConsumer[]) => new InMemoryBus(store, consumers);

  const event = <T extends Parameters<typeof createEvent>[0]>(type: T, payload: PayloadOf<T>): EventEnvelope<T> =>
    createEvent(type, payload, { clock, ids, tenantId: tenant.tenantId });

  /** An InviteParsed event built from an invite fixture. */
  const inviteParsed = (fixtureName: string, emailId: string) => {
    const { expected } = loadInviteFixture(fixtureName);
    if (expected.outcome !== "parsed") throw new Error(`Fixture ${fixtureName} is not a parsed invite`);
    return event("InviteParsed", { emailId, ...expected.invite });
  };

  return {
    clock,
    ids,
    store,
    inbox,
    extraction,
    issueTracker,
    calendar,
    availability,
    rawStore,
    tenant,
    tenants,
    ...services,
    busFor,
    event,
    inviteParsed,
  };
}

export type World = ReturnType<typeof createWorld>;
