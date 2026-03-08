import { test, expect } from '@playwright/test'

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should open settings with Cmd+, keyboard shortcut', async ({ page }) => {
    await page.keyboard.press('Meta+Comma')

    const settingsHeading = page.getByRole('heading', { name: /settings/i })
    await expect(settingsHeading).toBeVisible()
  })

  test('should display dark mode toggle', async ({ page }) => {
    await page.keyboard.press('Meta+Comma')

    const darkModeToggle = page.getByRole('switch', { name: /dark mode/i })
      .or(page.getByText(/dark mode/i))
      .or(page.locator('[data-testid="dark-mode-toggle"]'))

    await expect(darkModeToggle).toBeVisible()
  })

  test('should toggle dark mode', async ({ page }) => {
    await page.keyboard.press('Meta+Comma')

    const darkModeToggle = page.getByRole('switch', { name: /dark mode/i })
      .or(page.locator('[data-testid="dark-mode-toggle"]'))
      .or(page.locator('button').filter({ hasText: /dark mode/i }))

    // Get initial state
    const initialClasses = await page.locator('html').getAttribute('class')

    // Toggle dark mode
    await darkModeToggle.click()
    await page.waitForTimeout(300) // Wait for theme transition

    // Check if classes changed
    const newClasses = await page.locator('html').getAttribute('class')
    expect(newClasses).not.toBe(initialClasses)
  })

  test('should display language selector', async ({ page }) => {
    await page.keyboard.press('Meta+Comma')

    const languageSelector = page.getByRole('combobox', { name: /language/i })
      .or(page.getByText(/language/i))
      .or(page.locator('[data-testid="language-selector"]'))
      .or(page.locator('select').filter({ hasText: /english|korean/i }))

    await expect(languageSelector).toBeVisible()
  })

  test('should display model selector in settings', async ({ page }) => {
    await page.keyboard.press('Meta+Comma')

    const modelSelector = page.getByRole('combobox', { name: /default model/i })
      .or(page.getByText(/default model/i))
      .or(page.locator('[data-testid="default-model-selector"]'))
      .or(page.locator('select').filter({ hasText: /claude|gpt|gemini/i }))

    await expect(modelSelector).toBeVisible()
  })

  test('should close settings with Escape key', async ({ page }) => {
    // Open settings
    await page.keyboard.press('Meta+Comma')
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible()

    // Close with Escape
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300) // Wait for animation

    // Settings should be closed
    await expect(page.getByRole('heading', { name: /settings/i })).not.toBeVisible()

    // Should be back on home
    const greeting = page.getByText(/Good (morning|afternoon|evening)/)
    await expect(greeting).toBeVisible()
  })

  test('should return to previous view after closing settings', async ({ page }) => {
    // Navigate to all chats first
    const allChatsButton = page.getByRole('button', { name: /all chats/i })
      .or(page.getByText(/all chats/i))

    await allChatsButton.click()
    await expect(page.getByRole('heading', { name: /all chats/i })).toBeVisible()

    // Open settings
    await page.keyboard.press('Meta+Comma')
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible()

    // Close settings
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)

    // Should be back on all chats view
    await expect(page.getByRole('heading', { name: /all chats/i })).toBeVisible()
  })

  test('should display settings tabs', async ({ page }) => {
    await page.keyboard.press('Meta+Comma')

    // Check for common settings tabs
    const generalTab = page.getByRole('tab', { name: /general/i })
      .or(page.getByText(/general/i))

    const usageTab = page.getByRole('tab', { name: /usage/i })
      .or(page.getByText(/usage/i))

    await expect(generalTab.or(usageTab)).toBeVisible()
  })
})