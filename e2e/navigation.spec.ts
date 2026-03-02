import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should navigate to settings via sidebar', async ({ page }) => {
    // Click settings button in sidebar
    const settingsButton = page.getByRole('button', { name: /settings/i })
      .or(page.locator('[aria-label*="Settings"]'))

    await settingsButton.click()

    // Verify settings panel/modal is visible
    const settingsHeading = page.getByRole('heading', { name: /settings/i })
    await expect(settingsHeading).toBeVisible()
  })

  test('should open settings with Cmd+,', async ({ page }) => {
    await page.keyboard.press('Meta+Comma')

    const settingsHeading = page.getByRole('heading', { name: /settings/i })
    await expect(settingsHeading).toBeVisible()
  })

  test('should navigate to all chats', async ({ page }) => {
    const allChatsButton = page.getByRole('button', { name: /all chats/i })
      .or(page.getByText(/all chats/i))

    await allChatsButton.click()

    // Verify we're on all chats view
    const heading = page.getByRole('heading', { name: /all chats/i })
    await expect(heading).toBeVisible()
  })

  test('should navigate back to home', async ({ page }) => {
    // Navigate away first
    const allChatsButton = page.getByRole('button', { name: /all chats/i })
      .or(page.getByText(/all chats/i))

    await allChatsButton.click()

    // Navigate back to home
    const homeButton = page.getByRole('button', { name: /home/i })
      .or(page.locator('[aria-label*="Home"]'))

    await homeButton.click()

    // Verify we're back on home
    const greeting = page.getByText(/Good (morning|afternoon|evening)/)
    await expect(greeting).toBeVisible()
  })

  test('should open search modal with Cmd+K', async ({ page }) => {
    await page.keyboard.press('Meta+KeyK')

    // Verify search modal is visible
    const searchInput = page.getByPlaceholder(/search/i)
    await expect(searchInput).toBeVisible()
  })

  test('should close search modal with Escape', async ({ page }) => {
    await page.keyboard.press('Meta+KeyK')

    const searchInput = page.getByPlaceholder(/search/i)
    await expect(searchInput).toBeVisible()

    await page.keyboard.press('Escape')

    // Search modal should be hidden
    await expect(searchInput).not.toBeVisible()
  })

  test('should maintain view state during navigation', async ({ page }) => {
    // Navigate to settings
    await page.keyboard.press('Meta+Comma')
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible()

    // Close settings (should return to previous view)
    await page.keyboard.press('Escape')

    // Should be back on home
    const greeting = page.getByText(/Good (morning|afternoon|evening)/)
    await expect(greeting).toBeVisible()
  })
})
