import { describe, expect, it } from "vitest";
import { noteEventId, toOffsetIso } from "../src/index.js";

describe("toOffsetIso", () => {
  it("writes an instant with the offset of the time zone", () => {
    expect(toOffsetIso(new Date("2026-10-28T13:05:09.123Z"), "America/La_Paz")).toBe("2026-10-28T09:05:09.123-04:00");
  });

  it("follows daylight saving time", () => {
    expect(toOffsetIso(new Date("2026-07-01T16:00:00Z"), "America/New_York")).toBe("2026-07-01T12:00:00.000-04:00");
    expect(toOffsetIso(new Date("2026-11-02T15:00:00Z"), "America/New_York")).toBe("2026-11-02T10:00:00.000-05:00");
  });

  it("writes +00:00 for UTC", () => {
    expect(toOffsetIso(new Date("2026-10-28T13:00:00Z"), "UTC")).toBe("2026-10-28T13:00:00.000+00:00");
  });

  it("keeps the same instant", () => {
    const date = new Date("2026-12-31T23:59:59.999Z");
    expect(Date.parse(toOffsetIso(date, "Asia/Kolkata"))).toBe(date.getTime());
  });
});

describe("noteEventId", () => {
  it("is stable for the same tenant and note", () => {
    expect(noteEventId("tenant-a", "n1")).toBe(noteEventId("tenant-a", "n1"));
  });

  it("is different for two tenants with the same client note ID", () => {
    expect(noteEventId("tenant-a", "n1")).not.toBe(noteEventId("tenant-b", "n1"));
  });
});
