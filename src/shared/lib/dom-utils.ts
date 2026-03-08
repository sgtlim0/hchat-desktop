export function scrollToTop(behavior: ScrollBehavior = 'smooth'): void {
  if (typeof window === 'undefined') return
  window.scrollTo({ top: 0, behavior })
}

export function scrollToElement(element: Element, behavior: ScrollBehavior = 'smooth'): void {
  element.scrollIntoView({ behavior, block: 'start' })
}

export function isElementVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect()
  return (
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0
  )
}

export function getScrollPosition(): { top: number; left: number } {
  if (typeof window === 'undefined') return { top: 0, left: 0 }
  return { top: window.scrollY, left: window.scrollX }
}

export function addClass(element: Element, ...classes: string[]): void {
  element.classList.add(...classes)
}

export function removeClass(element: Element, ...classes: string[]): void {
  element.classList.remove(...classes)
}

export function getStyle(element: Element, property: string): string {
  if (typeof window === 'undefined') return ''
  return window.getComputedStyle(element).getPropertyValue(property)
}

export function createElementFromHTML(html: string): Element | null {
  if (typeof document === 'undefined') return null
  const template = document.createElement('template')
  template.innerHTML = html.trim()
  return template.content.firstElementChild
}
