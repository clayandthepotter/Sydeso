/**
 * Settings for one tenant. One person is one tenant.
 * Each tenant has its own time zone, threshold, and invite address.
 */
export interface TenantSettings {
  readonly tenantId: string;
  /** IANA time zone, for example America/La_Paz. */
  readonly timeZone: string;
  /** Items with a lower confidence go to the Review Queue. */
  readonly confidenceThreshold: number;
  /** The corporate addresses that can forward invites for this tenant. */
  readonly allowedSenders: readonly string[];
  /** The private part of the invite address: invites+TOKEN@in.sydeso.com. */
  readonly inviteAddressToken: string;
}

/**
 * The event ID for a captured note. The client sets the note ID.
 * The tenant is part of the ID, so two tenants never share an event.
 */
export function noteEventId(tenantId: string, noteId: string): string {
  return `note/${tenantId}/${noteId}`;
}

/** The local calendar date in the time zone, for example 2026-10-28. */
export function localDate(date: Date, timeZone: string): string {
  return toOffsetIso(date, timeZone).slice(0, 10);
}

const pad = (value: number, length = 2) => String(value).padStart(length, "0");

/** Writes an instant as ISO 8601 with the offset of the time zone, for example 2026-10-28T09:00:00.000-04:00. */
export function toOffsetIso(date: Date, timeZone: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  const ms = date.getUTCMilliseconds();
  const wallAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
    ms,
  );
  const offsetMinutes = Math.round((wallAsUtc - date.getTime()) / 60_000);
  const sign = offsetMinutes < 0 ? "-" : "+";
  const abs = Math.abs(offsetMinutes);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${pad(ms, 3)}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}
