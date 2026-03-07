/**
 * Phase 32: Accessibility & i18n utilities
 * WCAG 2.1 AA compliance helpers, keyboard navigation, color contrast.
 */

export interface A11yAuditResult {
  score: number
  issues: A11yIssue[]
  passedChecks: number
  totalChecks: number
}

export interface A11yIssue {
  severity: 'critical' | 'serious' | 'moderate' | 'minor'
  rule: string
  description: string
  element?: string
}

/** Check color contrast ratio (WCAG AA requires 4.5:1 for normal text) */
export function contrastRatio(fg: string, bg: string): number {
  const fgLum = relativeLuminance(parseHex(fg))
  const bgLum = relativeLuminance(parseHex(bg))
  const lighter = Math.max(fgLum, bgLum)
  const darker = Math.min(fgLum, bgLum)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Check if contrast meets WCAG AA */
export function meetsContrastAA(fg: string, bg: string, isLargeText = false): boolean {
  const ratio = contrastRatio(fg, bg)
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/** Generate focus trap key handler */
export function createFocusTrap(containerSelector: string): {
  activate: () => void
  deactivate: () => void
} {
  let active = false
  let handler: ((e: KeyboardEvent) => void) | null = null

  return {
    activate() {
      if (active || typeof document === 'undefined') return
      active = true

      handler = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return
        const container = document.querySelector(containerSelector)
        if (!container) return

        const focusable = container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }

      document.addEventListener('keydown', handler)
    },
    deactivate() {
      if (!active || !handler) return
      active = false
      document.removeEventListener('keydown', handler)
      handler = null
    },
  }
}

/** Announce message to screen readers via live region */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (typeof document === 'undefined') return
  const el = document.createElement('div')
  el.setAttribute('role', 'status')
  el.setAttribute('aria-live', priority)
  el.setAttribute('aria-atomic', 'true')
  el.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)'
  el.textContent = message
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 1000)
}

/** Check if user prefers reduced motion */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Run basic accessibility audit on current page */
export function auditPage(): A11yAuditResult {
  if (typeof document === 'undefined') {
    return { score: 0, issues: [], passedChecks: 0, totalChecks: 0 }
  }

  const issues: A11yIssue[] = []
  let totalChecks = 0
  let passedChecks = 0

  // Check images for alt text
  totalChecks++
  const imgsWithoutAlt = document.querySelectorAll('img:not([alt])')
  if (imgsWithoutAlt.length > 0) {
    issues.push({ severity: 'serious', rule: 'img-alt', description: `${imgsWithoutAlt.length}개 이미지에 alt 텍스트가 없습니다` })
  } else { passedChecks++ }

  // Check buttons for accessible names
  totalChecks++
  const emptyButtons = document.querySelectorAll('button:empty:not([aria-label]):not([title])')
  if (emptyButtons.length > 0) {
    issues.push({ severity: 'critical', rule: 'button-name', description: `${emptyButtons.length}개 버튼에 접근 가능한 이름이 없습니다` })
  } else { passedChecks++ }

  // Check for heading hierarchy
  totalChecks++
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
  let headingOrderValid = true
  let prevLevel = 0
  headings.forEach((h) => {
    const level = parseInt(h.tagName[1])
    if (level > prevLevel + 1 && prevLevel > 0) headingOrderValid = false
    prevLevel = level
  })
  if (!headingOrderValid) {
    issues.push({ severity: 'moderate', rule: 'heading-order', description: '헤딩 레벨이 순서대로 되어있지 않습니다' })
  } else { passedChecks++ }

  // Check for lang attribute
  totalChecks++
  if (!document.documentElement.lang) {
    issues.push({ severity: 'serious', rule: 'html-lang', description: 'HTML 요소에 lang 속성이 없습니다' })
  } else { passedChecks++ }

  const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0

  return { score, issues, passedChecks, totalChecks }
}
