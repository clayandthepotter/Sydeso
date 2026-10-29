import { z } from "zod";
import type { BoundedContext } from "../contexts.js";
import {
  deskCalendarSchema,
  idSchema,
  instantSchema,
  inviteMethodSchema,
  itemSchema,
  linearStateSchema,
  prioritySchema,
} from "../model.js";

/* Capture */

export const noteCapturedSchema = z.object({
  /** The client sets this ID. The server ignores a duplicate. */
  noteId: idSchema,
  text: z.string().min(1),
  capturedAt: instantSchema,
  deviceId: idSchema.optional(),
});

/* Ingestion */

export const inviteReceivedSchema = z.object({
  emailId: idSchema,
  from: z.email(),
  /** The R2 key of the raw email in desk-raw. */
  rawKey: z.string().min(1),
  receivedAt: instantSchema,
});

export const inviteParsedSchema = z.object({
  emailId: idSchema,
  /** The dedupe key for an invite. */
  icalUid: z.string().min(1),
  sequence: z.number().int().nonnegative(),
  method: inviteMethodSchema,
  /** A short title only. Never copy confidential invite details. */
  title: z.string().min(1),
  /** Converted to the user time zone. */
  start: instantSchema,
  end: instantSchema,
  originalTimeZone: z.string().min(1),
});

export const INVITE_REJECTION_REASONS = ["sender_not_allowed", "parse_failed"] as const;

export const inviteRejectedSchema = z.object({
  emailId: idSchema,
  from: z.string(),
  reason: z.enum(INVITE_REJECTION_REASONS),
  detail: z.string().optional(),
});

/* Triage */

export const itemsExtractedSchema = z.object({
  noteId: idSchema,
  items: z.array(itemSchema),
});

export const itemRoutedSchema = z.object({
  itemId: idSchema,
  noteId: idSchema,
  project: z.string().min(1),
  state: linearStateSchema,
  priority: prioritySchema,
});

export const reviewSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("note"), noteId: idSchema, itemId: idSchema.optional() }),
  z.object({ kind: z.literal("invite"), emailId: idSchema }),
]);

export const REVIEW_REASONS = ["low_confidence", "no_project", "invite_parse_failed", "p1_limit"] as const;

export const itemNeedsReviewSchema = z.object({
  source: reviewSourceSchema,
  reason: z.enum(REVIEW_REASONS),
  item: itemSchema.optional(),
});

/* Planning */

export const workItemCreatedSchema = z.object({
  itemId: idSchema,
  issueId: idSchema,
  issueKey: z.string().min(1),
  project: z.string().min(1),
  state: linearStateSchema,
  priority: prioritySchema,
});

export const workItemUpdatedSchema = z.object({
  issueId: idSchema,
  changes: z
    .object({
      state: linearStateSchema,
      priority: prioritySchema,
      title: z.string().min(1),
    })
    .partial()
    .refine((changes) => Object.keys(changes).length > 0, "changes must not be empty"),
});

/* Scheduling */

export const mirrorEventUpsertedSchema = z.object({
  icalUid: z.string().min(1),
  sequence: z.number().int().nonnegative(),
  calendar: z.literal("corporate-mirror"),
  calendarEventId: idSchema,
  title: z.string().min(1),
  start: instantSchema,
  end: instantSchema,
});

export const mirrorEventRemovedSchema = z.object({
  icalUid: z.string().min(1),
  calendarEventId: idSchema,
});

export const timeBlockProposedSchema = z.object({
  timeBlockId: idSchema,
  itemId: idSchema,
  start: instantSchema,
  end: instantSchema,
});

export const timeBlockConfirmedSchema = z.object({
  timeBlockId: idSchema,
  calendar: deskCalendarSchema.extract(["focus-blocks"]),
  calendarEventId: idSchema,
});

export const timeBlockRejectedSchema = z.object({
  timeBlockId: idSchema,
  reason: z.string().optional(),
});

interface CatalogEntry<S extends z.ZodType> {
  readonly source: BoundedContext;
  readonly version: number;
  readonly schema: S;
}

const entry = <S extends z.ZodType>(source: BoundedContext, version: number, schema: S): CatalogEntry<S> => ({
  source,
  version,
  schema,
});

/**
 * The event catalog. It maps each event type to the context that owns it,
 * the current schema version, and the payload schema.
 * Contexts share these events only. They never share tables.
 */
export const EVENT_CATALOG = {
  NoteCaptured: entry("capture", 1, noteCapturedSchema),
  InviteReceived: entry("ingestion", 1, inviteReceivedSchema),
  InviteParsed: entry("ingestion", 1, inviteParsedSchema),
  InviteRejected: entry("ingestion", 1, inviteRejectedSchema),
  ItemsExtracted: entry("triage", 1, itemsExtractedSchema),
  ItemRouted: entry("triage", 1, itemRoutedSchema),
  ItemNeedsReview: entry("triage", 1, itemNeedsReviewSchema),
  WorkItemCreated: entry("planning", 1, workItemCreatedSchema),
  WorkItemUpdated: entry("planning", 1, workItemUpdatedSchema),
  MirrorEventUpserted: entry("scheduling", 1, mirrorEventUpsertedSchema),
  MirrorEventRemoved: entry("scheduling", 1, mirrorEventRemovedSchema),
  TimeBlockProposed: entry("scheduling", 1, timeBlockProposedSchema),
  TimeBlockConfirmed: entry("scheduling", 1, timeBlockConfirmedSchema),
  TimeBlockRejected: entry("scheduling", 1, timeBlockRejectedSchema),
} as const;

export type EventCatalog = typeof EVENT_CATALOG;
export type EventType = keyof EventCatalog;
export type PayloadOf<T extends EventType> = z.infer<EventCatalog[T]["schema"]>;

export const EVENT_TYPES = Object.keys(EVENT_CATALOG) as EventType[];

export const isEventType = (value: unknown): value is EventType =>
  typeof value === "string" && Object.hasOwn(EVENT_CATALOG, value);
