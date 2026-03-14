/**
 * Dataset candidate builder.
 * Takes detected patterns and produces structured dataset candidates
 * with extracted records and field schema.
 */

import type { DetectedPattern } from './pattern-detector'

export interface DatasetField {
  readonly name: string
  readonly selector: string
  readonly sampleValues: ReadonlyArray<string>
  readonly type: 'text' | 'number' | 'link' | 'image' | 'date'
}

export interface DatasetCandidate {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly parentSelector: string
  readonly itemCount: number
  readonly density: number
  readonly fields: ReadonlyArray<DatasetField>
  readonly preview: ReadonlyArray<Record<string, string>>
  readonly pattern: DetectedPattern
}

/**
 * Convert detected patterns into dataset candidates with extracted records.
 */
export function buildCandidates(
  patterns: ReadonlyArray<DetectedPattern>,
): ReadonlyArray<DatasetCandidate> {
  return patterns
    .filter((p) => p.count >= 3 && p.density > 0.1)
    .slice(0, 10) // limit to top 10 candidates
    .map((pattern, idx) => {
      const fields = inferFields(pattern)
      const preview = extractPreview(pattern.members, fields)
      const name = inferDatasetName(pattern, idx)
      const description = buildDescription(pattern, fields)

      return {
        id: `ds-${idx}-${pattern.count}`,
        name,
        description,
        parentSelector: pattern.parentSelector,
        itemCount: pattern.count,
        density: pattern.density,
        fields,
        preview,
        pattern,
      }
    })
}

/**
 * Infer field schema from the first few pattern members.
 */
function inferFields(pattern: DetectedPattern): ReadonlyArray<DatasetField> {
  const sampleMembers = pattern.members.slice(0, 5)
  if (sampleMembers.length === 0) return []

  const first = sampleMembers[0]
  const children = Array.from(first.children).slice(0, 10)
  const fields: DatasetField[] = []

  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    const field = analyzeFieldElement(child, i, sampleMembers)
    if (field) fields.push(field)
  }

  // If no children-based fields, try the element itself as a single text field
  if (fields.length === 0) {
    const samples = sampleMembers
      .map((m) => (m.textContent || '').trim().slice(0, 100))
      .filter(Boolean)
    if (samples.length > 0) {
      fields.push({
        name: 'content',
        selector: ':scope',
        sampleValues: samples.slice(0, 3),
        type: 'text',
      })
    }
  }

  return fields
}

function analyzeFieldElement(
  child: Element,
  index: number,
  allMembers: ReadonlyArray<Element>,
): DatasetField | null {
  const tag = child.tagName.toLowerCase()

  // Collect sample values from corresponding child across members
  const samples: string[] = []
  for (const member of allMembers.slice(0, 5)) {
    const corresponding = member.children[index]
    if (!corresponding) continue

    if (tag === 'img' || corresponding.querySelector('img')) {
      const img = (corresponding.tagName === 'IMG'
        ? corresponding
        : corresponding.querySelector('img')) as HTMLImageElement | null
      if (img?.src) samples.push(img.src)
    } else if (tag === 'a' || corresponding.querySelector('a')) {
      const link = (corresponding.tagName === 'A'
        ? corresponding
        : corresponding.querySelector('a')) as HTMLAnchorElement | null
      if (link?.href) samples.push(link.href)
    } else {
      const text = (corresponding.textContent || '').trim()
      if (text) samples.push(text.slice(0, 100))
    }
  }

  if (samples.length === 0) return null

  const type = inferFieldType(tag, child, samples)
  const name = inferFieldName(child, index, type)
  const selector = buildChildSelector(child, index)

  return { name, selector, sampleValues: samples.slice(0, 3), type }
}

function inferFieldType(
  tag: string,
  el: Element,
  samples: string[],
): 'text' | 'number' | 'link' | 'image' | 'date' {
  if (tag === 'img' || el.querySelector('img')) return 'image'
  if (tag === 'a' || el.querySelector('a')) return 'link'
  if (tag === 'time') return 'date'

  // Check if samples are mostly numeric
  const numericCount = samples.filter((s) => /^[\d,.%$€£¥₩-]+$/.test(s.trim())).length
  if (numericCount > samples.length * 0.5) return 'number'

  // Check if samples look like dates
  const dateCount = samples.filter((s) =>
    /\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(s),
  ).length
  if (dateCount > samples.length * 0.5) return 'date'

  return 'text'
}

function inferFieldName(el: Element, index: number, type: string): string {
  // Try aria-label
  const ariaLabel = el.getAttribute('aria-label')
  if (ariaLabel && ariaLabel.length < 20) return ariaLabel

  // Try class name
  const className = Array.from(el.classList)
    .find((c) => c.length > 2 && c.length < 25 && !/^[a-z]{1,2}-|^css-/.test(c))
  if (className) return className.replace(/[-_]/g, ' ')

  // Try heading tag
  if (/^h[1-6]$/.test(el.tagName.toLowerCase())) return 'title'

  // Fall back to type-based name
  if (type === 'image') return 'image'
  if (type === 'link') return 'link'
  if (type === 'date') return 'date'

  return `field_${index}`
}

function buildChildSelector(el: Element, index: number): string {
  const tag = el.tagName.toLowerCase()
  const classes = Array.from(el.classList)
    .filter((c) => c.length < 25 && !/^css-/.test(c))
    .slice(0, 2)

  if (classes.length > 0) return `${tag}.${classes.join('.')}`
  return `:scope > :nth-child(${index + 1})`
}

/**
 * Extract preview records from pattern members using inferred fields.
 */
function extractPreview(
  members: ReadonlyArray<Element>,
  fields: ReadonlyArray<DatasetField>,
): ReadonlyArray<Record<string, string>> {
  return members.slice(0, 5).map((member) => {
    const record: Record<string, string> = {}
    for (const field of fields) {
      const target =
        field.selector === ':scope'
          ? member
          : member.querySelector(field.selector) || member.children[parseInt(field.selector.match(/\d+/)?.[0] || '0')]

      if (!target) {
        record[field.name] = ''
        continue
      }

      if (field.type === 'image') {
        const img = target.tagName === 'IMG' ? target : target.querySelector('img')
        record[field.name] = (img as HTMLImageElement)?.src || ''
      } else if (field.type === 'link') {
        const a = target.tagName === 'A' ? target : target.querySelector('a')
        record[field.name] = (a as HTMLAnchorElement)?.href || ''
      } else {
        record[field.name] = (target.textContent || '').trim().slice(0, 200)
      }
    }
    return record
  })
}

function inferDatasetName(pattern: DetectedPattern, index: number): string {
  // Try to name from parent context
  const parent = pattern.members[0]?.parentElement
  if (parent) {
    const heading = parent.previousElementSibling
    if (heading && /^H[1-6]$/.test(heading.tagName)) {
      const text = (heading.textContent || '').trim()
      if (text.length < 50) return text
    }
  }

  // Fall back to field-based name
  if (pattern.fieldHints.length > 0) {
    return `${pattern.fieldHints[0]} (${pattern.count} items)`
  }

  return `Dataset ${index + 1} (${pattern.count} items)`
}

function buildDescription(
  pattern: DetectedPattern,
  fields: ReadonlyArray<DatasetField>,
): string {
  const fieldStr = fields.map((f) => `${f.name} (${f.type})`).join(', ')
  return `${pattern.count} items, ${fields.length} fields: ${fieldStr}. Density: ${(pattern.density * 100).toFixed(0)}%`
}
