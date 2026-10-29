// Makes a one use invite and prints the join link.
// Usage: node scripts/create-invite.mjs [--local] [--email person@example.com] [--days 7] [--note "text"]
// Without --local it writes to the remote desk-events database.
import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    local: { type: "boolean", default: false },
    email: { type: "string" },
    days: { type: "string", default: "7" },
    note: { type: "string" },
    origin: { type: "string" },
  },
});

const gateway = join(dirname(fileURLToPath(import.meta.url)), "../services/gateway");
const config = JSON.parse(
  readFileSync(join(gateway, "wrangler.jsonc"), "utf8")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n"),
);
const origin = values.origin ?? config.vars.APP_ORIGIN;
const days = Number(values.days);
if (!Number.isFinite(days) || days <= 0) throw new Error("--days must be a positive number");

const code = randomBytes(18).toString("base64url");
const codeHash = createHash("sha256").update(code).digest("hex");
const now = new Date();
const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
const quote = (value) => (value === undefined ? "NULL" : `'${String(value).replace(/'/g, "''")}'`);

const sql = `INSERT INTO invites (code_hash, email, note, created_at, expires_at) VALUES (${quote(codeHash)}, ${quote(values.email?.toLowerCase())}, ${quote(values.note)}, ${quote(now.toISOString())}, ${quote(expiresAt.toISOString())});`;

execFileSync("npx", ["wrangler", "d1", "execute", "desk-events", values.local ? "--local" : "--remote", "--command", sql], {
  cwd: gateway,
  stdio: ["ignore", "ignore", "inherit"],
});

console.log(`Invite made. It works once and expires ${expiresAt.toISOString()}.`);
console.log(`${origin}/join?code=${code}`);
