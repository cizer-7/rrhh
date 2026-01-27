/**
 * End-to-End Tests für Employee Workflow
 */

const { test, expect } = require('@playwright/test')

test.describe('Employee Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3000')
    
    // Check if already logged in
    if (await page.locator('text=Login').isVisible()) {
      await page.fill('input[name="username"]', 'admin')
      await page.fill('input[name="password"]', 'admin123')
      await page.click('button[type="submit"]')
      
      // Wait for navigation to dashboard
      await page.waitForURL('**/dashboard')
    }
  })

  test('complete employee workflow', async ({ page }) => {
    // Navigate to employees page
    await page.click('text=Mitarbeiter')
    await page.waitForURL('**/employees')
    
    // Search for employee
    await page.fill('input[placeholder*="Suchen"]', 'Juan')
    await page.waitForTimeout(500)
    
    // Click on first employee
    await page.click('text=Juan')
    await page.waitForURL('**/employees/**')
    
    // Verify employee details page
    await expect(page.locator('h1')).toContainText('Juan')
    
    // Test year selection
    await page.selectOption('select', '2026')
    await page.waitForTimeout(1000)
    
    // Test salary tab
    await page.click('text=Gehalt')
    await expect(page.locator('input[id="salario-anual-bruto"]')).toBeVisible()
    
    // Modify salary
    await page.fill('input[id="salario-anual-bruto"]', '35000')
    await page.click('text=Speichern')
    await page.waitForTimeout(1000)
    
    // Test ingresos tab
    await page.click('text=Zulagen')
    await expect(page.locator('input[id="ingresos-ticket_restaurant"]')).toBeVisible()
    
    // Modify ingresos
    await page.fill('input[id="ingresos-ticket_restaurant"]', '150')
    await page.click('text=Speichern')
    await page.waitForTimeout(1000)
    
    // Test deducciones tab
    await page.click('text=Abzüge')
    await expect(page.locator('input[id="deducciones-seguro_accidentes"]')).toBeVisible()
    
    // Modify deducciones
    await page.fill('input[id="deducciones-seguro_accidentes"]', '35')
    await page.click('text=Speichern')
    await page.waitForTimeout(1000)
    
    // Go back to employee list
    await page.click('text=Zurück')
    await page.waitForURL('**/employees')
    
    // Verify we're back on the list
    await expect(page.locator('text=Mitarbeiter')).toBeVisible()
  })

  test('create new employee', async ({ page }) => {
    // Navigate to employees page
    await page.click('text=Mitarbeiter')
    await page.waitForURL('**/employees')
    
    // Click add employee button
    await page.click('text=Neuer Mitarbeiter')
    
    // Fill employee form
    await page.fill('input[name="nombre"]', 'Test')
    await page.fill('input[name="apellido"]', 'User')
    await page.fill('input[name="ceco"]', '9999')
    
    // Save employee
    await page.click('text=Speichern')
    await page.waitForTimeout(2000)
    
    // Verify employee was created
    await expect(page.locator('text=Test User')).toBeVisible()
  })

  test('export functionality', async ({ page }) => {
    // Navigate to employees page
    await page.click('text=Mitarbeiter')
    await page.waitForURL('**/employees')
    
    // Click export button
    const downloadPromise = page.waitForEvent('download')
    await page.click('text=Excel Export')
    
    // Wait for download
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/gehaltsabrechnung_.*\.xlsx/)
  })

  test('search functionality', async ({ page }) => {
    // Navigate to employees page
    await page.click('text=Mitarbeiter')
    await page.waitForURL('**/employees')
    
    // Search by name
    await page.fill('input[placeholder*="Suchen"]', 'Perez')
    await page.waitForTimeout(500)
    
    // Verify search results
    await expect(page.locator('text=Perez')).toBeVisible()
    
    // Search by CECO
    await page.fill('input[placeholder*="Suchen"]', '1001')
    await page.waitForTimeout(500)
    
    // Verify search results
    await expect(page.locator('text=1001')).toBeVisible()
    
    // Clear search
    await page.fill('input[placeholder*="Suchen"]', '')
    await page.waitForTimeout(500)
    
    // Verify all employees are shown
    await expect(page.locator('table tbody tr')).toHaveCount.greaterThan(0)
  })

  test('responsive design', async ({ page }) => {
    // Navigate to employee details
    await page.click('text=Mitarbeiter')
    await page.waitForURL('**/employees')
    await page.click('text=Juan')
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('h1')).toBeVisible()
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('h1')).toBeVisible()
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('h1')).toBeVisible()
  })

  test('error handling', async ({ page }) => {
    // Mock network failure
    await page.route('**/employees/**', route => route.abort())
    
    // Navigate to employees page
    await page.click('text=Mitarbeiter')
    await page.waitForTimeout(2000)
    
    // Should show error message
    await expect(page.locator('text=Fehler')).toBeVisible()
  })

  test('accessibility', async ({ page }) => {
    // Navigate to employee details
    await page.click('text=Mitarbeiter')
    await page.waitForURL('**/employees')
    await page.click('text=Juan')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
    
    // Test ARIA labels
    await expect(page.locator('[aria-label]')).toHaveCount.greaterThan(0)
    
    // Test semantic HTML
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('nav')).toBeVisible()
  })
})
