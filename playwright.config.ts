import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";
import { chromium } from "@playwright/test";

const port = Number(process.env.LEO_E2E_PORT ?? 3100);
const baseURL = `http://localhost:${port}`;
// 플레이라이트 자체 브라우저가 없으면 CHROME_PATH 의 Chrome 으로 헤드리스 실행한다.
const bundled = chromium.executablePath();
const executablePath = existsSync(bundled) ? undefined : process.env.CHROME_PATH;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: process.env.CI ? "line" : [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: {
    command: `bash scripts/e2e-server.sh ${port}`,
    url: baseURL,
    timeout: 180_000,
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
  },
});
