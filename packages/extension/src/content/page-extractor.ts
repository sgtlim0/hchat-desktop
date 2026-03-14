const MAX_TEXT_LENGTH = 100_000

const NOISE_SELECTORS = [
  'nav',
  'footer',
  'header',
  'script',
  'style',
  'noscript',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
  '.ad',
  '.ads',
  '.advertisement',
  '.cookie-banner',
  '.popup',
] as const

interface PageContent {
  readonly url: string
  readonly title: string
  readonly text: string
}

function removeNoiseElements(clone: HTMLElement): void {
  for (const selector of NOISE_SELECTORS) {
    const elements = clone.querySelectorAll(selector)
    for (const el of elements) {
      el.remove()
    }
  }
}

export function extractPageContent(): PageContent {
  const clone = document.body.cloneNode(true) as HTMLElement
  removeNoiseElements(clone)

  const rawText = clone.innerText || ''
  const text =
    rawText.length > MAX_TEXT_LENGTH
      ? rawText.slice(0, MAX_TEXT_LENGTH) + '\n\n[...truncated]'
      : rawText

  return {
    url: location.href,
    title: document.title,
    text,
  }
}
