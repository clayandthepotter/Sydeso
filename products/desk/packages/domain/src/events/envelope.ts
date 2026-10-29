import { z } from "zod";
import { BOUNDED_CONTEXTS, type BoundedContext } from "../contexts.js";
import { idSchema } from "../model.js";
import type { Clock, IdGenerator } from "../ports.js";
import { EVENT_CATALOG, isEventType, type EventType, type PayloadOf } from "./catalog.js";

/** The envelope that wraps every event. Events are immutable. */
export interface EventEnvelope<T extends EventType = EventType> {
  readonly id: string;
  readonly type: T;
  readonly version: number;
  /** UTC instant in ISO 8601 format. */
  readonly occurredAt: string;
  readonly source: BoundedContext;
  readonly payload: Readonly<PayloadOf<T>>;
  /** The ID of the first event in the chain. */
  readonly correlationId?: string;
  /** The ID of the event that caused this event. */
  readonly causationId?: string;
}

/** A union of all envelopes. Narrow it with the `type` field. */
export type AnyEvent = { [T in EventType]: EventEnvelope<T> }[EventType];

export class EventValidationError extends Error {
  override readonly name = "EventValidationError";

  constructor(readonly errors: readonly string[]) {
    super(`Event is not valid: ${errors.join("; ")}`);
  }
}

export interface CreateEventOptions {
  readonly clock: Clock;
  readonly ids: IdGenerator;
  /** Use this ID instead of a new one. Consumers use it to derive stable IDs. */
  readonly id?: string;
  readonly correlationId?: string;
  readonly causationId?: string;
}

const envelopeShape = z.object({
  id: idSchema,
  type: z.string(),
  version: z.number().int().positive(),
  occurredAt: z.iso.datetime({ offset: true }),
  source: z.enum(BOUNDED_CONTEXTS),
  payload: z.unknown(),
  correlationId: idSchema.optional(),
  causationId: idSchema.optional(),
});

const formatIssues = (prefix: string, error: z.ZodError): string[] =>
  error.issues.map((issue) => {
    const path = [prefix, ...issue.path.map(String)].filter(Boolean).join(".");
    return `${path}: ${issue.message}`;
  });

const deepFreeze = <V>(value: V): V => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
};

/** Makes a new event. The catalog gives the source and version. The payload must match its schema. */
export function createEvent<T extends EventType>(
  type: T,
  payload: PayloadOf<T>,
  options: CreateEventOptions,
): EventEnvelope<T> {
  const entry = EVENT_CATALOG[type];
  const parsed = entry.schema.safeParse(payload);
  if (!parsed.success) throw new EventValidationError(formatIssues("payload", parsed.error));

  const event = {
    id: options.id ?? options.ids.next(),
    type,
    version: entry.version,
    occurredAt: options.clock.now().toISOString(),
    source: entry.source,
    payload: parsed.data as PayloadOf<T>,
    ...(options.correlationId !== undefined && { correlationId: options.correlationId }),
    ...(options.causationId !== undefined && { causationId: options.causationId }),
  };
  return deepFreeze(event);
}

export type ParseEventResult =
  | { readonly ok: true; readonly event: AnyEvent }
  | { readonly ok: false; readonly errors: readonly string[] };

/** Checks unknown input, for example a queue message or a D1 row, and returns a typed event. */
export function parseEvent(input: unknown): ParseEventResult {
  const shape = envelopeShape.safeParse(input);
  if (!shape.success) return { ok: false, errors: formatIssues("", shape.error) };

  const raw = shape.data;
  if (!isEventType(raw.type)) return { ok: false, errors: [`type: unknown event type "${raw.type}"`] };

  const entry = EVENT_CATALOG[raw.type];
  const errors: string[] = [];
  if (raw.version !== entry.version) {
    errors.push(`version: ${raw.type} supports version ${entry.version}, not ${raw.version}`);
  }
  if (raw.source !== entry.source) {
    errors.push(`source: ${raw.type} belongs to ${entry.source}, not ${raw.source}`);
  }
  const payload = entry.schema.safeParse(raw.payload);
  if (!payload.success) errors.push(...formatIssues("payload", payload.error));
  if (errors.length > 0) return { ok: false, errors };

  const event = {
    id: raw.id,
    type: raw.type,
    version: raw.version,
    occurredAt: raw.occurredAt,
    source: raw.source,
    payload: payload.data,
    ...(raw.correlationId !== undefined && { correlationId: raw.correlationId }),
    ...(raw.causationId !== undefined && { causationId: raw.causationId }),
  };
  // The checks above prove that the type, source, and payload agree.
  return { ok: true, event: deepFreeze(event) as unknown as AnyEvent };
}
