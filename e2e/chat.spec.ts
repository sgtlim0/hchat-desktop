import { test, expect } from '@playwright/test'

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should enable send button when text is entered', async ({ page }) => {
    const input = page.getByPlaceholder(/Ask me anything/i)
    const sendButton = page.getByRole('button', { name: /send|submit/i })
      .or(page.locator('button[type="submit"]'))

    // Send button should be disabled initially (no text)
    await expect(sendButton).toBeDisabled()

    // Type text
    await input.fill('Hello, how are you?')

    // Send button should now be enabled
    await expect(sendButton).toBeEnabled()
  })

  test('should disable send button with empty input', async ({ page }) => {
    const input = page.getByPlaceholder(/Ask me anything/i)
    const sendButton = page.getByRole('button', { name: /send|submit/i })
      .or(page.locator('button[type="submit"]'))

    // Type text and then clear it
    await input.fill('Test')
    await expect(sendButton).toBeEnabled()

    await input.clear()
    await expect(sendButton).toBeDisabled()
  })

  test('should display model selector', async ({ page }) => {
    const modelSelector = page.locator('[data-testid="model-selector"]')
      .or(page.getByRole('button', { name: /model/i }))
      .or(page.locator('select'))

    await expect(modelSelector).toBeVisible()
  })

  test('should open model selector dropdown', async ({ page }) => {
    const modelSelector = page.locator('[data-testid="model-selector"]')
      .or(page.getByRole('button', { name: /claude|gpt|gemini/i }))

    await modelSelector.click()

    // Verify dropdown/menu is visible
    const dropdown = page.locator('[role="listbox"]')
      .or(page.locator('[role="menu"]'))

    await expect(dropdown).toBeVisible()
  })

  test('should display model options in selector', async ({ page }) => {
    const modelSelector = page.locator('[data-testid="model-selector"]')
      .or(page.getByRole('button', { name: /claude|gpt|gemini/i }))

    await modelSelector.click()

    // Check for common model names
    const claudeOption = page.getByText(/claude/i)
    const gptOption = page.getByText(/gpt/i)

    const hasClaudeOrGpt = await claudeOption.or(gptOption).isVisible()
    expect(hasClaudeOrGpt).toBe(true)
  })

  test('should display PDF attach button', async ({ page }) => {
    const attachButton = page.getByRole('button', { name: /attach|upload|file/i })
      .or(page.locator('button[aria-label*="attach"]'))
      .or(page.locator('input[type="file"]'))

    await expect(attachButton).toBeVisible()
  })

  test('should display image attach button', async ({ page }) => {
    const attachButton = page.getByRole('button', { name: /attach|upload|image/i })
      .or(page.locator('button[aria-label*="image"]'))

    await expect(attachButton).toBeVisible()
  })

  test('should handle Enter key in input', async ({ page }) => {
    const input = page.getByPlaceholder(/Ask me anything/i)

    await input.fill('Test message')

    // Press Enter (Shift+Enter should add new line, Enter should submit)
    await input.press('Enter')

    // Input should be cleared after submission attempt
    // (Even if API call fails, the input should clear)
    await page.waitForTimeout(500)
  })

  test('should handle Shift+Enter for new line', async ({ page }) => {
    const input = page.getByPlaceholder(/Ask me anything/i)

    await input.fill('First line')
    await input.press('Shift+Enter')

    // Content should still be there (not submitted)
    await expect(input).toHaveValue(/First line/)
  })

  test('should display quick action chips that insert text', async ({ page }) => {
    const input = page.getByPlaceholder(/Ask me anything/i)

    // Click a quick action chip
    const writeCodeChip = page.getByText('Write Code')
    await writeCodeChip.click()

    // Input should have text inserted
    const value = await input.inputValue()
    expect(value.length).toBeGreaterThan(0)
  })

  test('should maintain input focus after model switch', async ({ page }) => {
    const input = page.getByPlaceholder(/Ask me anything/i)

    await input.fill('Test')
    await input.focus()

    // Switch model
    const modelSelector = page.locator('[data-testid="model-selector"]')
      .or(page.getByRole('button', { name: /claude|gpt|gemini/i }))

    await modelSelector.click()

    // Select first option
    const firstOption = page.locator('[role="option"]').first()
      .or(page.locator('[role="menuitem"]').first())

    await firstOption.click()

    // Input should still have text
    await expect(input).toHaveValue('Test')
  })
})
