// Makes a one use link that adds a passkey on a new device to an existing account.
// Use it when the person cannot sign in on any device, for example after a lost passkey.
// Usage: node scripts/create-device-link.mjs --email person@example.com [--minutes 30] [--local]
import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    minutes: { type: "string", default: "30" },
    local: { type: "boolean", default: false },
    origin: { type: "string" },
  },
});
if (!values.email) throw new Error("--email is required");
const minutes = Number(values.minutes);
if (!Number.isFinite(minutes) || minutes <= 0) throw new Error("--minutes must be a positive number");

const gateway = join(dirname(fileURLToPath(import.meta.url)), "../services/gateway");
const config = JSON.parse(
  readFileSync(join(gateway, "wrangler.jsonc"), "utf8")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n"),
);
const origin = values.origin ?? config.vars.APP_ORIGIN;

const code = randomBytes(24).toString("base64url");
const codeHash = createHash("sha256").update(code).digest("hex");
const now = new Date();
const expiresAt = new Date(now.getTime() + minutes * 60_000);
const quote = (value) => `'${String(value).replace(/'/g, "''")}'`;

const sql = `INSERT INTO device_links (code_hash, user_id, created_at, expires_at)
SELECT ${quote(codeHash)}, user_id, ${quote(now.toISOString())}, ${quote(expiresAt.toISOString())}
FROM users WHERE email = ${quote(values.email.toLowerCase())};`;

const output = execFileSync(
  "npx",
  ["wrangler", "d1", "execute", "desk-events", values.local ? "--local" : "--remote", "--json", "--command", sql],
  { cwd: gateway, stdio: ["ignore", "pipe", "inherit"] },
).toString();
const changes = JSON.parse(output)[0]?.meta?.changes ?? 0;
if (changes !== 1) throw new Error(`No account has the email ${values.email}.`);

console.log(`Device link made. It works once and expires ${expiresAt.toISOString()}.`);
console.log(`${origin}/link?code=${code}`);
