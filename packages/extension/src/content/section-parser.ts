import type { Section, TableData, ListData, LinkData, ImageData } from '@ext/shared/types'

const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6'])

function headingLevel(tagName: string): number {
  return parseInt(tagName.charAt(1), 10) || 0
}

function getTextContent(el: Element): string {
  return (el.textContent || '').trim()
}

export function parseSections(root: Element): ReadonlyArray<Section> {
  const headings = root.querySelectorAll('h1, h2, h3, h4, h5, h6')
  if (headings.length === 0) {
    const text = getTextContent(root)
    if (!text) return []
    return [{ level: 0, heading: '', content: text.slice(0, 5000), children: [] }]
  }

  const flatSections: Array<{ level: number; heading: string; content: string }> = []

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i]
    const level = headingLevel(heading.tagName)
    const headingText = getTextContent(heading)

    // Collect text between this heading and the next
    const contentParts: string[] = []
    let sibling = heading.nextElementSibling
    const nextHeading = headings[i + 1]

    while (sibling && sibling !== nextHeading) {
      if (!HEADING_TAGS.has(sibling.tagName)) {
        const text = getTextContent(sibling)
        if (text) contentParts.push(text)
      }
      sibling = sibling.nextElementSibling
    }

    flatSections.push({
      level,
      heading: headingText,
      content: contentParts.join('\n').slice(0, 5000),
    })
  }

  return buildTree(flatSections)
}

function buildTree(
  flat: ReadonlyArray<{ level: number; heading: string; content: string }>,
): ReadonlyArray<Section> {
  const result: Section[] = []
  const stack: Section[] = []

  for (const item of flat) {
    const section: Section = {
      level: item.level,
      heading: item.heading,
      content: item.content,
      children: [],
    }

    // Pop stack until we find a parent with lower level
    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop()
    }

    if (stack.length === 0) {
      result.push(section)
    } else {
      ;(stack[stack.length - 1].children as Section[]).push(section)
    }

    stack.push(section)
  }

  return result
}

export function extractTables(root: Element): ReadonlyArray<TableData> {
  const tables = root.querySelectorAll('table')
  const results: TableData[] = []

  for (let idx = 0; idx < tables.length; idx++) {
    const table = tables[idx]
    const caption = table.querySelector('caption')?.textContent?.trim()

    // Extract headers
    const headerRow = table.querySelector('thead tr') || table.querySelector('tr')
    if (!headerRow) continue

    const headerCells = headerRow.querySelectorAll('th, td')
    const headers: string[] = []
    for (const cell of headerCells) {
      headers.push(getTextContent(cell))
    }

    if (headers.length === 0) continue

    // Extract body rows
    const bodyRows = table.querySelectorAll('tbody tr')
    const rowSource = bodyRows.length > 0 ? bodyRows : table.querySelectorAll('tr')
    const rows: string[][] = []

    for (const row of rowSource) {
      // Skip the header row if it's the same as what we already parsed
      if (row === headerRow) continue
      const cells = row.querySelectorAll('td, th')
      const rowData: string[] = []
      for (const cell of cells) {
        rowData.push(getTextContent(cell))
      }
      if (rowData.length > 0) rows.push(rowData)
    }

    if (rows.length === 0) continue

    results.push({
      headers,
      rows,
      caption: caption || undefined,
      sourceIndex: idx,
    })
  }

  return results
}

export function extractLists(root: Element): ReadonlyArray<ListData> {
  const listEls = root.querySelectorAll('ul, ol')
  const results: ListData[] = []

  for (let idx = 0; idx < listEls.length; idx++) {
    const list = listEls[idx]

    // Skip nav/menu lists
    const parent = list.parentElement
    if (parent?.tagName === 'NAV' || parent?.getAttribute('role') === 'navigation') continue

    const items: string[] = []
    const lis = list.querySelectorAll(':scope > li')
    for (const li of lis) {
      const text = getTextContent(li)
      if (text) items.push(text)
    }

    // Only include lists with 2+ items
    if (items.length < 2) continue

    results.push({
      type: list.tagName === 'OL' ? 'ordered' : 'unordered',
      items,
      sourceIndex: idx,
    })
  }

  return results
}

export function extractLinks(root: Element): ReadonlyArray<LinkData> {
  const anchors = root.querySelectorAll('a[href]')
  const seen = new Set<string>()
  const results: LinkData[] = []
  const currentHost = location.hostname

  for (const anchor of anchors) {
    const href = (anchor as HTMLAnchorElement).href
    if (!href || href.startsWith('javascript:') || href.startsWith('#')) continue
    if (seen.has(href)) continue
    seen.add(href)

    const text = getTextContent(anchor)
    if (!text) continue

    let isExternal = false
    try {
      isExternal = new URL(href).hostname !== currentHost
    } catch {
      // relative URL — internal
    }

    results.push({ href, text, isExternal })
  }

  return results
}

export function extractImages(root: Element): ReadonlyArray<ImageData> {
  const imgs = root.querySelectorAll('img[src]')
  const results: ImageData[] = []

  for (const img of imgs) {
    const el = img as HTMLImageElement
    const src = el.src
    if (!src || src.startsWith('data:image/svg')) continue

    // Skip tiny images (likely icons/tracking)
    const width = el.naturalWidth || el.width
    const height = el.naturalHeight || el.height
    if (width > 0 && width < 50 && height > 0 && height < 50) continue

    results.push({
      src,
      alt: el.alt || '',
      width: width || undefined,
      height: height || undefined,
    })
  }

  return results
}
