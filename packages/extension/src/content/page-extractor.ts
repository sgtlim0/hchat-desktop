import type { PageIntelligence, PageContext } from '@ext/shared/types'
import { extractMetadata } from './metadata-extractor'
import { parseSections, extractTables, extractLists, extractLinks, extractImages } from './section-parser'
import { computeContentDensity, estimateReadingTime, findMainContent, removeNoise } from './content-density'

const MAX_TEXT_LENGTH = 100_000

/**
 * Full page intelligence extraction.
 * Combines metadata, sections, tables, lists, links, images, and density scoring.
 */
export function extractPageIntelligence(): PageIntelligence {
  const metadata = extractMetadata()

  // Find main content area for focused extraction
  const mainContent = findMainContent(document.body)

  // Clone and clean for text extraction
  const clone = mainContent.cloneNode(true) as HTMLElement
  removeNoise(clone)

  // Extract structured data from cleaned DOM
  const sections = parseSections(clone)
  const tables = extractTables(clone)
  const lists = extractLists(clone)
  const links = extractLinks(clone)
  const images = extractImages(clone)
  const contentDensity = computeContentDensity(clone)

  // Raw text extraction (backward compatible)
  const rawTextFull = (clone.textContent || '').trim()
  const rawText =
    rawTextFull.length > MAX_TEXT_LENGTH
      ? rawTextFull.slice(0, MAX_TEXT_LENGTH) + '\n\n[...truncated]'
      : rawTextFull

  const readingTime = estimateReadingTime(rawText, metadata.language)

  return {
    url: location.href,
    title: document.title,
    metadata,
    sections,
    tables,
    lists,
    links,
    images,
    readingTime,
    contentDensity,
    rawText,
  }
}

/**
 * Backward-compatible extraction returning the legacy PageContext format.
 * Used by content-script.ts message handler.
 */
export function extractPageContent(): PageContext {
  const intelligence = extractPageIntelligence()
  return {
    url: intelligence.url,
    title: intelligence.title,
    text: intelligence.rawText,
  }
}

/**
 * Generate a structured text summary from PageIntelligence.
 * Useful for injecting into LLM context.
 */
export function intelligenceToContext(intel: PageIntelligence): string {
  const parts: string[] = []

  // Header
  parts.push(`# ${intel.title}`)
  parts.push(`URL: ${intel.url}`)

  if (intel.metadata.author) {
    parts.push(`Author: ${intel.metadata.author}`)
  }
  if (intel.metadata.publishedDate) {
    parts.push(`Published: ${intel.metadata.publishedDate}`)
  }
  parts.push(`Reading time: ~${intel.readingTime} min`)
  parts.push('')

  // Sections
  if (intel.sections.length > 0) {
    parts.push('## Content Structure')
    for (const section of intel.sections) {
      appendSection(parts, section, 0)
    }
    parts.push('')
  }

  // Tables summary
  if (intel.tables.length > 0) {
    parts.push(`## Tables (${intel.tables.length} found)`)
    for (let i = 0; i < intel.tables.length; i++) {
      const table = intel.tables[i]
      const caption = table.caption ? ` — ${table.caption}` : ''
      parts.push(`Table ${i + 1}${caption}: ${table.headers.join(' | ')} (${table.rows.length} rows)`)
    }
    parts.push('')
  }

  // Lists summary
  if (intel.lists.length > 0) {
    parts.push(`## Lists (${intel.lists.length} found)`)
    for (const list of intel.lists) {
      parts.push(`- ${list.type} list: ${list.items.length} items`)
    }
    parts.push('')
  }

  return parts.join('\n')
}

function appendSection(parts: string[], section: Section, depth: number): void {
  const prefix = '#'.repeat(Math.min(depth + 2, 6))
  if (section.heading) {
    parts.push(`${prefix} ${section.heading}`)
  }
  if (section.content) {
    const preview = section.content.slice(0, 500)
    parts.push(preview)
    if (section.content.length > 500) parts.push('...')
  }
  for (const child of section.children) {
    appendSection(parts, child, depth + 1)
  }
}
