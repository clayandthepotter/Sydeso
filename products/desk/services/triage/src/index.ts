import {
  NotBuiltError,
  type Clock,
  type DeskConfig,
  type EventConsumer,
  type ExtractionPort,
  type InboxPort,
  type ProjectDirectoryPort,
} from "@desk/domain";

export interface TriageDeps {
  readonly extraction: ExtractionPort;
  readonly projects: ProjectDirectoryPort;
  readonly inbox: InboxPort;
  readonly clock: Clock;
  readonly config: Pick<DeskConfig, "timeZone" | "confidenceThreshold">;
}

/**
 * desk-triage. Reads NoteCaptured.
 * Publishes ItemsExtracted, then ItemRouted or ItemNeedsReview for each item.
 */
export function createTriage(_deps: TriageDeps): EventConsumer {
  return {
    name: "desk-triage",
    consumes: ["NoteCaptured"],
    async handle() {
      throw new NotBuiltError("desk-triage", 3);
    },
  };
}
