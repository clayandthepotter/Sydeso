import {
  createEvent,
  noteCapturedSchema,
  noteEventId,
  type AnyEvent,
  type AppendResult,
  type Clock,
  type RawStorePort,
} from "@desk/domain";

/** A row of the notes read model. Capture owns it. */
export interface NoteView {
  readonly noteId: string;
  readonly text: string;
  readonly capturedAt: string;
  readonly deviceId: string | null;
}

/** The notes read model, scoped to one tenant. */
export interface NotesReadModel {
  /** Adds the note. A note that exists does not change, because notes are immutable. */
  add(note: NoteView & { readonly rawKey: string; readonly lastEventId: string }): Promise<void>;
  list(limit: number): Promise<readonly NoteView[]>;
}

export interface CaptureDeps {
  readonly tenantId: string;
  /**
   * Stores the events and sends them to their subscribers. It returns one result per event.
   * It sends a duplicate again, so a retry after a failed send reaches triage.
   */
  readonly publish: (events: readonly AnyEvent[]) => Promise<readonly AppendResult[]>;
  readonly notes: NotesReadModel;
  readonly raw: RawStorePort;
  readonly clock: Clock;
}

/** The client sends this. The client sets the note ID. */
export interface CaptureNoteCommand {
  readonly noteId: string;
  readonly text: string;
  readonly capturedAt: string;
  readonly deviceId?: string;
}

export class InvalidNoteError extends Error {
  override readonly name = "InvalidNoteError";

  constructor(readonly errors: readonly string[]) {
    super(`Note is not valid: ${errors.join("; ")}`);
  }
}

export interface CaptureService {
  /** Stores a NoteCaptured event. A duplicate note ID gives "duplicate" and changes nothing. */
  captureNote(command: unknown): Promise<AppendResult>;
  listNotes(limit: number): Promise<readonly NoteView[]>;
}

export const rawNoteKey = (tenantId: string, noteId: string) => `notes/${tenantId}/${noteId}.json`;

export function createCapture(deps: CaptureDeps): CaptureService {
  return {
    async captureNote(command) {
      const parsed = noteCapturedSchema.safeParse(command);
      if (!parsed.success) {
        throw new InvalidNoteError(parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`));
      }
      const payload = parsed.data;
      const rawKey = rawNoteKey(deps.tenantId, payload.noteId);
      const eventId = noteEventId(deps.tenantId, payload.noteId);

      // Each step is safe to repeat. A retry after a failure finishes the work.
      await deps.raw.put(rawKey, JSON.stringify(payload));
      const event = createEvent("NoteCaptured", payload, {
        clock: deps.clock,
        ids: { next: () => eventId },
        tenantId: deps.tenantId,
        correlationId: eventId,
      });
      const [outcome = "duplicate"] = await deps.publish([event]);
      await deps.notes.add({
        noteId: payload.noteId,
        text: payload.text,
        capturedAt: payload.capturedAt,
        deviceId: payload.deviceId ?? null,
        rawKey,
        lastEventId: eventId,
      });
      return outcome;
    },
    listNotes(limit) {
      return deps.notes.list(limit);
    },
  };
}
