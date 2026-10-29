import { z } from "zod";

/**
 * Value types from the ubiquitous language.
 * Note, Item, Work Item, Time Block, Mirror Event, Review Queue, Brief.
 */

/** The time zone of the one user. All local dates and times use it. */
export const USER_TIME_ZONE = "America/La_Paz";

/** At most this many P1 items can be in Today. */
export const MAX_P1_IN_TODAY = 3;

export const PRIORITIES = ["P1", "P2", "P3"] as const;
export const prioritySchema = z.enum(PRIORITIES);
export type Priority = z.infer<typeof prioritySchema>;

/** The Linear states that Desk uses. */
export const LINEAR_STATES = ["Today", "Next", "Later"] as const;
export const linearStateSchema = z.enum(LINEAR_STATES);
export type LinearState = z.infer<typeof linearStateSchema>;

export const idSchema = z.string().min(1);

/** An instant with an explicit offset, for example 2026-10-30T10:00:00-04:00. */
export const instantSchema = z.iso.datetime({ offset: true });

/** A local calendar date in the user time zone, for example 2026-10-30. */
export const localDateSchema = z.iso.date();

export const confidenceSchema = z.number().min(0).max(1);

/** An Item is one unit of work that triage extracts from a Note. */
export const itemSchema = z.object({
  itemId: idSchema,
  sourceNoteId: idSchema,
  action: z.string().min(1),
  project: z.string().min(1).nullable(),
  dueDate: localDateSchema.nullable(),
  durationMinutes: z.number().int().positive().nullable(),
  priority: prioritySchema,
  confidence: confidenceSchema,
});
export type Item = z.infer<typeof itemSchema>;

/** An Item before triage gives it an ID. This is what the extraction model returns. */
export const extractedItemSchema = itemSchema.omit({ itemId: true, sourceNoteId: true });
export type ExtractedItem = z.infer<typeof extractedItemSchema>;

export const intervalSchema = z.object({ start: instantSchema, end: instantSchema });
export type Interval = z.infer<typeof intervalSchema>;

/** The two calendars that Desk writes. Desk never writes the unified calendar. */
export const DESK_CALENDARS = ["corporate-mirror", "focus-blocks"] as const;
export const deskCalendarSchema = z.enum(DESK_CALENDARS);
export type DeskCalendar = z.infer<typeof deskCalendarSchema>;

export const INVITE_METHODS = ["REQUEST", "CANCEL"] as const;
export const inviteMethodSchema = z.enum(INVITE_METHODS);
export type InviteMethod = z.infer<typeof inviteMethodSchema>;
