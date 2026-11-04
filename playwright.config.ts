import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 3000);
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e.json' }]],
  use: { baseURL: `http://127.0.0.1:${PORT}` },
  // Reuses a running server (npm run dev / ./scripts/start.sh); otherwise builds nothing — start one first.
  webServer: { command: `npx next start -H 127.0.0.1 -p ${PORT}`, url: `http://127.0.0.1:${PORT}/api/health`, reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'iphone', use: { ...devices['iPhone 13'] }, grepInvert: /@ai|@desktop-only/ },
    { name: 'ipad', use: { ...devices['iPad (gen 7)'] }, grepInvert: /@ai|@desktop-only/ },
  ],
});
