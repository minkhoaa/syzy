/**
 * Simple E2E test runner using global Playwright.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("/home/khoa/.nvm/versions/node/v24.10.0/lib/node_modules/playwright");

async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function testWaitlistPage(page) {
  console.log("  Testing /waitlist page render...");
  await page.goto("http://localhost:3001/waitlist", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  const h1 = await page.locator("h1").first().textContent().catch(() => "");
  if (!h1.includes("Predict")) throw new Error(`H1 heading not found, got: ${h1}`);

  const badge = await page.locator("text=Early Access").isVisible().catch(() => false);
  if (!badge) throw new Error("Early Access badge not visible");

  const board = await page.locator('[class*="grid"]').first().isVisible().catch(() => false);
  if (!board) throw new Error("2-col grid board not visible");

  console.log("  Testing wallet panel / status section...");
  const sectionHeader = await page.locator("text=Join the waitlist").isVisible({ timeout: 2000 }).catch(() => false) ||
    await page.locator("text=Your status").isVisible({ timeout: 2000 }).catch(() => false);
  if (!sectionHeader) throw new Error("Neither 'Join the waitlist' nor 'Your status' section header found");

  console.log("  Testing FAQ explainer...");
  const faq = await page.locator("text=how does the queue ranking work").isVisible().catch(() => false);
  if (!faq) throw new Error("FAQ explainer not visible");

  console.log("  Testing referral loop card...");
  const loopCard = await page.locator("text=how it works").first().isVisible().catch(() => false);
  if (!loopCard) throw new Error("Referral loop card 'How it works' not visible");

  const climbText = await page.locator("text=climb the queue with referrals").isVisible().catch(() => false);
  if (!climbText) throw new Error("Referral loop card content not visible");

  console.log("  Testing ?ref= param...");
  await page.goto("http://localhost:3001/waitlist?ref=REF123", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const creditNotice = await page.locator("text=you'll be credited").isVisible({ timeout: 2000 }).catch(() => false) ||
    await page.locator("text=you'll be credited").isVisible({ timeout: 2000 }).catch(() => false);
  console.log("    credit notice visible:", creditNotice);
}

async function testWaitlistGate(page) {
  console.log("  Testing /waitlist bypass...");
  await page.goto("http://localhost:3001/waitlist", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const url = page.url();
  if (!url.includes("/waitlist")) throw new Error(`/waitlist should be accessible, got ${url}`);

  console.log("  Testing redirect when not completed...");
  await page.goto("http://localhost:3001/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const dashUrl = page.url();
  if (!dashUrl.includes("/waitlist")) throw new Error(`Should redirect to /waitlist, got ${dashUrl}`);
  console.log("    redirected to:", dashUrl);
}

async function runTest(name, fn) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Running: ${name}`);
  console.log("=".repeat(60));
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  try {
    await fn(page);
    const filteredErrors = errors.filter((e) =>
      !e.includes("Warning") && !e.includes("hydration") && !e.includes("React does not recognize")
    );
    console.log(`  ✅ ${name}: PASSED${filteredErrors.length > 0 ? ` (${filteredErrors.length} console errors)` : ""}`);
    return { name, passed: true, errors: filteredErrors };
  } catch (err) {
    console.log(`  ❌ ${name}: FAILED — ${err.message}`);
    return { name, passed: false, errors, error: err.message };
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log("🔍 Syzy Waitlist E2E Verification");
  console.log("   Playwright:", require.resolve("/home/khoa/.nvm/versions/node/v24.10.0/lib/node_modules/playwright").replace("/index.js", ""));

  const serverRunning = await waitForServer("http://localhost:3001", 3000).catch(() => false);

  if (!serverRunning) {
    console.log("\n⚙️  Starting Next.js dev server on port 3001...");
    const { spawn } = await import("child_process");
    const server = spawn(
      "pnpm",
      ["--dir", "/home/khoa/Projects/syzy/syzy-fe", "dev", "--port", "3001", "--webpack"],
      { env: { ...process.env, NEXT_PUBLIC_MOCK: "true" }, stdio: "ignore", detached: true }
    );
    server.unref();
    const started = await waitForServer("http://localhost:3001", 90000);
    if (!started) throw new Error("Failed to start dev server within 90s");
    console.log("   Server started.");
  } else {
    console.log("   Using existing server on port 3001.");
  }

  const results = [
    await runTest("Waitlist Page", testWaitlistPage),
    await runTest("Waitlist Gate", testWaitlistGate),
  ];

  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`  Passed: ${passed}/${results.length}`);
  console.log(`  Failed: ${failed}/${results.length}`);
  if (failed > 0) {
    results.filter((r) => !r.passed).forEach((r) => console.log(`  ❌ ${r.name}: ${r.error}`));
    process.exit(1);
  }
  console.log("\n✅ All E2E tests passed.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
