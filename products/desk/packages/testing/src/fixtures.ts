import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtractedItem, PayloadOf } from "@desk/domain";

/** The fixtures folder at the root of the Desk workspace. */
export const FIXTURES_DIR = fileURLToPath(new URL("../../../fixtures/", import.meta.url));

export interface NoteFixture {
  readonly name: string;
  readonly text: string;
  /** The capture time. Relative dates such as "Friday" resolve from it. */
  readonly capturedAt: string;
  readonly expectedItems: readonly ExtractedItem[];
  /** True if triage must send the note to the Review Queue. */
  readonly expectReview?: boolean;
}

export type InviteExpectation =
  | { readonly outcome: "parsed"; readonly invite: Omit<PayloadOf<"InviteParsed">, "emailId"> }
  | { readonly outcome: "rejected"; readonly reason: PayloadOf<"InviteRejected">["reason"] };

export interface InviteFixture {
  readonly name: string;
  readonly ics: string;
  readonly expected: InviteExpectation;
}

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;

export function loadNoteFixtures(dir = join(FIXTURES_DIR, "notes")): NoteFixture[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => ({ name: basename(file, ".json"), ...readJson<Omit<NoteFixture, "name">>(join(dir, file)) }));
}

export function loadNoteFixture(name: string): NoteFixture {
  const fixture = loadNoteFixtures().find((candidate) => candidate.name === name);
  if (!fixture) throw new Error(`No note fixture named ${name}`);
  return fixture;
}

/** Each invite fixture is a pair: name.ics and name.expected.json. */
export function loadInviteFixtures(dir = join(FIXTURES_DIR, "invites")): InviteFixture[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".ics"))
    .sort()
    .map((file) => {
      const name = basename(file, ".ics");
      return {
        name,
        ics: readFileSync(join(dir, file), "utf8"),
        expected: readJson<InviteExpectation>(join(dir, `${name}.expected.json`)),
      };
    });
}

export function loadInviteFixture(name: string): InviteFixture {
  const fixture = loadInviteFixtures().find((candidate) => candidate.name === name);
  if (!fixture) throw new Error(`No invite fixture named ${name}`);
  return fixture;
}
