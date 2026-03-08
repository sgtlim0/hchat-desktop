let idCounter = 0

export function generateAriaId(prefix = 'aria'): string {
  return `${prefix}-${++idCounter}`
}

export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite',
): void {
  if (typeof document === 'undefined') return

  let announcer = document.getElementById('aria-announcer')

  if (!announcer) {
    announcer = document.createElement('div')
    announcer.id = 'aria-announcer'
    announcer.setAttribute('role', 'status')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.style.position = 'absolute'
    announcer.style.left = '-10000px'
    announcer.style.width = '1px'
    announcer.style.height = '1px'
    announcer.style.overflow = 'hidden'
    document.body.appendChild(announcer)
  }

  announcer.setAttribute('aria-live', priority)
  announcer.textContent = message

  // Clear message after short delay to allow screen reader to announce
  setTimeout(() => {
    if (announcer) {
      announcer.textContent = ''
    }
  }, 100)
}

export function getFocusableSelector(): string {
  return [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ')
}

export function trapFocus(container: HTMLElement): () => void {
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return

    const focusableElements = container.querySelectorAll<HTMLElement>(getFocusableSelector())
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.shiftKey) {
      // Shift+Tab: moving backwards
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab: moving forwards
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }

  container.addEventListener('keydown', handleKeydown)

  return () => {
    container.removeEventListener('keydown', handleKeydown)
  }
}

export function isReducedMotion(): boolean {
  try {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

export function getContrastRatio(
  rgb1: [number, number, number],
  rgb2: [number, number, number],
): number {
  const l1 = getRelativeLuminance(...rgb1)
  const l2 = getRelativeLuminance(...rgb2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function meetsContrastAA(ratio: number, isLargeText = false): boolean {
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

export function meetsContrastAAA(ratio: number, isLargeText = false): boolean {
  return isLargeText ? ratio >= 4.5 : ratio >= 7
}
