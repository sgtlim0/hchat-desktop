/**
 * Repeating DOM pattern detector.
 * Scans parent containers for children with identical structural fingerprints.
 * A "pattern" = 3+ siblings sharing the same DOM structure.
 */

import { shallowFingerprint, fingerprint, selectorPath } from './dom-fingerprint'

export interface DetectedPattern {
  /** CSS selector for the parent container */
  readonly parentSelector: string
  /** Structural fingerprint shared by all members */
  readonly fingerprint: string
  /** Elements matching this pattern */
  readonly members: ReadonlyArray<Element>
  /** Number of repeating items */
  readonly count: number
  /** Data density score (0-1) */
  readonly density: number
  /** Extracted field names (from first member's child tags/labels) */
  readonly fieldHints: ReadonlyArray<string>
  /** Average text length per member */
  readonly avgTextLength: number
}

const MIN_REPEAT_COUNT = 3
const MIN_TEXT_LENGTH = 20
const MAX_SCAN_DEPTH = 6
const MAX_CONTAINERS = 500

const SKIP_CONTAINERS = new Set([
  'NAV', 'HEADER', 'FOOTER', 'SCRIPT', 'STYLE', 'NOSCRIPT',
  'SELECT', 'DATALIST', 'HEAD',
])

/**
 * Detect all repeating patterns in the page.
 * Scans container elements for children with matching fingerprints.
 */
export function detectRepeatingPatterns(root: Element): ReadonlyArray<DetectedPattern> {
  const containers = collectContainers(root, MAX_SCAN_DEPTH)
  const patterns: DetectedPattern[] = []
  const seen = new Set<string>()

  for (const container of containers) {
    const children = Array.from(container.children).filter(
      (c) => !SKIP_CONTAINERS.has(c.tagName) && (c.textContent || '').trim().length > 0,
    )

    if (children.length < MIN_REPEAT_COUNT) continue

    // Group children by shallow fingerprint
    const groups = new Map<string, Element[]>()
    for (const child of children) {
      const fp = shallowFingerprint(child)
      if (!fp) continue
      const group = groups.get(fp) || []
      group.push(child)
      groups.set(fp, group)
    }

    for (const [fp, members] of groups) {
      if (members.length < MIN_REPEAT_COUNT) continue

      // Dedupe: skip if we already found a very similar pattern
      const deepFp = fingerprint(members[0], 2)
      const key = `${deepFp}:${members.length}`
      if (seen.has(key)) continue
      seen.add(key)

      // Check minimum text content
      const avgText =
        members.reduce((sum, m) => sum + (m.textContent || '').trim().length, 0) / members.length
      if (avgText < MIN_TEXT_LENGTH) continue

      const density = computeDensity(members)
      const fieldHints = extractFieldHints(members[0])
      const parentSelector = buildParentSelector(container)

      patterns.push({
        parentSelector,
        fingerprint: fp,
        members,
        count: members.length,
        density,
        fieldHints,
        avgTextLength: Math.round(avgText),
      })
    }
  }

  // Sort by density * count (best datasets first)
  return patterns.sort((a, b) => b.density * b.count - a.density * a.count)
}

/**
 * Collect candidate container elements via BFS (breadth-first).
 */
function collectContainers(root: Element, maxDepth: number): Element[] {
  const containers: Element[] = []
  const queue: Array<{ el: Element; depth: number }> = [{ el: root, depth: 0 }]

  while (queue.length > 0 && containers.length < MAX_CONTAINERS) {
    const item = queue.shift()!
    const { el, depth } = item

    if (SKIP_CONTAINERS.has(el.tagName)) continue

    // A container is a potential dataset parent if it has 3+ element children
    const elementChildren = Array.from(el.children).filter(
      (c) => !SKIP_CONTAINERS.has(c.tagName),
    )
    if (elementChildren.length >= MIN_REPEAT_COUNT) {
      containers.push(el)
    }

    if (depth < maxDepth) {
      for (const child of elementChildren) {
        queue.push({ el: child, depth: depth + 1 })
      }
    }
  }

  return containers
}

/**
 * Compute data density score for a group of repeating elements.
 * Higher score = more likely to be a meaningful dataset.
 */
function computeDensity(members: Element[]): number {
  let totalScore = 0

  for (const member of members.slice(0, 10)) {
    const text = (member.textContent || '').trim()
    const tagCount = member.getElementsByTagName('*').length || 1

    // Text-to-tag ratio (higher = more content per tag)
    const textRatio = Math.min(1, text.length / tagCount / 50)

    // Bonus for containing numbers (suggests data)
    const numberCount = (text.match(/\d+/g) || []).length
    const numberBonus = Math.min(0.3, numberCount * 0.05)

    // Bonus for links (suggests structured records)
    const linkCount = member.querySelectorAll('a[href]').length
    const linkBonus = Math.min(0.2, linkCount * 0.05)

    // Bonus for images (suggests product/article cards)
    const imgCount = member.querySelectorAll('img').length
    const imgBonus = Math.min(0.1, imgCount * 0.05)

    totalScore += textRatio + numberBonus + linkBonus + imgBonus
  }

  const sampleSize = Math.min(members.length, 10)
  return Math.min(1, totalScore / sampleSize)
}

/**
 * Extract field name hints from the first pattern member.
 * Looks at immediate children's tag types and labels.
 */
function extractFieldHints(member: Element): ReadonlyArray<string> {
  const hints: string[] = []
  const children = Array.from(member.children).slice(0, 10)

  for (const child of children) {
    const tag = child.tagName.toLowerCase()

    // Images → "image"
    if (tag === 'img' || child.querySelector('img')) {
      hints.push('image')
      continue
    }

    // Links → use link text or "link"
    if (tag === 'a') {
      hints.push('link')
      continue
    }

    // Headings → "title"
    if (/^h[1-6]$/.test(tag)) {
      hints.push('title')
      continue
    }

    // Time → "date"
    if (tag === 'time') {
      hints.push('date')
      continue
    }

    // Text content — use class name or generic label
    const text = (child.textContent || '').trim()
    if (text.length > 0 && text.length < 200) {
      const className = Array.from(child.classList)
        .find((c) => c.length > 2 && c.length < 20 && !/^[a-z]{1,2}-/.test(c))
      hints.push(className || `field_${hints.length}`)
    }
  }

  return hints.slice(0, 8)
}

/**
 * Build a reasonable CSS selector for a container element.
 */
function buildParentSelector(el: Element): string {
  const parts: string[] = []
  let current: Element | null = el
  let depth = 0

  while (current && depth < 3) {
    parts.unshift(selectorPath(current))
    current = current.parentElement
    depth++
  }

  return parts.join(' > ')
}
