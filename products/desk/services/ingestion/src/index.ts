import {
  NotBuiltError,
  type AnyEvent,
  type Clock,
  type DeskConfig,
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
  readonly config: Pick<DeskConfig, "allowedSenders">;
}

export interface EmailWorker {
  /** Returns InviteReceived for an allowed sender, or InviteRejected. */
  receive(email: InboundEmail): Promise<readonly AnyEvent[]>;
}

/** The Email Worker for invites@in.sydeso.com. */
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
  readonly config: Pick<DeskConfig, "timeZone">;
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
