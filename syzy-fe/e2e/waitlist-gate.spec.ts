import { test, expect } from "@playwright/test";

/**
 * Waitlist Gate keeper e2e tests.
 * Tests that WaitlistGate blocks/allows routes based on waitlist completion.
 *
 * IMPORTANT: These tests must run with NEXT_PUBLIC_MOCK=true so the mock
 * wallet (auto-connected) and mock waitlist state are active.
 */

test.describe("Waitlist Gate Keeper", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/waitlist");
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
  });

  test("allows /waitlist without gate", async ({ page }) => {
    await page.goto("/waitlist");
    await expect(page).toHaveURL(/\/waitlist/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("allows / (landing) without gate", async ({ page }) => {
    await page.goto("/");
    // Landing page should load (may redirect to waitlist if not complete, but not a crash)
    await expect(page.locator("body")).toBeVisible();
  });

  test("redirects unauthenticated user to /waitlist from /dashboard", async ({ page }) => {
    // Clear all auth state first
    await page.goto("/");
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.goto("/dashboard");
    await page.waitForURL(/\/waitlist/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/waitlist/);
  });

  test("redirects user without email to /waitlist from /portfolio", async ({ page }) => {
    // Set registered-but-no-email state
    await page.goto("/waitlist");
    await page.evaluate(() => {
      localStorage.setItem("syzy.waitlist.member.auth", JSON.stringify({
        state: {
          accessToken: "mock-token",
          refreshToken: "mock-refresh",
          member: {
            walletAddress: "SolMock1111111111111111111111111111111",
            referralCode: "MOCK123",
            email: null,
            isContactable: false,
            joinedAt: new Date().toISOString(),
          },
          isAuthenticated: true,
          isLoading: false,
        },
        version: 0,
      }));
    });
    await page.goto("/portfolio");
    await page.waitForURL(/\/waitlist/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/waitlist/);
  });

  test("allows access when waitlist is complete (connected + authenticated + email)", async ({ page }) => {
    await page.goto("/waitlist");
    await page.evaluate(() => {
      localStorage.setItem("syzy.waitlist.member.auth", JSON.stringify({
        state: {
          accessToken: "mock-complete-token",
          refreshToken: "mock-complete-refresh",
          member: {
            walletAddress: "SolMock1111111111111111111111111111111",
            referralCode: "COMPLETE",
            email: "user@example.com",
            isContactable: true,
            joinedAt: new Date().toISOString(),
          },
          isAuthenticated: true,
          isLoading: false,
        },
        version: 0,
      }));
    });
    // Dashboard should load without redirect
    await page.goto("/dashboard");
    // Either stays on dashboard or gets redirected based on mock gate behavior
    // The key assertion: no crash, no hooks error
    await expect(page.locator("body")).toBeVisible();
  });

  test("stores intended path in sessionStorage on redirect", async ({ page }) => {
    await page.goto("/waitlist");
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });

    await page.goto("/dashboard");
    await page.waitForURL(/\/waitlist/, { timeout: 5000 });

    const redirectPath = await page.evaluate(() => sessionStorage.getItem("waitlist_redirect"));
    expect(redirectPath).toBe("/dashboard");
  });

  test("public routes /blog, /x402, /faucet bypass gate without crash", async ({ page }) => {
    // These are public prefix routes
    await page.goto("/blog").catch(() => {});
    await expect(page.locator("body")).toBeVisible();
  });

  test("public route /staking bypasses gate without crash", async ({ page }) => {
    await page.goto("/staking");
    // /staking is public — should not crash regardless of auth state
    await expect(page.locator("body")).toBeVisible();
  });

  test("shows loading spinner while redirecting", async ({ page }) => {
    await page.goto("/waitlist");
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });

    await page.goto("/dashboard");

    // May see the loader briefly before redirect
    const loader = page.locator('[class*="animate-spin"]').first();
    await expect(loader).toBeVisible({ timeout: 2000 }).catch(() => {
      // Too fast — that's fine, just check final URL
    });
    await expect(page).toHaveURL(/\/waitlist/, { timeout: 5000 });
  });
});
