const { defineConfig, devices } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4, // Erhöht von undefined auf 4
  timeout: 60000, // Erhöht auf 60 Sekunden für Firefox
  expect: {
    timeout: 20000, // Erhöht auf 20 Sekunden
  },
  reporter: [
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000, // Erhöht für Firefox mit slowMo
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'edge',
      use: { ...devices['Desktop Edge'] },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox-spezifische Einstellungen für bessere Stabilität
        launchOptions: {
          slowMo: 100, // Reduziert für schnellere Tests
          firefoxUserPrefs: {
            'dom.webcomponents.enabled': true,
            'dom.webdriver.enabled': false
          }
        },
      },
    },
  ],

  // Deaktiviere webServer für manuelle Tests
  // webServer: {
  //   command: 'cd ../../frontend && npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
})
