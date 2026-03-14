/**
 * Extraction strategy types and generation.
 * A strategy defines HOW to extract data from a specific page structure.
 * Inspired by AutoResearch: strategies are the "code modifications" that get
 * committed (saved) or rolled back based on quality evaluation.
 */

export interface ExtractionStrategy {
  readonly id: string
  readonly name: string
  readonly type: 'table' | 'list' | 'card' | 'article' | 'custom'
  readonly selectors: StrategySelectors
  readonly confidence: number
  readonly source: 'heuristic' | 'llm' | 'learned'
}

export interface StrategySelectors {
  /** Main container selector */
  readonly container: string
  /** Repeating item selector within container */
  readonly item: string
  /** Field selectors relative to each item */
  readonly fields: ReadonlyArray<FieldSelector>
}

export interface FieldSelector {
  readonly name: string
  readonly selector: string
  readonly attribute?: string // 'textContent' (default), 'href', 'src', etc.
  readonly type: 'text' | 'number' | 'link' | 'image' | 'date'
}

export interface ExtractionResult {
  readonly strategy: ExtractionStrategy
  readonly records: ReadonlyArray<Record<string, string>>
  readonly itemCount: number
  readonly fieldCount: number
  readonly executionMs: number
}

/**
 * Generate heuristic extraction strategies from page DOM.
 * These are the "initial guesses" before LLM refinement.
 */
export function generateHeuristicStrategies(root: Element): ReadonlyArray<ExtractionStrategy> {
  const strategies: ExtractionStrategy[] = []

  // Strategy 1: HTML tables
  const tables = root.querySelectorAll('table')
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i]
    const rows = table.querySelectorAll('tbody tr, tr')
    if (rows.length < 2) continue

    const headerCells = table.querySelectorAll('thead th, tr:first-child th')
    const fields: FieldSelector[] = Array.from(headerCells).map((th, idx) => ({
      name: (th.textContent || '').trim() || `col_${idx}`,
      selector: `td:nth-child(${idx + 1})`,
      type: 'text' as const,
    }))

    if (fields.length === 0) continue

    strategies.push({
      id: `heuristic-table-${i}`,
      name: `Table ${i + 1}`,
      type: 'table',
      selectors: {
        container: buildSelector(table),
        item: 'tbody tr',
        fields,
      },
      confidence: 0.9,
      source: 'heuristic',
    })
  }

  // Strategy 2: Repeating class-based cards
  const containers = root.querySelectorAll('[class*="list"], [class*="grid"], [class*="items"], [class*="results"]')
  for (let i = 0; i < containers.length && i < 5; i++) {
    const container = containers[i]
    const children = Array.from(container.children)
    if (children.length < 3) continue

    // Check if children share class names
    const firstClasses = new Set(children[0].classList)
    const sharedClass = Array.from(firstClasses).find((cls) =>
      children.every((c) => c.classList.contains(cls)),
    )
    if (!sharedClass) continue

    const itemSelector = `.${sharedClass}`
    const firstItem = children[0]
    const fields = inferFieldsFromElement(firstItem)
    if (fields.length === 0) continue

    strategies.push({
      id: `heuristic-card-${i}`,
      name: `Card List ${i + 1}`,
      type: 'card',
      selectors: {
        container: buildSelector(container),
        item: itemSelector,
        fields,
      },
      confidence: 0.6,
      source: 'heuristic',
    })
  }

  // Strategy 3: Ordered/unordered lists with structure
  const lists = root.querySelectorAll('ul, ol')
  for (let i = 0; i < lists.length && i < 5; i++) {
    const list = lists[i]
    const items = list.querySelectorAll(':scope > li')
    if (items.length < 3) continue
    if (list.closest('nav')) continue

    // Check if list items have child elements (not just text)
    const hasStructure = Array.from(items).some((li) => li.children.length > 1)
    if (!hasStructure) continue

    const fields = inferFieldsFromElement(items[0])
    if (fields.length === 0) continue

    strategies.push({
      id: `heuristic-list-${i}`,
      name: `List ${i + 1}`,
      type: 'list',
      selectors: {
        container: buildSelector(list),
        item: ':scope > li',
        fields,
      },
      confidence: 0.5,
      source: 'heuristic',
    })
  }

  return strategies.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Execute an extraction strategy against the DOM.
 */
export function executeStrategy(root: Element, strategy: ExtractionStrategy): ExtractionResult {
  const start = performance.now()
  const container = root.querySelector(strategy.selectors.container)
  if (!container) {
    return { strategy, records: [], itemCount: 0, fieldCount: 0, executionMs: 0 }
  }

  const items = container.querySelectorAll(strategy.selectors.item)
  const records: Record<string, string>[] = []

  for (const item of items) {
    const record: Record<string, string> = {}
    for (const field of strategy.selectors.fields) {
      const target = field.selector === ':scope' ? item : item.querySelector(field.selector)
      if (!target) {
        record[field.name] = ''
        continue
      }

      if (field.attribute === 'href') {
        record[field.name] = (target as HTMLAnchorElement).href || ''
      } else if (field.attribute === 'src') {
        record[field.name] = (target as HTMLImageElement).src || ''
      } else {
        record[field.name] = (target.textContent || '').trim()
      }
    }
    records.push(record)
  }

  const executionMs = Math.round(performance.now() - start)

  return {
    strategy,
    records,
    itemCount: records.length,
    fieldCount: strategy.selectors.fields.length,
    executionMs,
  }
}

function buildSelector(el: Element): string {
  const tag = el.tagName.toLowerCase()
  const id = el.id
  if (id) return `#${id}`

  const classes = Array.from(el.classList)
    .filter((c) => c.length < 30 && !/^css-|^js-/.test(c))
    .slice(0, 2)
  if (classes.length > 0) return `${tag}.${classes.join('.')}`

  return tag
}

function inferFieldsFromElement(el: Element): FieldSelector[] {
  const fields: FieldSelector[] = []
  const children = Array.from(el.children).slice(0, 8)

  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    const tag = child.tagName.toLowerCase()

    if (tag === 'img' || child.querySelector('img')) {
      const imgEl = tag === 'img' ? child : child.querySelector('img')
      if (imgEl) {
        fields.push({
          name: 'image',
          selector: tag === 'img' ? `:scope > img` : buildChildSelector(child, i),
          attribute: 'src',
          type: 'image',
        })
      }
      continue
    }

    if (tag === 'a' || child.querySelector('a')) {
      fields.push({
        name: i === 0 ? 'title' : 'link',
        selector: buildChildSelector(child, i),
        type: 'link',
      })
      continue
    }

    const text = (child.textContent || '').trim()
    if (text && text.length < 500) {
      fields.push({
        name: /^h[1-6]$/.test(tag) ? 'title' : `field_${i}`,
        selector: buildChildSelector(child, i),
        type: 'text',
      })
    }
  }

  return fields
}

function buildChildSelector(el: Element, index: number): string {
  const tag = el.tagName.toLowerCase()
  const classes = Array.from(el.classList)
    .filter((c) => c.length < 25 && !/^css-/.test(c))
    .slice(0, 2)
  if (classes.length > 0) return `${tag}.${classes.join('.')}`
  return `:scope > :nth-child(${index + 1})`
}
