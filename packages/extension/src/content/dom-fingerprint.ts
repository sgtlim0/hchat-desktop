/**
 * DOM subtree fingerprinting — structural hash for pattern matching.
 * Fingerprint captures tag structure without content, enabling
 * detection of repeating UI patterns (cards, rows, list items).
 */

const IGNORE_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'BR', 'HR', 'WBR'])

/**
 * Generate a structural fingerprint for an element.
 * Format: "tag.Nc.Nch{child1,child2,...}" where:
 * - tag = lowercase tag name
 * - Nc = number of CSS classes
 * - Nch = number of meaningful children
 * - child1,child2 = recursive child fingerprints (depth-limited)
 */
export function fingerprint(el: Element, maxDepth: number = 3): string {
  if (maxDepth <= 0) return el.tagName.toLowerCase()
  if (IGNORE_TAGS.has(el.tagName)) return ''

  const tag = el.tagName.toLowerCase()
  const classCount = el.classList.length
  const children = Array.from(el.children).filter((c) => !IGNORE_TAGS.has(c.tagName))
  const childCount = children.length

  if (childCount === 0) {
    return `${tag}.${classCount}c`
  }

  const childPrints = children
    .slice(0, 10) // limit to first 10 children for performance
    .map((c) => fingerprint(c, maxDepth - 1))
    .filter(Boolean)

  return `${tag}.${classCount}c.${childCount}ch{${childPrints.join(',')}}`
}

/**
 * Generate a shallow fingerprint (depth 1) for quick sibling comparison.
 * Only considers immediate structure, not deep nesting.
 */
export function shallowFingerprint(el: Element): string {
  if (IGNORE_TAGS.has(el.tagName)) return ''

  const tag = el.tagName.toLowerCase()
  const classCount = el.classList.length
  const children = Array.from(el.children).filter((c) => !IGNORE_TAGS.has(c.tagName))
  const childTags = children.slice(0, 15).map((c) => c.tagName.toLowerCase())

  return `${tag}.${classCount}c[${childTags.join(',')}]`
}

/**
 * Compare two fingerprints and return similarity score (0-1).
 * Exact match = 1.0, completely different = 0.0.
 */
export function fingerprintSimilarity(a: string, b: string): number {
  if (a === b) return 1.0
  if (!a || !b) return 0.0

  // Jaccard similarity on character-level trigrams
  const trigramsA = toTrigrams(a)
  const trigramsB = toTrigrams(b)

  const intersection = new Set([...trigramsA].filter((t) => trigramsB.has(t)))
  const union = new Set([...trigramsA, ...trigramsB])

  return union.size === 0 ? 0 : intersection.size / union.size
}

function toTrigrams(s: string): Set<string> {
  const trigrams = new Set<string>()
  for (let i = 0; i <= s.length - 3; i++) {
    trigrams.add(s.slice(i, i + 3))
  }
  return trigrams
}

/**
 * Extract a CSS selector path for an element relative to its parent.
 * Used for re-selecting pattern members after discovery.
 */
export function selectorPath(el: Element): string {
  const tag = el.tagName.toLowerCase()
  const classes = Array.from(el.classList)
    .filter((c) => !c.startsWith('js-') && c.length < 30)
    .slice(0, 3)

  if (classes.length > 0) {
    return `${tag}.${classes.join('.')}`
  }

  const parent = el.parentElement
  if (parent) {
    const siblings = Array.from(parent.children).filter((c) => c.tagName === el.tagName)
    if (siblings.length > 1) {
      const idx = siblings.indexOf(el)
      return `${tag}:nth-of-type(${idx + 1})`
    }
  }

  return tag
}
