import type { AnalysisMode } from '../../shared/types'

interface ModeOption {
  readonly mode: AnalysisMode
  readonly label: string
  readonly icon: string
  readonly description: string
}

const MODES: readonly ModeOption[] = [
  {
    mode: 'summary',
    label: '요약',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/>
      <line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>
    </svg>`,
    description: '핵심 내용 요약',
  },
  {
    mode: 'translate',
    label: '번역',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/>
      <path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/>
    </svg>`,
    description: '한/영 번역',
  },
  {
    mode: 'code',
    label: '코드 분석',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>`,
    description: '코드 리뷰 및 개선',
  },
  {
    mode: 'draft',
    label: '초안 작성',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>`,
    description: '문서 기반 초안 생성',
  },
] as const

export type ModeSelectCallback = (mode: AnalysisMode) => void

export function initModeSelector(
  container: HTMLElement,
  onSelect: ModeSelectCallback,
  initialMode?: AnalysisMode,
): { setSelected: (mode: AnalysisMode) => void } {
  container.innerHTML = ''

  const wrapper = document.createElement('div')
  wrapper.className = 'fade-in'

  const label = document.createElement('p')
  label.style.cssText = 'font-weight: 600; font-size: 13px; margin-bottom: 8px; color: var(--hchat-text);'
  label.textContent = '분석 모드 선택'

  const grid = document.createElement('div')
  grid.className = 'mode-grid'

  const cards: HTMLElement[] = []
  let currentMode: AnalysisMode | null = initialMode ?? null

  for (const option of MODES) {
    const card = document.createElement('div')
    card.className = 'mode-card'
    if (currentMode === option.mode) {
      card.classList.add('selected')
    }

    const iconEl = document.createElement('div')
    iconEl.style.cssText = 'color: var(--hchat-teal); margin-bottom: 6px;'
    iconEl.innerHTML = option.icon

    const labelEl = document.createElement('div')
    labelEl.style.cssText = 'font-weight: 600; font-size: 14px; margin-bottom: 2px;'
    labelEl.textContent = option.label

    const descEl = document.createElement('div')
    descEl.style.cssText = 'font-size: 11px; color: var(--hchat-text-secondary);'
    descEl.textContent = option.description

    card.append(iconEl, labelEl, descEl)
    grid.appendChild(card)
    cards.push(card)

    card.addEventListener('click', () => {
      currentMode = option.mode
      for (const c of cards) c.classList.remove('selected')
      card.classList.add('selected')
      onSelect(option.mode)
    })
  }

  wrapper.append(label, grid)
  container.appendChild(wrapper)

  return {
    setSelected(mode: AnalysisMode) {
      currentMode = mode
      const idx = MODES.findIndex((m) => m.mode === mode)
      for (let i = 0; i < cards.length; i++) {
        cards[i].classList.toggle('selected', i === idx)
      }
    },
  }
}
