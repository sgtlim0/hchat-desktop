import { test, expect } from '@playwright/test'

test.describe('Tools Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display header tabs', async ({ page }) => {
    const headerTabs = page.locator('[data-testid="header-tabs"]')
      .or(page.locator('nav').filter({ has: page.getByText(/translate|ocr|doc writer/i) }))
      .or(page.locator('.header-tabs'))

    await expect(headerTabs).toBeVisible()
  })

  test('should navigate to translate page', async ({ page }) => {
    const translateButton = page.getByRole('button', { name: /translate/i })
      .or(page.getByRole('tab', { name: /translate/i }))
      .or(page.locator('[data-testid="translate-tab"]'))

    await expect(translateButton).toBeVisible()
    await translateButton.click()

    // Verify we're on translate page
    const translateHeading = page.getByRole('heading', { name: /translate/i })
      .or(page.getByText(/document translation/i))
      .or(page.locator('[data-testid="translate-view"]'))

    await expect(translateHeading).toBeVisible()
  })

  test('should navigate to OCR page', async ({ page }) => {
    const ocrButton = page.getByRole('button', { name: /ocr/i })
      .or(page.getByRole('tab', { name: /ocr/i }))
      .or(page.locator('[data-testid="ocr-tab"]'))

    await expect(ocrButton).toBeVisible()
    await ocrButton.click()

    // Verify we're on OCR page
    const ocrHeading = page.getByRole('heading', { name: /ocr|text extraction/i })
      .or(page.getByText(/extract text from image/i))
      .or(page.locator('[data-testid="ocr-view"]'))

    await expect(ocrHeading).toBeVisible()
  })

  test('should navigate to doc-writer page', async ({ page }) => {
    const docWriterButton = page.getByRole('button', { name: /doc writer/i })
      .or(page.getByRole('tab', { name: /doc writer/i }))
      .or(page.locator('[data-testid="doc-writer-tab"]'))

    await expect(docWriterButton).toBeVisible()
    await docWriterButton.click()

    // Verify we're on doc-writer page
    const docWriterHeading = page.getByRole('heading', { name: /doc writer|document writer/i })
      .or(page.getByText(/ai document writer/i))
      .or(page.locator('[data-testid="doc-writer-view"]'))

    await expect(docWriterHeading).toBeVisible()
  })

  test('should maintain active tab state', async ({ page }) => {
    const translateButton = page.getByRole('button', { name: /translate/i })
      .or(page.getByRole('tab', { name: /translate/i }))

    // Navigate to translate
    await translateButton.click()
    await page.waitForTimeout(300)

    // Check if translate tab is marked as active
    const translateButtonClasses = await translateButton.getAttribute('class')
    const translateAriaSelected = await translateButton.getAttribute('aria-selected')

    const isActive = translateButtonClasses?.includes('active') ||
                     translateButtonClasses?.includes('selected') ||
                     translateAriaSelected === 'true'

    expect(isActive).toBeTruthy()
  })

  test('should navigate back to chat from tools', async ({ page }) => {
    // Navigate to translate first
    const translateButton = page.getByRole('button', { name: /translate/i })
      .or(page.getByRole('tab', { name: /translate/i }))

    await translateButton.click()
    await expect(page.getByRole('heading', { name: /translate/i })).toBeVisible()

    // Navigate back to chat/home
    const chatButton = page.getByRole('button', { name: /chat|home/i })
      .or(page.getByRole('tab', { name: /chat/i }))
      .or(page.locator('[aria-label*="Home"]'))

    await chatButton.click()

    // Verify we're back on home/chat
    const greeting = page.getByText(/Good (morning|afternoon|evening)/)
      .or(page.getByPlaceholder(/Ask me anything/i))

    await expect(greeting).toBeVisible()
  })

  test('should display tool-specific content after navigation', async ({ page }) => {
    // Navigate to OCR
    const ocrButton = page.getByRole('button', { name: /ocr/i })
      .or(page.getByRole('tab', { name: /ocr/i }))

    await ocrButton.click()

    // Look for OCR-specific elements
    const uploadButton = page.getByRole('button', { name: /upload|select image/i })
      .or(page.locator('input[type="file"]'))
      .or(page.getByText(/drag.*drop|choose.*file/i))

    await expect(uploadButton).toBeVisible()
  })
})