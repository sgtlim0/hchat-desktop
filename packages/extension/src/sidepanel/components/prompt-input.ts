import type { AnalysisMode } from '../../shared/types'

const PLACEHOLDERS: Record<AnalysisMode, string> = {
  summary: '요약 방식을 지정하세요 (예: 3줄 요약, 핵심 키워드 포함...)',
  translate: '번역 지시사항을 입력하세요 (예: 한국어→영어, 공식적인 어조...)',
  code: '코드 분석 관점을 지정하세요 (예: 성능, 보안, 가독성...)',
  draft: '초안 작성 요구사항을 입력하세요 (예: 보고서 형식, 목차 포함...)',
}

export type AnalyzeCallback = (prompt: string) => void

export function initPromptInput(
  container: HTMLElement,
  mode: AnalysisMode,
  onAnalyze: AnalyzeCallback,
): { setMode: (m: AnalysisMode) => void; setLoading: (loading: boolean) => void; reset: () => void } {
  container.innerHTML = ''

  const wrapper = document.createElement('div')
  wrapper.className = 'fade-in'

  const label = document.createElement('p')
  label.style.cssText = 'font-weight: 600; font-size: 13px; margin-bottom: 8px; color: var(--hchat-text);'
  label.textContent = '추가 지시사항 (선택)'

  const textarea = document.createElement('textarea')
  textarea.style.cssText = `
    width: 100%;
    min-height: 80px;
    padding: 10px 12px;
    border: 1px solid var(--hchat-border);
    border-radius: 10px;
    background: var(--hchat-surface);
    color: var(--hchat-text);
    font-size: 13px;
    font-family: inherit;
    resize: vertical;
    outline: none;
    transition: border-color 0.2s;
    line-height: 1.5;
  `
  textarea.placeholder = PLACEHOLDERS[mode]
  textarea.addEventListener('focus', () => {
    textarea.style.borderColor = 'var(--hchat-teal)'
  })
  textarea.addEventListener('blur', () => {
    textarea.style.borderColor = 'var(--hchat-border)'
  })

  const btnRow = document.createElement('div')
  btnRow.style.cssText = 'margin-top: 10px;'

  const analyzeBtn = document.createElement('button')
  analyzeBtn.className = 'btn-primary'
  analyzeBtn.style.cssText = 'display: flex; align-items: center; justify-content: center; gap: 8px;'

  const btnTextSpan = document.createElement('span')
  btnTextSpan.textContent = '분석 시작'

  const spinnerEl = document.createElement('span')
  spinnerEl.className = 'spinner spinner-sm'
  spinnerEl.style.display = 'none'

  analyzeBtn.append(btnTextSpan, spinnerEl)
  btnRow.appendChild(analyzeBtn)

  wrapper.append(label, textarea, btnRow)
  container.appendChild(wrapper)

  let isLoading = false

  analyzeBtn.addEventListener('click', () => {
    if (isLoading) return
    onAnalyze(textarea.value.trim())
  })

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      if (!isLoading) onAnalyze(textarea.value.trim())
    }
  })

  return {
    setMode(m: AnalysisMode) {
      textarea.placeholder = PLACEHOLDERS[m]
    },
    setLoading(loading: boolean) {
      isLoading = loading
      analyzeBtn.disabled = loading
      spinnerEl.style.display = loading ? 'inline-block' : 'none'
      btnTextSpan.textContent = loading ? '분석 중...' : '분석 시작'
    },
    reset() {
      textarea.value = ''
      isLoading = false
      analyzeBtn.disabled = false
      spinnerEl.style.display = 'none'
      btnTextSpan.textContent = '분석 시작'
    },
  }
}
