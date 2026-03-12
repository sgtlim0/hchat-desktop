import { test, expect } from '@playwright/test'

test.describe('Home Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load with greeting text', async ({ page }) => {
    const greeting = page.getByText(/Good (morning|afternoon|evening)/)
    await expect(greeting).toBeVisible()
  })

  test('should display quick action chips', async ({ page }) => {
    await expect(page.getByText('Write Code')).toBeVisible()
    await expect(page.getByText('Summarize')).toBeVisible()
    await expect(page.getByText('Translate')).toBeVisible()
    await expect(page.getByText('Brainstorm')).toBeVisible()
    await expect(page.getByText('Code Review')).toBeVisible()
  })

  test('should display prompt input', async ({ page }) => {
    const input = page.getByPlaceholder(/Ask me anything/i)
    await expect(input).toBeVisible()
  })

  test('should toggle sidebar with Cmd+B', async ({ page }) => {
    // Toggle sidebar closed
    await page.keyboard.press('Meta+KeyB')
    await page.waitForTimeout(300) // Wait for animation

    // Toggle sidebar open again
    await page.keyboard.press('Meta+KeyB')
    await page.waitForTimeout(300)
  })

  test('should have functional prompt input', async ({ page }) => {
    const input = page.getByPlaceholder(/Ask me anything/i)

    await input.fill('Test message')
    await expect(input).toHaveValue('Test message')

    await input.clear()
    await expect(input).toHaveValue('')
  })

  test('should display send button', async ({ page }) => {
    const sendButton = page.getByRole('button', { name: /send|submit/i })
      .or(page.locator('button[type="submit"]'))

    await expect(sendButton).toBeVisible()
  })
})
