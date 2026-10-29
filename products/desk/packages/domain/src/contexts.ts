/**
 * The bounded contexts. Identity owns tenants, users, and sessions.
 * The other five are from the handoff.
 */
export const BOUNDED_CONTEXTS = ["identity", "capture", "ingestion", "triage", "planning", "scheduling"] as const;

export type BoundedContext = (typeof BOUNDED_CONTEXTS)[number];
