import * as pdfjsLib from 'pdfjs-dist'
import type { FileInfo, FileType } from '../shared/types'

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.mjs'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_TEXT_LENGTH = 100_000

const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.csv', '.json'])
const CODE_EXTENSIONS = new Set([
  '.js', '.ts', '.jsx', '.tsx', '.py', '.java',
  '.c', '.cpp', '.go', '.rs', '.html', '.css',
  '.xml', '.yaml', '.yml', '.sql',
])

function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.')
  return idx >= 0 ? fileName.slice(idx).toLowerCase() : ''
}

function truncateText(text: string): string {
  if (text.length <= MAX_TEXT_LENGTH) return text
  return text.slice(0, MAX_TEXT_LENGTH) + '\n\n[...truncated]'
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다'))
    reader.readAsText(file)
  })
}

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    pages.push(pageText)
  }

  return pages.join('\n\n')
}

function detectFileType(ext: string): FileType {
  if (ext === '.pdf') return 'pdf'
  if (TEXT_EXTENSIONS.has(ext)) return 'text'
  if (CODE_EXTENSIONS.has(ext)) return 'code'
  return 'text'
}

export async function parseFile(file: File): Promise<FileInfo> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('파일 크기가 10MB를 초과합니다. 더 작은 파일을 선택해주세요.')
  }

  const ext = getExtension(file.name)

  if (ext === '.pdf') {
    const rawText = await extractPdfText(file)
    return {
      name: file.name,
      size: file.size,
      type: 'PDF',
      content: truncateText(rawText),
      extension: ext,
      fileName: file.name,
      fileType: 'pdf',
      charCount: rawText.length,
      truncated: rawText.length > MAX_TEXT_LENGTH,
    }
  }

  if (TEXT_EXTENSIONS.has(ext) || CODE_EXTENSIONS.has(ext)) {
    const rawText = await readAsText(file)
    return {
      name: file.name,
      size: file.size,
      type: ext.replace('.', '').toUpperCase(),
      content: truncateText(rawText),
      extension: ext,
      fileName: file.name,
      fileType: detectFileType(ext),
      charCount: rawText.length,
      truncated: rawText.length > MAX_TEXT_LENGTH,
    }
  }

  throw new Error(
    `지원하지 않는 파일 형식입니다: ${ext || '(확장자 없음)'}. PDF, 텍스트, 코드 파일을 지원합니다.`
  )
}
