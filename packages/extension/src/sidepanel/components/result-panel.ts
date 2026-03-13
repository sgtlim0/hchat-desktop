import { marked } from 'marked'

export type ReAnalyzeCallback = () => void

export function initResultPanel(
  container: HTMLElement,
  onReAnalyze: ReAnalyzeCallback,
): {
  appendText: (chunk: string) => void
  finalize: () => void
  clear: () => void
  setContent: (text: string) => void
} {
  container.innerHTML = ''

  const wrapper = document.createElement('div')
  wrapper.className = 'fade-in'

  // Header row
  const headerRow = document.createElement('div')
  headerRow.style.cssText = `
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 10px;
  `

  const headerLabel = document.createElement('p')
  headerLabel.style.cssText = 'font-weight: 600; font-size: 13px; color: var(--hchat-text);'
  headerLabel.textContent = '분석 결과'

  const btnGroup = document.createElement('div')
  btnGroup.style.cssText = 'display: flex; gap: 6px;'

  const copyBtn = document.createElement('button')
  copyBtn.className = 'btn-secondary'
  copyBtn.style.cssText = 'display: flex; align-items: center; gap: 4px; font-size: 12px;'
  copyBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
    복사
  `

  const reAnalyzeBtn = document.createElement('button')
  reAnalyzeBtn.className = 'btn-secondary'
  reAnalyzeBtn.style.cssText = 'display: flex; align-items: center; gap: 4px; font-size: 12px;'
  reAnalyzeBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
    다시 분석
  `

  btnGroup.append(copyBtn, reAnalyzeBtn)
  headerRow.append(headerLabel, btnGroup)

  // Result content area
  const resultContent = document.createElement('div')
  resultContent.className = 'result-content'
  resultContent.style.cssText = `
    background: var(--hchat-surface);
    border: 1px solid var(--hchat-border);
    border-radius: 12px;
    padding: 16px;
    min-height: 100px;
    max-height: 500px;
    overflow-y: auto;
    font-size: 14px;
    line-height: 1.7;
  `

  wrapper.append(headerRow, resultContent)
  container.appendChild(wrapper)

  let rawText = ''
  let isStreaming = false

  // Copy
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(rawText)
      const originalText = copyBtn.innerHTML
      copyBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        복사됨
      `
      setTimeout(() => {
        copyBtn.innerHTML = originalText
      }, 1500)
    } catch {
      // fallback: silently fail
    }
  })

  // Re-analyze
  reAnalyzeBtn.addEventListener('click', () => onReAnalyze())

  function renderMarkdown(): void {
    const html = marked.parse(rawText)
    if (typeof html === 'string') {
      resultContent.innerHTML = html
    }
  }

  return {
    appendText(chunk: string) {
      rawText += chunk
      if (!isStreaming) {
        isStreaming = true
        resultContent.classList.add('streaming-cursor')
      }
      // During streaming, show raw text for performance
      resultContent.textContent = rawText
      resultContent.scrollTop = resultContent.scrollHeight
    },

    finalize() {
      isStreaming = false
      resultContent.classList.remove('streaming-cursor')
      renderMarkdown()
      resultContent.scrollTop = resultContent.scrollHeight
    },

    clear() {
      rawText = ''
      isStreaming = false
      resultContent.classList.remove('streaming-cursor')
      resultContent.innerHTML = ''
    },

    setContent(text: string) {
      rawText = text
      isStreaming = false
      resultContent.classList.remove('streaming-cursor')
      renderMarkdown()
    },
  }
}
