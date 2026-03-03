import { extractPdfText } from './pdf-extractor'
import { createStream } from './providers/factory'
import type { ProviderConfig, StreamParams } from './providers/types'

/**
 * Extract text from uploaded file (PDF, TXT, MD).
 */
export async function extractFileText(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (ext === 'pdf') {
    const result = await extractPdfText(file)
    return result.text
  }

  if (['txt', 'md', 'markdown', 'text'].includes(ext)) {
    return await file.text()
  }

  throw new Error(`Unsupported file type: .${ext}`)
}

/**
 * Split text into chunks respecting sentence boundaries.
 */
export function splitIntoChunks(text: string, chunkSize = 2000): string[] {
  if (!text.trim()) return []
  if (text.length <= chunkSize) return [text]

  const chunks: string[] = []
  let remaining = text

  while (remaining.length > 0) {
    if (remaining.length <= chunkSize) {
      chunks.push(remaining)
      break
    }

    let splitIdx = chunkSize

    // Look backward for sentence boundary (., !, ?, newline)
    const searchRange = remaining.slice(Math.floor(chunkSize * 0.7), chunkSize)
    const sentenceEndMatch = searchRange.match(/.*[.!?\n]/s)

    if (sentenceEndMatch && sentenceEndMatch.index !== undefined) {
      splitIdx = Math.floor(chunkSize * 0.7) + sentenceEndMatch.index + sentenceEndMatch[0].length
    }

    chunks.push(remaining.slice(0, splitIdx))
    remaining = remaining.slice(splitIdx)
  }

  return chunks
}

/**
 * Translate a single chunk via LLM streaming.
 * Returns the full translated text.
 */
export async function translateChunk(
  chunk: string,
  systemPrompt: string,
  config: ProviderConfig,
  modelId: string,
  signal?: AbortSignal,
  onProgress?: (partialText: string) => void
): Promise<string> {
  const params: StreamParams = {
    modelId,
    messages: [{ role: 'user', content: chunk }],
    system: systemPrompt,
    signal,
  }

  const stream = createStream(config, params)
  let fullText = ''

  for await (const event of stream) {
    if (event.type === 'text' && event.content) {
      fullText += event.content
      onProgress?.(fullText)
    } else if (event.type === 'error') {
      throw new Error(event.error)
    }
  }

  return fullText
}

/**
 * Build system prompt for translation.
 */
export function buildTranslateSystemPrompt(
  sourceLang: string,
  targetLang: string
): string {
  const langNames: Record<string, string> = {
    auto: 'the source language',
    ko: 'Korean',
    en: 'English',
    ja: 'Japanese',
    zh: 'Chinese',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
  }

  const from = langNames[sourceLang] ?? sourceLang
  const to = langNames[targetLang] ?? targetLang

  return `You are a professional translator. Translate the following text from ${from} to ${to}. Preserve the original formatting, paragraph structure, and meaning. Only output the translated text without any explanation or commentary.`
}
