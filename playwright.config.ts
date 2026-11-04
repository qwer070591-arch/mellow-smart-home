import { defineConfig } from "@playwright/test";

export default defineConfig({
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5185 --strictPort",
    url: "http://127.0.0.1:5185",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
