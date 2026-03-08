/**
 * Scrolls the window to the top
 */
export function scrollToTop(behavior: ScrollBehavior = 'auto'): void {
  if (typeof window === 'undefined') return
  window.scrollTo({ top: 0, behavior })
}

/**
 * Scrolls an element into view
 */
export function scrollToElement(element: Element, behavior: ScrollBehavior = 'auto'): void {
  if (typeof window === 'undefined' || !element) return
  element.scrollIntoView({ behavior, block: 'start' })
}

/**
 * Copies text to clipboard with fallback for older browsers
 */
export async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  // Try modern clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  // Fallback to execCommand
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.top = '0'
  textarea.style.left = '-9999px'

  document.body.appendChild(textarea)
  textarea.select()

  try {
    document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
}

/**
 * Checks if an element is visible in the viewport
 */
export function isElementVisible(element: Element): boolean {
  if (typeof window === 'undefined' || !element) return false

  // Check computed styles
  const styles = window.getComputedStyle(element)
  if (
    styles.display === 'none' ||
    styles.visibility === 'hidden' ||
    styles.opacity === '0'
  ) {
    return false
  }

  // Check if in viewport
  const rect = element.getBoundingClientRect()
  return (
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0
  )
}

/**
 * Gets the current scroll position
 */
export function getScrollPosition(): { top: number; left: number } {
  if (typeof window === 'undefined') return { top: 0, left: 0 }

  // Try pageOffset first (better browser support)
  const top = window.pageYOffset !== undefined
    ? window.pageYOffset
    : window.scrollY

  const left = window.pageXOffset !== undefined
    ? window.pageXOffset
    : window.scrollX

  return { top, left }
}

/**
 * Adds one or more classes to an element
 */
export function addClass(element: Element, ...classes: string[]): void {
  if (!element || !classes.length) return
  element.classList.add(...classes)
}

/**
 * Removes one or more classes from an element
 */
export function removeClass(element: Element, ...classes: string[]): void {
  if (!element || !classes.length) return
  element.classList.remove(...classes)
}

/**
 * Gets the computed style value for a property
 */
export function getStyle(element: Element, property: string): string {
  if (typeof window === 'undefined' || !element) return ''

  const styles = window.getComputedStyle(element)
  // Handle both kebab-case and camelCase property names
  const value = styles.getPropertyValue(property) || (styles as any)[property]

  return value || ''
}

/**
 * Creates an element from an HTML string
 */
export function createElementFromHTML(html: string): Element | null {
  if (typeof document === 'undefined' || !html || !html.trim()) return null

  const template = document.createElement('template')
  template.innerHTML = html.trim()
  return template.content.firstElementChild
}
