/**
 * Readability-based text extraction from HTML documents.
 *
 * Inspired by Mozilla Readability — scores DOM elements by
 * text density, link density, and semantic tags to extract
 * the main content from noisy web pages.
 */

const TAG_SCORES: Record<string, number> = {
  ARTICLE: 25,
  MAIN: 20,
  SECTION: 10,
  DIV: 5,
  P: 25,
  TD: 3,
  PRE: 3,
  BLOCKQUOTE: 3,
}

const POSITIVE_PATTERNS = [
  'article', 'body', 'content', 'entry', 'hentry',
  'main', 'page', 'post', 'text', 'blog', 'story',
]

const NEGATIVE_PATTERNS = [
  'ad', 'banner', 'comment', 'footer', 'header',
  'menu', 'nav', 'remark', 'sidebar', 'sponsor',
  'social', 'widget', 'related', 'recommend',
]

const NOISE_SELECTORS = [
  'script', 'style', 'noscript', 'iframe',
  'nav', 'header', 'footer',
  '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
  '[class*="cookie"]', '[id*="cookie"]',
  '[class*="popup"]', '[class*="modal"]', '[class*="overlay"]',
  '[class*="advertisement"]', '[class*=" ad-"]',
  '[id*="google_ads"]', 'ins.adsbygoogle',
  '[class*="share"]', '[class*="social"]',
  '[id*="comment"]', '[class*="comment"]',
]

interface BlockScore {
  element: Element
  score: number
  textLength: number
  linkDensity: number
}

export function scoreElement(el: Element): number {
  let score = TAG_SCORES[el.tagName] ?? 0

  const identifier = `${el.className} ${el.id}`.toLowerCase()
  for (const p of POSITIVE_PATTERNS) {
    if (identifier.includes(p)) score += 25
  }
  for (const p of NEGATIVE_PATTERNS) {
    if (identifier.includes(p)) score -= 25
  }

  return score
}

export function getLinkDensity(el: Element): number {
  const textLength = el.textContent?.length ?? 0
  if (textLength === 0) return 0

  let linkLength = 0
  const links = el.querySelectorAll('a')
  for (let i = 0; i < links.length; i++) {
    linkLength += links[i].textContent?.length ?? 0
  }

  return linkLength / textLength
}

export function getParagraphScore(el: Element): number {
  const paragraphs = el.querySelectorAll('p')
  let score = 0

  for (let i = 0; i < paragraphs.length; i++) {
    const text = paragraphs[i].textContent?.trim() ?? ''
    if (text.length < 25) continue

    score += 1
    const commas = (text.match(/[,，、]/g) ?? []).length
    score += Math.min(commas, 3)
  }

  return score
}

export function removeNoise(doc: Document): void {
  for (const selector of NOISE_SELECTORS) {
    const elements = doc.querySelectorAll(selector)
    for (let i = 0; i < elements.length; i++) {
      elements[i].remove()
    }
  }
}

export function collectCandidates(doc: Document): BlockScore[] {
  const candidates: BlockScore[] = []
  const blockTags = ['DIV', 'P', 'TD', 'ARTICLE', 'MAIN', 'SECTION']

  const elements = doc.querySelectorAll(blockTags.join(','))
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    const textLength = el.textContent?.trim().length ?? 0
    if (textLength < 80) continue

    const linkDensity = getLinkDensity(el)
    if (linkDensity > 0.5) continue

    const score = scoreElement(el) + getParagraphScore(el) - linkDensity * 10
    candidates.push({ element: el, score, textLength, linkDensity })
  }

  return candidates
}

function mergeRelatedSiblings(el: Element): string {
  const parent = el.parentElement
  if (!parent) return el.textContent ?? ''

  const siblings = Array.from(parent.children)
  const related = siblings.filter((sib) => {
    if (sib === el) return true
    const sibScore = scoreElement(sib) + getParagraphScore(sib)
    return sibScore > 10 && getLinkDensity(sib) < 0.3
  })

  return related.map((sib) => sib.textContent ?? '').join('\n\n')
}

export function cleanText(raw: string, maxLength = 8000): string {
  return raw
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .slice(0, maxLength)
    .trim()
}

export type PageType = 'article' | 'product' | 'doc' | 'general'

export function detectPageType(url: string, doc: Document): PageType {
  if (/\/(article|post|news|blog)\//.test(url)) return 'article'
  if (/\/(product|item|p\/|dp\/)/.test(url)) return 'product'
  if (/\/(docs?|guide|reference|api)/.test(url)) return 'doc'

  const ogType = doc.querySelector('meta[property="og:type"]')?.getAttribute('content') ?? ''
  if (ogType === 'article') return 'article'
  if (ogType === 'product') return 'product'

  if (doc.querySelector('article')) return 'article'
  if (doc.querySelector('[itemtype*="Product"]')) return 'product'

  return 'general'
}

export function extractMainContent(doc: Document, maxLength = 8000): string {
  const clone = doc.cloneNode(true) as Document
  removeNoise(clone)

  const candidates = collectCandidates(clone)

  if (candidates.length === 0) {
    return cleanText(clone.body?.textContent ?? '', maxLength)
  }

  candidates.sort((a, b) => b.score - a.score)
  const best = candidates[0]
  const content = mergeRelatedSiblings(best.element)

  return cleanText(content, maxLength)
}
