import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "NEXT_PUBLIC_MOCK=true pnpm --dir /home/khoa/Projects/syzy/syzy-fe dev --port 3001 --webpack 2>&1 &",
    url: "http://localhost:3001",
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "ignore",
  },
  timeout: 30_000,
});
