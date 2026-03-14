const NOISE_SELECTORS = [
  'nav',
  'footer',
  'header',
  'script',
  'style',
  'noscript',
  'iframe',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
  '.ad',
  '.ads',
  '.advertisement',
  '.cookie-banner',
  '.popup',
  '.sidebar',
  '.social-share',
  '.related-posts',
  '.comments',
] as const

/**
 * Compute content density score (0-1) for an element.
 * Higher = more meaningful text relative to HTML structure.
 */
export function computeContentDensity(root: Element): number {
  const clone = root.cloneNode(true) as HTMLElement
  removeNoise(clone)

  const textLength = (clone.textContent || '').trim().length
  const tagCount = clone.getElementsByTagName('*').length

  if (tagCount === 0) return textLength > 0 ? 1 : 0

  // Text-to-tag ratio: good articles have high ratio
  const ratio = textLength / tagCount
  // Normalize to 0-1 range (typical range: 5-100 chars/tag)
  return Math.min(1, ratio / 80)
}

/**
 * Estimate reading time in minutes.
 * Average reading speed: 200 words/min (Korean), 250 words/min (English).
 */
export function estimateReadingTime(text: string, language: string): number {
  if (!text) return 0

  const isKorean = language.startsWith('ko')
  // Korean: count characters (~2 chars/word), English: count words
  const wordCount = isKorean
    ? text.replace(/\s/g, '').length / 2
    : text.split(/\s+/).filter(Boolean).length

  const wordsPerMinute = isKorean ? 200 : 250
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

/**
 * Find the main content element by content density scoring.
 * Returns the element with the highest text density among candidate containers.
 */
export function findMainContent(root: Element): Element {
  const candidates = root.querySelectorAll(
    'article, main, [role="main"], .content, .post, .article, .entry-content, #content, #main',
  )

  if (candidates.length === 0) return root

  let bestEl: Element = root
  let bestScore = 0

  for (const candidate of candidates) {
    const text = (candidate.textContent || '').trim()
    if (text.length < 100) continue

    const score = computeContentDensity(candidate) * Math.log10(text.length + 1)
    if (score > bestScore) {
      bestScore = score
      bestEl = candidate
    }
  }

  return bestEl
}

/**
 * Remove noise elements in-place from a cloned DOM.
 */
export function removeNoise(clone: HTMLElement): void {
  for (const selector of NOISE_SELECTORS) {
    const elements = clone.querySelectorAll(selector)
    for (const el of elements) {
      el.remove()
    }
  }
}
