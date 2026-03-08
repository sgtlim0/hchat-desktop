import { test, expect } from '@playwright/test'

test.describe('Search Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should open search modal with Cmd+K keyboard shortcut', async ({ page }) => {
    await page.keyboard.press('Meta+KeyK')

    const searchInput = page.getByPlaceholder(/search/i)
      .or(page.locator('[data-testid="search-input"]'))

    await expect(searchInput).toBeVisible()
  })

  test('should autofocus search input when modal opens', async ({ page }) => {
    await page.keyboard.press('Meta+KeyK')

    const searchInput = page.getByPlaceholder(/search/i)
      .or(page.locator('[data-testid="search-input"]'))

    await expect(searchInput).toBeVisible()
    await expect(searchInput).toBeFocused()
  })

  test('should close search modal with Escape key', async ({ page }) => {
    // Open search modal
    await page.keyboard.press('Meta+KeyK')

    const searchInput = page.getByPlaceholder(/search/i)
      .or(page.locator('[data-testid="search-input"]'))

    await expect(searchInput).toBeVisible()

    // Close with Escape
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300) // Wait for animation

    // Search modal should be closed
    await expect(searchInput).not.toBeVisible()
  })

  test('should show results area when typing query', async ({ page }) => {
    await page.keyboard.press('Meta+KeyK')

    const searchInput = page.getByPlaceholder(/search/i)
      .or(page.locator('[data-testid="search-input"]'))

    await expect(searchInput).toBeVisible()

    // Type a search query
    await searchInput.fill('test query')
    await page.waitForTimeout(500) // Wait for debounce

    // Results area should be visible
    const resultsArea = page.locator('[data-testid="search-results"]')
      .or(page.locator('.search-results'))
      .or(page.locator('[role="listbox"]'))
      .or(page.locator('div').filter({ hasText: /no results|results/i }))

    await expect(resultsArea).toBeVisible()
  })

  test('should clear search input when reopening modal', async ({ page }) => {
    // Open search modal
    await page.keyboard.press('Meta+KeyK')

    const searchInput = page.getByPlaceholder(/search/i)
      .or(page.locator('[data-testid="search-input"]'))

    // Type something
    await searchInput.fill('test query')
    await expect(searchInput).toHaveValue('test query')

    // Close modal
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)

    // Reopen modal
    await page.keyboard.press('Meta+KeyK')

    // Input should be cleared
    await expect(searchInput).toHaveValue('')
  })

  test('should allow typing immediately after opening', async ({ page }) => {
    await page.keyboard.press('Meta+KeyK')

    // Start typing immediately (since input is autofocused)
    await page.keyboard.type('hello world')

    const searchInput = page.getByPlaceholder(/search/i)
      .or(page.locator('[data-testid="search-input"]'))

    await expect(searchInput).toHaveValue('hello world')
  })

  test('should handle special characters in search query', async ({ page }) => {
    await page.keyboard.press('Meta+KeyK')

    const searchInput = page.getByPlaceholder(/search/i)
      .or(page.locator('[data-testid="search-input"]'))

    // Type query with special characters
    const specialQuery = '@#$% test & "quotes" <tags>'
    await searchInput.fill(specialQuery)

    await expect(searchInput).toHaveValue(specialQuery)
  })
})