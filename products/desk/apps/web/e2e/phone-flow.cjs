// End to end test of the phone flow in Chromium with a virtual passkey.
// Usage: node apps/web/e2e/phone-flow.cjs "<join link>" <screenshot dir>
// Start desk-api first: see the README section "Run locally".
const { chromium, devices } = require("playwright");
const [link, out] = process.argv.slice(2);
const step = (msg) => console.log("STEP", msg);
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ ...devices["Pixel 7"] });
  const page = await context.newPage();
  page.on("console", (m) => m.type() === "error" && console.log("CONSOLE", m.text()));
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  const cdp = await context.newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: { protocol: "ctap2", transport: "internal", hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true },
  });

  await page.goto(link);
  await page.getByLabel("Email").fill(`clayton+${Date.now()}@example.com`);
  await page.getByLabel("Name").fill("Clayton");
  await page.screenshot({ path: `${out}/1-join.png` });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Create passkey" }).click();
  await page.getByLabel("Note").waitFor();
  step("joined: " + page.url());

  await page.getByLabel("Note").fill("send Dana the SOW by Friday");
  await page.getByRole("button", { name: "Save note" }).click();
  await page.locator(".notes .state.ok").first().waitFor();
  step("note synced: " + (await page.locator(".chip").textContent()));

  await page.waitForFunction(() => navigator.serviceWorker.controller !== null || navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  console.log("navigator.onLine offline:", await page.evaluate(() => navigator.onLine));
  await page.getByLabel("Note").waitFor();
  step("loaded offline");
  await page.getByLabel("Note").fill("call the bank, no signal in this meeting");
  await page.getByRole("button", { name: "Save note" }).click();
  await page.locator(".notes .state.warn").first().waitFor();
  step("offline chip: " + (await page.locator(".chip").textContent()));
  await page.screenshot({ path: `${out}/2-offline.png` });

  await context.setOffline(false);
  await page.waitForFunction(() => document.querySelectorAll(".notes .state.warn").length === 0, null, { timeout: 40000 });
  step("synced after online: " + (await page.locator(".chip").textContent()));
  await page.screenshot({ path: `${out}/3-synced.png` });

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByRole("button", { name: "Sign in with a passkey" }).waitFor();
  await page.screenshot({ path: `${out}/4-signin.png` });
  await page.getByRole("button", { name: "Sign in with a passkey" }).click();
  await page.getByLabel("Note").waitFor();
  await page.waitForFunction(() => document.querySelectorAll(".notes li:not(.empty)").length === 2, null, { timeout: 10000 });
  step("signed in again, notes from server: " + (await page.locator(".notes li").count()));

  const manifest = await page.evaluate(async () => (await fetch("/manifest.webmanifest")).json());
  step("manifest " + manifest.display + " icons " + manifest.icons.length);
  await browser.close();
})().catch((e) => {
  console.log("FAILED", e.message);
  process.exit(1);
});
