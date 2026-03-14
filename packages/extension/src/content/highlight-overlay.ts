/**
 * Visual highlight overlay for discovered datasets.
 * Draws colored borders around detected pattern members on the page.
 */

const OVERLAY_CLASS = 'hchat-dataset-highlight'
const CONTAINER_CLASS = 'hchat-dataset-container'

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
] as const

/**
 * Highlight pattern members on the page with colored borders.
 */
export function highlightDataset(
  members: ReadonlyArray<Element>,
  datasetIndex: number,
): void {
  const color = COLORS[datasetIndex % COLORS.length]

  for (const member of members) {
    const el = member as HTMLElement
    el.classList.add(OVERLAY_CLASS)
    el.style.outline = `2px solid ${color}`
    el.style.outlineOffset = '2px'
    el.style.borderRadius = '4px'
    el.dataset.hchatDataset = String(datasetIndex)
  }

  // Highlight parent container
  const parent = members[0]?.parentElement as HTMLElement | null
  if (parent) {
    parent.classList.add(CONTAINER_CLASS)
    parent.style.outline = `1px dashed ${color}`
    parent.style.outlineOffset = '4px'
    parent.dataset.hchatContainer = String(datasetIndex)
  }
}

/**
 * Remove all dataset highlights from the page.
 */
export function clearHighlights(): void {
  const highlighted = document.querySelectorAll(`.${OVERLAY_CLASS}`)
  for (const el of highlighted) {
    const htmlEl = el as HTMLElement
    htmlEl.classList.remove(OVERLAY_CLASS)
    htmlEl.style.outline = ''
    htmlEl.style.outlineOffset = ''
    htmlEl.style.borderRadius = ''
    delete htmlEl.dataset.hchatDataset
  }

  const containers = document.querySelectorAll(`.${CONTAINER_CLASS}`)
  for (const el of containers) {
    const htmlEl = el as HTMLElement
    htmlEl.classList.remove(CONTAINER_CLASS)
    htmlEl.style.outline = ''
    htmlEl.style.outlineOffset = ''
    delete htmlEl.dataset.hchatContainer
  }
}

/**
 * Highlight a single dataset and scroll it into view.
 */
export function focusDataset(
  members: ReadonlyArray<Element>,
  datasetIndex: number,
): void {
  clearHighlights()
  highlightDataset(members, datasetIndex)

  // Scroll first member into view
  if (members.length > 0) {
    members[0].scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

/**
 * Get the highlight color for a dataset index.
 */
export function getDatasetColor(index: number): string {
  return COLORS[index % COLORS.length]
}
