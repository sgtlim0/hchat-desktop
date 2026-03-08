import { test, expect } from '@playwright/test'

test.describe('Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display sidebar on initial load', async ({ page }) => {
    const sidebar = page.locator('[data-testid="sidebar"]')
      .or(page.locator('aside'))
      .or(page.locator('.sidebar'))

    await expect(sidebar).toBeVisible()
  })

  test('should toggle sidebar with Cmd+B keyboard shortcut', async ({ page }) => {
    const sidebar = page.locator('[data-testid="sidebar"]')
      .or(page.locator('aside'))

    // Sidebar should be visible initially
    await expect(sidebar).toBeVisible()

    // Toggle sidebar closed
    await page.keyboard.press('Meta+KeyB')
    await page.waitForTimeout(300) // Wait for animation

    // Check if sidebar is hidden (might still be in DOM but transformed off-screen)
    const sidebarClasses = await sidebar.getAttribute('class')
    const isHidden = sidebarClasses?.includes('translate-x-[-100%]') ||
                     sidebarClasses?.includes('-translate-x-full') ||
                     !(await sidebar.isVisible())

    expect(isHidden).toBeTruthy()

    // Toggle sidebar open again
    await page.keyboard.press('Meta+KeyB')
    await page.waitForTimeout(300)

    await expect(sidebar).toBeVisible()
  })

  test('should display new chat button', async ({ page }) => {
    const newChatButton = page.getByRole('button', { name: /new chat/i })
      .or(page.locator('button').filter({ hasText: /new chat/i }))
      .or(page.locator('[aria-label*="New chat"]'))

    await expect(newChatButton).toBeVisible()
  })

  test('should display session list section', async ({ page }) => {
    const sessionList = page.locator('[data-testid="session-list"]')
      .or(page.locator('.session-list'))
      .or(page.getByRole('list').filter({ has: page.locator('[role="listitem"]') }))
      .or(page.locator('div').filter({ hasText: /recent chats/i }))

    await expect(sessionList).toBeVisible()
  })

  test('should display sidebar tools section', async ({ page }) => {
    const toolsSection = page.locator('[data-testid="sidebar-tools"]')
      .or(page.getByText(/tools/i))
      .or(page.locator('nav').filter({ has: page.getByText(/all chats|settings|projects/i) }))

    await expect(toolsSection).toBeVisible()
  })

  test('should have clickable settings button in sidebar', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: /settings/i })
      .or(page.locator('[aria-label*="Settings"]'))

    await expect(settingsButton).toBeVisible()
    await expect(settingsButton).toBeEnabled()

    // Click settings
    await settingsButton.click()

    // Verify settings opened
    const settingsHeading = page.getByRole('heading', { name: /settings/i })
    await expect(settingsHeading).toBeVisible()
  })

  test('should have clickable all chats button in sidebar', async ({ page }) => {
    const allChatsButton = page.getByRole('button', { name: /all chats/i })
      .or(page.getByText(/all chats/i))

    await expect(allChatsButton).toBeVisible()
    await expect(allChatsButton).toBeEnabled()

    // Click all chats
    await allChatsButton.click()

    // Verify navigation to all chats
    const allChatsHeading = page.getByRole('heading', { name: /all chats/i })
    await expect(allChatsHeading).toBeVisible()
  })

  test('should maintain sidebar state during navigation', async ({ page }) => {
    // Close sidebar
    await page.keyboard.press('Meta+KeyB')
    await page.waitForTimeout(300)

    // Navigate to settings
    await page.keyboard.press('Meta+Comma')
    await page.waitForTimeout(300)

    // Sidebar should still be closed
    const sidebar = page.locator('[data-testid="sidebar"]')
      .or(page.locator('aside'))

    const sidebarClasses = await sidebar.getAttribute('class')
    const isHidden = sidebarClasses?.includes('translate-x-[-100%]') ||
                     sidebarClasses?.includes('-translate-x-full')

    expect(isHidden).toBeTruthy()
  })
})