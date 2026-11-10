import { defineConfig, devices } from "@playwright/test";

export const PORT = 4317;

export default defineConfig({
    testDir: "test/browser",
    // Kept apart from the Mocha glob (test/**/*.spec.ts).
    testMatch: "**/*.e2e.ts",
    globalSetup: "./test/browser/globalSetup.ts",
    timeout: 30_000,
    forbidOnly: !!process.env.CI,
    reporter: process.env.CI ? "github" : "list",
    use: {
        baseURL: `http://127.0.0.1:${PORT}`
    },
    projects: [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
        { name: "firefox", use: { ...devices["Desktop Firefox"] } },
        { name: "webkit", use: { ...devices["Desktop Safari"] } }
    ]
});
