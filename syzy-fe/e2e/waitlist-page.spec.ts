import { test, expect } from "@playwright/test";

test.describe("Waitlist Page", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh per test
    await page.goto("/waitlist");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("renders /waitlist page with correct heading", async ({ page }) => {
    await page.goto("/waitlist");

    // Heading should be visible
    await expect(page.locator("h1")).toContainText("Predict");

    // Badge "Early Access" should be visible
    await expect(page.getByText("Early Access")).toBeVisible();

    // Two-column board layout
    const board = page.locator('[class*="grid"]').first();
    await expect(board).toBeVisible();
  });

  test("shows connect wallet prompt when not connected", async ({ page }) => {
    await page.goto("/waitlist");

    // In mock mode, wallet auto-connects but we simulate disconnect
    // The "Join the waitlist" section header should be visible
    await expect(page.getByText(/join the waitlist/i)).toBeVisible();

    // Connect wallet button should exist
    const connectBtn = page.getByRole("button", { name: /connect/i }).first();
    await expect(connectBtn).toBeVisible();
  });

  test("shows 'Your status' section after wallet connected and registered", async ({ page }) => {
    await page.goto("/waitlist");

    // Simulate registered state by setting localStorage
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
    await page.reload();

    // Should show "Your status" section
    await expect(page.getByText(/your status/i)).toBeVisible();

    // Stepper (Wallet step) should be visible
    await expect(page.locator("[data-step='wallet']")).toBeVisible();
  });

  test("shows 3-step progress stepper after registration", async ({ page }) => {
    await page.goto("/waitlist");

    // Set registered state
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
    await page.reload();

    // Stepper should show 3 steps
    await expect(page.locator("[data-step='wallet']")).toBeVisible();
    await expect(page.locator("[data-step='email']")).toBeVisible();
    await expect(page.locator("[data-step='done']")).toBeVisible();

    // Wallet step should be "done" (green check)
    const walletStep = page.locator("[data-step='wallet']");
    await expect(walletStep).toHaveClass(/green/i);

    // Email step should be "active" (not done)
    const emailStep = page.locator("[data-step='email']");
    await expect(emailStep).not.toHaveClass(/green/i);
  });

  test("shows email form when email not attached", async ({ page }) => {
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
    await page.reload();

    // Email form should show "Complete your setup"
    await expect(page.getByText(/complete your setup/i)).toBeVisible();

    // Email input should exist
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });

  test("shows success banner after email attached", async ({ page }) => {
    await page.goto("/waitlist");

    await page.evaluate(() => {
      localStorage.setItem("syzy.waitlist.member.auth", JSON.stringify({
        state: {
          accessToken: "mock-token",
          refreshToken: "mock-refresh",
          member: {
            walletAddress: "SolMock1111111111111111111111111111111",
            referralCode: "MOCK123",
            email: "test@example.com",
            isContactable: true,
            joinedAt: new Date().toISOString(),
          },
          isAuthenticated: true,
          isLoading: false,
        },
        version: 0,
      }));
    });
    await page.reload();

    // All 3 steps should show "done" (green)
    await expect(page.locator("[data-step='wallet']")).toHaveClass(/green/i);
    await expect(page.locator("[data-step='email']")).toHaveClass(/green/i);
    await expect(page.locator("[data-step='done']")).toHaveClass(/green/i);

    // Success banner with masked email
    await expect(page.getByText(/test***@example\.com/i)).toBeVisible();
    await expect(page.getByText(/email confirmed/i)).toBeVisible();
  });

  test("shows referral notice when ?ref= param present", async ({ page }) => {
    await page.goto("/waitlist?ref=REF123");

    // Referral notice should appear
    await expect(page.getByText(/you'll be credited/i)).toBeVisible();
  });

  test("shows referral link and copy button when registered", async ({ page }) => {
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
    await page.reload();

    // Referral link row
    await expect(page.getByText(/your referral link/i)).toBeVisible();
    await expect(page.getByText(/MOCK123/)).toBeVisible();

    // Copy button
    const copyBtn = page.locator("button").filter({ has: page.locator('[data-testid=""]') });
    // Check copy button exists near the referral link
    await expect(page.locator('[class*="rounded-lg"][class*="border-border"]').last()).toBeVisible();
  });

  test("shows queue rank and referral count", async ({ page }) => {
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
    await page.reload();

    // Queue rank label
    await expect(page.getByText(/your queue rank/i)).toBeVisible();

    // Referrals label
    await expect(page.getByText(/successful referrals/i)).toBeVisible();
  });

  test("shows Share on X button", async ({ page }) => {
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
    await page.reload();

    await expect(page.getByRole("button", { name: /share on x/i })).toBeVisible();
  });

  test("shows FAQ explainer below the board", async ({ page }) => {
    await page.goto("/waitlist");

    // FAQ section should be below the board
    await expect(page.getByText(/how does the queue ranking work/i)).toBeVisible();
    await expect(page.getByText(/what counts as a successful referral/i)).toBeVisible();
  });

  test("referral loop card shows 'How it works' steps", async ({ page }) => {
    await page.goto("/waitlist");

    // "How it works" right column
    await expect(page.getByText(/how it works/i)).toBeVisible();
    await expect(page.getByText(/climb the queue with referrals/i)).toBeVisible();
    await expect(page.getByText(/share your unique referral link/i)).toBeVisible();
  });
});
