/** The five bounded contexts. Each context is its own Worker. */
export const BOUNDED_CONTEXTS = ["capture", "ingestion", "triage", "planning", "scheduling"] as const;

export type BoundedContext = (typeof BOUNDED_CONTEXTS)[number];
