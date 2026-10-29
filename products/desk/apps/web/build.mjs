// Builds the PWA into dist/. Run with: node build.mjs
import { build } from "esbuild";
import { createHash } from "node:crypto";
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(join(here, "public"), dist, { recursive: true });

await build({
  entryPoints: [join(here, "src/browser/main.ts")],
  outfile: join(dist, "app.js"),
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: true,
  sourcemap: true,
});

const files = async (dir) =>
  (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((entry) =>
        entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
      ),
    )
  ).flat();

// The shell is every file the app needs offline. Headers, maps, and robots.txt are not part of it.
const shell = (await files(dist))
  .map((file) => `/${relative(dist, file).split("\\").join("/")}`)
  .filter((path) => !/(_headers|\.map|robots\.txt)$/.test(path))
  // Workers static assets serve index.html at "/". Cache that URL, so the cached page is not a redirect.
  .map((path) => (path === "/index.html" ? "/" : path))
  .sort();

const hash = createHash("sha256");
for (const path of shell) hash.update(path).update(await readFile(join(dist, path === "/" ? "/index.html" : path)));
const buildId = hash.digest("hex").slice(0, 12);

await build({
  entryPoints: [join(here, "src/browser/sw.ts")],
  outfile: join(dist, "sw.js"),
  bundle: true,
  format: "iife",
  target: "es2022",
  minify: true,
  define: { DESK_BUILD: JSON.stringify(buildId), DESK_SHELL: JSON.stringify(shell) },
});

await writeFile(join(dist, "build.json"), JSON.stringify({ build: buildId, shell }, null, 2));
console.log(`Built Desk web ${buildId} with ${shell.length} shell files.`);
