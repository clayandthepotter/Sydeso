import {
  causedEventId,
  createEvent,
  decideItems,
  localDate,
  type AnyEvent,
  type Clock,
  type EventConsumer,
  type EventEnvelope,
  type ExtractionPort,
  type ProjectDirectoryPort,
  type TenantDirectoryPort,
} from "@desk/domain";

export const TRIAGE_CONSUMER = "desk-triage";

import { ExtractionRefusedError } from "./errors.js";

export { ExtractionRefusedError } from "./errors.js";
export { ClaudeExtraction, type ClaudeExtractionConfig } from "./claude.js";

export interface TriageDeps {
  readonly extraction: ExtractionPort;
  /** The Linear projects of one tenant. */
  readonly projects: (tenantId: string) => ProjectDirectoryPort;
  readonly clock: Clock;
  readonly tenants: TenantDirectoryPort;
}

/**
 * desk-triage. Reads NoteCaptured.
 * Publishes ItemsExtracted, then ItemRouted or ItemNeedsReview for each item.
 */
export function createTriage(deps: TriageDeps): EventConsumer {
  const triageNote = async (note: EventEnvelope<"NoteCaptured">): Promise<AnyEvent[]> => {
    const tenant = await deps.tenants.get(note.tenantId);
    if (!tenant) throw new Error(`Unknown tenant ${note.tenantId}`);

    const options = (type: AnyEvent["type"], key?: string) => ({
      clock: deps.clock,
      ids: { next: () => causedEventId(note.id, type, key) },
      tenantId: note.tenantId,
      causationId: note.id,
      correlationId: note.correlationId ?? note.id,
    });

    const projects = await deps.projects(note.tenantId).listProjects();
    let extracted;
    try {
      extracted = await deps.extraction.extract({
        noteId: note.payload.noteId,
        text: note.payload.text,
        capturedAt: note.payload.capturedAt,
        timeZone: tenant.timeZone,
        projects,
      });
    } catch (error) {
      if (!(error instanceof ExtractionRefusedError)) throw error;
      return [
        createEvent(
          "ItemNeedsReview",
          { source: { kind: "note", noteId: note.payload.noteId }, reason: "extraction_refused" },
          options("ItemNeedsReview"),
        ),
      ];
    }

    const decisions = decideItems({
      sourceEventId: note.id,
      noteId: note.payload.noteId,
      extracted,
      threshold: tenant.confidenceThreshold,
      projects,
      today: localDate(deps.clock.now(), tenant.timeZone),
    });

    const events: AnyEvent[] = [
      createEvent(
        "ItemsExtracted",
        { noteId: note.payload.noteId, items: decisions.map((decision) => decision.item) },
        options("ItemsExtracted"),
      ),
    ];
    for (const decision of decisions) {
      events.push(
        decision.kind === "routed"
          ? createEvent("ItemRouted", { item: decision.item, state: decision.state }, options("ItemRouted", decision.item.itemId))
          : createEvent(
              "ItemNeedsReview",
              {
                source: { kind: "note", noteId: note.payload.noteId, itemId: decision.item.itemId },
                reason: decision.reason,
                item: decision.item,
              },
              options("ItemNeedsReview", decision.item.itemId),
            ),
      );
    }
    return events;
  };

  return {
    name: TRIAGE_CONSUMER,
    consumes: ["NoteCaptured"],
    async handle(event) {
      return event.type === "NoteCaptured" ? triageNote(event) : [];
    },
  };
}
