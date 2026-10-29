import { NotBuiltError, type AppendResult, type Clock, type EventStorePort, type IdGenerator } from "@desk/domain";

export interface CaptureDeps {
  readonly store: EventStorePort;
  readonly clock: Clock;
  readonly ids: IdGenerator;
}

/** The client sends this. The client sets the note ID. */
export interface CaptureNoteCommand {
  readonly noteId: string;
  readonly text: string;
  readonly capturedAt: string;
  readonly deviceId?: string;
}

export interface CaptureService {
  /** Stores a NoteCaptured event. A duplicate note ID gives "duplicate". */
  captureNote(command: CaptureNoteCommand): Promise<AppendResult>;
}

export function createCapture(_deps: CaptureDeps): CaptureService {
  return {
    async captureNote() {
      throw new NotBuiltError("desk-capture", 2);
    },
  };
}
