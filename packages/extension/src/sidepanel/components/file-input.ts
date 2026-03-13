import type { FileInfo } from '../../shared/types'

const SUPPORTED_EXTENSIONS = [
  '.pdf', '.txt', '.js', '.ts', '.py', '.json', '.html', '.css', '.md',
] as const

const EXTENSION_LABELS: Record<string, string> = {
  '.pdf': 'PDF',
  '.txt': 'TXT',
  '.js': 'JavaScript',
  '.ts': 'TypeScript',
  '.py': 'Python',
  '.json': 'JSON',
  '.html': 'HTML',
  '.css': 'CSS',
  '.md': 'Markdown',
}

function getAcceptString(): string {
  return SUPPORTED_EXTENSIONS.map((ext) => {
    if (ext === '.pdf') return 'application/pdf'
    if (ext === '.json') return 'application/json'
    if (ext === '.html') return 'text/html'
    if (ext === '.css') return 'text/css'
    if (ext === '.md') return 'text/markdown'
    return 'text/plain'
  }).join(',')
}

function getExtension(filename: string): string {
  const dotIdx = filename.lastIndexOf('.')
  return dotIdx >= 0 ? filename.slice(dotIdx).toLowerCase() : ''
}

function isSupportedFile(filename: string): boolean {
  const ext = getExtension(filename)
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)
}

async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('파일 읽기에 실패했습니다'))
    reader.readAsText(file)
  })
}

function buildFileInfo(file: File, content: string): FileInfo {
  const ext = getExtension(file.name)
  return {
    name: file.name,
    size: file.size,
    type: EXTENSION_LABELS[ext] ?? ext.replace('.', '').toUpperCase(),
    content,
    extension: ext,
  }
}

export type FileInputCallback = (fileInfo: FileInfo) => void
export type WebExtractCallback = () => void

export function initFileInput(
  container: HTMLElement,
  onFileSelect: FileInputCallback,
  onWebExtract: WebExtractCallback,
): void {
  const dropzone = document.createElement('div')
  dropzone.className = 'dropzone fade-in'

  const icon = document.createElement('div')
  icon.style.cssText = 'margin-bottom: 12px; color: var(--hchat-teal);'
  icon.innerHTML = `
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  `

  const title = document.createElement('p')
  title.style.cssText = 'font-weight: 600; font-size: 15px; margin-bottom: 4px; color: var(--hchat-text);'
  title.textContent = '파일을 드래그하거나 클릭하세요'

  const subtitle = document.createElement('p')
  subtitle.style.cssText = 'font-size: 12px; color: var(--hchat-text-secondary);'
  subtitle.textContent = 'PDF, TXT, JS, TS, PY, JSON, HTML, CSS, MD'

  const hiddenInput = document.createElement('input')
  hiddenInput.type = 'file'
  hiddenInput.accept = getAcceptString()
  hiddenInput.style.display = 'none'

  const divider = document.createElement('div')
  divider.style.cssText = `
    display: flex; align-items: center; gap: 12px;
    margin-top: 16px; color: var(--hchat-text-secondary); font-size: 12px;
  `
  const line1 = document.createElement('span')
  line1.style.cssText = 'flex: 1; height: 1px; background: var(--hchat-border);'
  const orText = document.createElement('span')
  orText.textContent = '또는'
  const line2 = document.createElement('span')
  line2.style.cssText = 'flex: 1; height: 1px; background: var(--hchat-border);'
  divider.append(line1, orText, line2)

  const webBtn = document.createElement('button')
  webBtn.className = 'btn-secondary'
  webBtn.style.cssText = 'margin-top: 12px; display: inline-flex; align-items: center; gap: 6px;'
  webBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
    현재 웹페이지 추출
  `

  dropzone.append(icon, title, subtitle)
  container.append(dropzone, hiddenInput, divider, webBtn)

  // Event: click dropzone to open file picker
  dropzone.addEventListener('click', () => hiddenInput.click())

  // Event: drag-drop
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault()
    dropzone.classList.add('drag-over')
  })
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-over')
  })
  dropzone.addEventListener('drop', async (e) => {
    e.preventDefault()
    dropzone.classList.remove('drag-over')
    const file = e.dataTransfer?.files[0]
    if (file) await handleFile(file)
  })

  // Event: file input change
  hiddenInput.addEventListener('change', async () => {
    const file = hiddenInput.files?.[0]
    if (file) await handleFile(file)
    hiddenInput.value = ''
  })

  // Event: web extract
  webBtn.addEventListener('click', () => onWebExtract())

  async function handleFile(file: File): Promise<void> {
    if (!isSupportedFile(file.name)) {
      alert('지원하지 않는 파일 형식입니다.\nPDF, TXT, JS, TS, PY, JSON, HTML, CSS, MD 파일만 가능합니다.')
      return
    }
    try {
      const content = await readFileContent(file)
      const fileInfo = buildFileInfo(file, content)
      onFileSelect(fileInfo)
    } catch (err) {
      const message = err instanceof Error ? err.message : '파일 처리 중 오류가 발생했습니다'
      alert(message)
    }
  }
}
