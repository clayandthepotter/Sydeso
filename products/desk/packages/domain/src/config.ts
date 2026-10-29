/**
 * Runtime settings. Workers read them from environment variables.
 * Tests build them directly. Nothing here has a default in code.
 */
export interface DeskConfig {
  /** IANA time zone of the user, for example America/La_Paz. */
  readonly timeZone: string;
  /** Items with a lower confidence go to the Review Queue. */
  readonly confidenceThreshold: number;
  /** The only senders the Email Worker accepts. */
  readonly allowedSenders: readonly string[];
}
