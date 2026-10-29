import { MAX_P1_IN_TODAY, type ExtractedItem, type Item, type LinearState, type Priority } from "./model.js";

/** Items due within this many days go to Next. */
const NEXT_WINDOW_DAYS = 7;

/** A stable item ID. A redelivered note gives the same IDs. */
export function itemIdFor(sourceEventId: string, index: number): string {
  return `${sourceEventId}#${index}`;
}

const daysBetween = (from: string, to: string) => (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;

/** The Linear state for an item. `today` is the local date in the tenant time zone. */
export function stateFor(item: Pick<ExtractedItem, "priority" | "dueDate">, today: string): LinearState {
  const daysLeft = item.dueDate === null ? null : daysBetween(today, item.dueDate);
  if (item.priority === "P1" || (daysLeft !== null && daysLeft <= 0)) return "Today";
  if (item.priority === "P2" || (daysLeft !== null && daysLeft <= NEXT_WINDOW_DAYS)) return "Next";
  return "Later";
}

export type TriageDecision =
  | { readonly kind: "routed"; readonly item: Item & { readonly project: string }; readonly state: LinearState }
  | { readonly kind: "review"; readonly item: Item; readonly reason: "low_confidence" | "no_project" };

export interface DecideItemsInput {
  readonly sourceEventId: string;
  readonly noteId: string;
  readonly extracted: readonly ExtractedItem[];
  readonly threshold: number;
  /** The Linear project names of the tenant. */
  readonly projects: readonly string[];
  readonly today: string;
}

/** Decides each item. Never guess: a low confidence or an unknown project goes to review. */
export function decideItems(input: DecideItemsInput): TriageDecision[] {
  const byLowerName = new Map(input.projects.map((name) => [name.toLowerCase(), name]));
  return input.extracted.map((extracted, index) => {
    const item: Item = { ...extracted, itemId: itemIdFor(input.sourceEventId, index), sourceNoteId: input.noteId };
    if (extracted.confidence < input.threshold) return { kind: "review", item, reason: "low_confidence" };
    const project = extracted.project === null ? undefined : byLowerName.get(extracted.project.toLowerCase());
    if (project === undefined) return { kind: "review", item, reason: "no_project" };
    return { kind: "routed", item: { ...item, project }, state: stateFor(extracted, input.today) };
  });
}

/** Keeps at most MAX_P1_IN_TODAY P1 items in Today. An extra P1 goes to Next. */
export function limitTodayP1(state: LinearState, priority: Priority, p1InToday: number): LinearState {
  return state === "Today" && priority === "P1" && p1InToday >= MAX_P1_IN_TODAY ? "Next" : state;
}
