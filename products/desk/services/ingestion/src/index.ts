import {
  NotBuiltError,
  type AnyEvent,
  type Clock,
  type TenantDirectoryPort,
  type EventConsumer,
  type IdGenerator,
  type InboxPort,
  type PayloadOf,
  type RawStorePort,
} from "@desk/domain";

/** The parts of an Email Workers message that ingestion uses. */
export interface InboundEmail {
  readonly messageId: string;
  readonly from: string;
  readonly to: string;
  readonly raw: string;
}

export interface EmailWorkerDeps {
  readonly rawStore: RawStorePort;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly tenants: TenantDirectoryPort;
}

export interface EmailWorker {
  /** Returns InviteReceived for a sender that the tenant allows, or InviteRejected. */
  receive(email: InboundEmail): Promise<readonly AnyEvent[]>;
}

/** The Email Worker for invites+TOKEN@in.sydeso.com. The token finds the tenant. */
export function createEmailWorker(_deps: EmailWorkerDeps): EmailWorker {
  return {
    async receive() {
      throw new NotBuiltError("desk-ingest email worker", 4);
    },
  };
}

export type ParseInviteResult =
  | { readonly ok: true; readonly invite: Omit<PayloadOf<"InviteParsed">, "emailId"> }
  | { readonly ok: false; readonly detail: string };

/** Parses one .ics file. Converts times to the given time zone. Copies no confidential fields. */
export function parseInvite(_ics: string, _timeZone: string): ParseInviteResult {
  throw new NotBuiltError("desk-ingest invite parser", 4);
}

export interface InviteParserDeps {
  readonly rawStore: RawStorePort;
  readonly inbox: InboxPort;
  readonly clock: Clock;
  readonly tenants: TenantDirectoryPort;
}

/** Reads InviteReceived. Publishes InviteParsed, or InviteRejected on a parse failure. */
export function createInviteParser(_deps: InviteParserDeps): EventConsumer {
  return {
    name: "desk-ingest-parser",
    consumes: ["InviteReceived"],
    async handle() {
      throw new NotBuiltError("desk-ingest invite parser", 4);
    },
  };
}
