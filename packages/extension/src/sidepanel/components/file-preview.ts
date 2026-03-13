import type { FileInfo } from '../../shared/types'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

function truncatePreview(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '...'
}

export type ResetCallback = () => void

export function initFilePreview(
  container: HTMLElement,
  fileInfo: FileInfo,
  onReset: ResetCallback,
): void {
  container.innerHTML = ''

  const wrapper = document.createElement('div')
  wrapper.className = 'fade-in'
  wrapper.style.cssText = `
    background: var(--hchat-surface);
    border: 1px solid var(--hchat-border);
    border-radius: 12px;
    padding: 14px;
  `

  // File info row
  const infoRow = document.createElement('div')
  infoRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;'

  const nameWrap = document.createElement('div')
  nameWrap.style.cssText = 'display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;'

  const fileIcon = document.createElement('span')
  fileIcon.style.cssText = 'color: var(--hchat-teal); flex-shrink: 0;'
  fileIcon.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  `

  const fileName = document.createElement('span')
  fileName.className = 'text-ellipsis'
  fileName.style.cssText = 'font-weight: 600; font-size: 14px;'
  fileName.textContent = fileInfo.name

  const typeBadge = document.createElement('span')
  typeBadge.className = 'badge badge-teal'
  typeBadge.textContent = fileInfo.type

  nameWrap.append(fileIcon, fileName, typeBadge)

  const resetBtn = document.createElement('button')
  resetBtn.className = 'btn-secondary'
  resetBtn.style.cssText = 'flex-shrink: 0; margin-left: 8px; font-size: 12px;'
  resetBtn.textContent = '다른 파일'

  infoRow.append(nameWrap, resetBtn)

  // Meta row
  const metaRow = document.createElement('div')
  metaRow.style.cssText = `
    display: flex; gap: 16px; font-size: 12px;
    color: var(--hchat-text-secondary); margin-bottom: 10px;
  `

  const sizeLabel = document.createElement('span')
  sizeLabel.textContent = `크기: ${formatFileSize(fileInfo.size)}`

  const tokenLabel = document.createElement('span')
  const tokens = estimateTokens(fileInfo.content)
  tokenLabel.textContent = `토큰 추정: ~${tokens.toLocaleString()}`

  metaRow.append(sizeLabel, tokenLabel)

  // Text preview
  const previewBox = document.createElement('div')
  previewBox.style.cssText = `
    background: var(--hchat-bg);
    border-radius: 8px;
    padding: 10px;
    font-size: 12px;
    font-family: 'SF Mono', Monaco, Consolas, monospace;
    color: var(--hchat-text-secondary);
    max-height: 120px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.6;
  `
  previewBox.textContent = truncatePreview(fileInfo.content, 500)

  wrapper.append(infoRow, metaRow, previewBox)
  container.appendChild(wrapper)

  // Event
  resetBtn.addEventListener('click', () => onReset())
}
