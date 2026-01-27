/**
 * Einfache E2E Tests - nur um Playwright zu testen
 */

const { test, expect } = require('@playwright/test')

test.describe('Basic E2E Tests', () => {
  test('page loads correctly', async ({ page }) => {
    // Teste eine einfache Seite ohne externe Abhängigkeiten
    await page.goto('about:blank')
    
    // Erstelle Test-Inhalt
    await page.setContent(`
      <html>
        <body>
          <h1>E2E Test Page</h1>
          <p>Playwright funktioniert!</p>
        </body>
      </html>
    `)
    
    // Überprüfe, dass Seite geladen ist
    await expect(page.locator('h1')).toHaveText('E2E Test Page')
    await expect(page.locator('p')).toHaveText('Playwright funktioniert!')
  })

  test('basic page interactions', async ({ page }) => {
    // Teste grundlegende Browser-Funktionalität
    await page.goto('about:blank')
    
    // Erstelle einfaches HTML mit JavaScript
    await page.setContent(`
      <html>
        <body>
          <h1>Test Page</h1>
          <button id="test-btn">Click Me</button>
          <div id="result"></div>
          <script>
            document.getElementById('test-btn').addEventListener('click', function() {
              document.getElementById('result').textContent = 'Button clicked!';
            });
          </script>
        </body>
      </html>
    `)
    
    // Teste Klick-Interaktion
    await page.click('#test-btn')
    
    // Überprüfe Ergebnis
    await expect(page.locator('h1')).toHaveText('Test Page')
    await expect(page.locator('#test-btn')).toBeVisible()
    await expect(page.locator('#result')).toHaveText('Button clicked!')
  })

  test('browser capabilities', async ({ page }) => {
    // Teste Browser-Fähigkeiten ohne externe Abhängigkeiten
    await page.goto('about:blank')
    
    // Teste JavaScript-Ausführung
    const title = await page.evaluate(() => {
      document.title = 'E2E Test'
      return document.title
    })
    
    // Teste Screenshot-Fähigkeit
    await page.screenshot({ path: 'test-screenshot.png' })
    
    // Überprüfe JavaScript-Ausführung
    expect(title).toBe('E2E Test')
  })

  test('network monitoring', async ({ page }) => {
    // Teste Netzwerk-Monitoring mit einer echten URL
    await page.goto('https://example.com')
    
    // Warte auf page load
    await page.waitForLoadState('networkidle')
    
    // Überprüfe, dass Seite geladen ist
    const title = await page.title()
    expect(title).toBe('Example Domain')
    
    // Überprüfe URL
    expect(page.url()).toContain('example.com')
  })

  test('form interactions', async ({ page }) => {
    // Teste Formular-Interaktionen
    await page.goto('about:blank')
    
    // Erstelle Formular
    await page.setContent(`
      <html>
        <body>
          <form id="test-form">
            <input type="text" name="username" placeholder="Benutzername" />
            <input type="email" name="email" placeholder="Email" />
            <button type="submit">Absenden</button>
          </form>
          <div id="form-result"></div>
        </body>
      </html>
    `)
    
    // Fülle Formular aus
    await page.fill('input[name="username"]', 'TestUser')
    await page.fill('input[name="email"]', 'test@example.com')
    
    // Überprüfe Eingaben
    await expect(page.locator('input[name="username"]')).toHaveValue('TestUser')
    await expect(page.locator('input[name="email"]')).toHaveValue('test@example.com')
    
    // Teste Form-Validierung
    const isValid = await page.evaluate(() => {
      const form = document.getElementById('test-form')
      const email = form.querySelector('input[name="email"]')
      return email.validity.valid
    })
    
    expect(isValid).toBe(true)
  })
})
