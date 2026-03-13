import type { AnalysisResult, AnalysisMode } from '../../shared/types'

const MODE_LABELS: Record<AnalysisMode, string> = {
  summary: '요약',
  translate: '번역',
  code: '코드 분석',
  draft: '초안 작성',
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (isToday) {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '...'
}

export type HistorySelectCallback = (result: AnalysisResult) => void
export type HistoryClearCallback = () => void

export function initHistoryList(
  container: HTMLElement,
  items: readonly AnalysisResult[],
  onSelect: HistorySelectCallback,
  onClear: HistoryClearCallback,
): { update: (newItems: readonly AnalysisResult[]) => void } {
  function render(list: readonly AnalysisResult[]): void {
    container.innerHTML = ''

    if (list.length === 0) {
      const empty = document.createElement('div')
      empty.style.cssText = `
        text-align: center; padding: 48px 16px;
        color: var(--hchat-text-secondary);
      `

      const emptyIcon = document.createElement('div')
      emptyIcon.style.cssText = 'margin-bottom: 12px; opacity: 0.5;'
      emptyIcon.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      `

      const emptyText = document.createElement('p')
      emptyText.style.cssText = 'font-size: 14px;'
      emptyText.textContent = '분석 기록이 없습니다'

      empty.append(emptyIcon, emptyText)
      container.appendChild(empty)
      return
    }

    // Clear button
    const clearRow = document.createElement('div')
    clearRow.style.cssText = 'display: flex; justify-content: flex-end; margin-bottom: 12px;'

    const clearBtn = document.createElement('button')
    clearBtn.className = 'btn-secondary'
    clearBtn.style.cssText = 'font-size: 12px; color: var(--hchat-danger);'
    clearBtn.textContent = '전체 삭제'
    clearBtn.addEventListener('click', () => {
      if (confirm('모든 분석 기록을 삭제하시겠습니까?')) {
        onClear()
      }
    })

    clearRow.appendChild(clearBtn)
    container.appendChild(clearRow)

    // Items
    const itemsWrap = document.createElement('div')
    itemsWrap.style.cssText = 'display: flex; flex-direction: column; gap: 6px;'

    for (const item of list) {
      const el = document.createElement('div')
      el.className = 'history-item fade-in'

      const topRow = document.createElement('div')
      topRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;'

      const nameRow = document.createElement('div')
      nameRow.style.cssText = 'display: flex; align-items: center; gap: 6px; min-width: 0;'

      const fileName = document.createElement('span')
      fileName.className = 'text-ellipsis'
      fileName.style.cssText = 'font-weight: 600; font-size: 13px; max-width: 160px;'
      fileName.textContent = item.fileName

      const modeBadge = document.createElement('span')
      modeBadge.className = 'badge badge-navy'
      modeBadge.textContent = MODE_LABELS[item.mode] ?? item.mode

      nameRow.append(fileName, modeBadge)

      const timeLabel = document.createElement('span')
      timeLabel.style.cssText = 'font-size: 11px; color: var(--hchat-text-secondary); flex-shrink: 0;'
      timeLabel.textContent = formatTime(item.timestamp)

      topRow.append(nameRow, timeLabel)

      const preview = document.createElement('p')
      preview.style.cssText = 'font-size: 12px; color: var(--hchat-text-secondary); line-height: 1.4;'
      preview.textContent = truncate(item.resultText, 80)

      el.append(topRow, preview)
      itemsWrap.appendChild(el)

      el.addEventListener('click', () => onSelect(item))
    }

    container.appendChild(itemsWrap)
  }

  render(items)

  return {
    update(newItems: readonly AnalysisResult[]) {
      render(newItems)
    },
  }
}
