import { defineConfig } from "vitest/config";

// Solo tests unitarios en lib/. Los E2E (tests/*.spec.ts) los corre Playwright.
export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts"],
  },
});
