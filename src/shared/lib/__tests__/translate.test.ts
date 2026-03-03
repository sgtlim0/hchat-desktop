import { describe, it, expect, vi } from 'vitest'

// Mock pdf-extractor to avoid pdfjs-dist DOMMatrix dependency in test env
vi.mock('../pdf-extractor', () => ({
  extractPdfText: vi.fn(() => Promise.resolve({ text: 'PDF text content', pageCount: 1 })),
}))

import { splitIntoChunks, buildTranslateSystemPrompt, extractFileText } from '../translate'

describe('splitIntoChunks', () => {
  it('returns empty array for empty text', () => {
    expect(splitIntoChunks('')).toEqual([])
    expect(splitIntoChunks('   ')).toEqual([])
  })

  it('returns single chunk for short text', () => {
    const text = 'Hello world.'
    const result = splitIntoChunks(text, 2000)
    expect(result).toEqual([text])
  })

  it('splits long text into chunks', () => {
    const sentence = 'This is a test sentence. '
    const text = sentence.repeat(100) // ~2500 chars
    const result = splitIntoChunks(text, 500)
    expect(result.length).toBeGreaterThan(1)
    expect(result.join('')).toBe(text)
  })

  it('respects sentence boundaries', () => {
    const text = 'First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence.'
    const result = splitIntoChunks(text, 40)

    // Each chunk should end at a sentence boundary when possible
    for (const chunk of result.slice(0, -1)) {
      expect(chunk.trimEnd()).toMatch(/[.!?\n]$/)
    }
  })

  it('preserves all text (no data loss)', () => {
    const text = 'A'.repeat(5000)
    const result = splitIntoChunks(text, 1000)
    expect(result.join('')).toBe(text)
  })

  it('handles text shorter than chunk size', () => {
    const text = 'Short text.'
    const result = splitIntoChunks(text, 10000)
    expect(result).toEqual([text])
  })

  it('uses default chunk size of 2000', () => {
    const text = 'A'.repeat(3000)
    const result = splitIntoChunks(text)
    expect(result.length).toBe(2)
  })
})

describe('buildTranslateSystemPrompt', () => {
  it('builds prompt with known languages', () => {
    const prompt = buildTranslateSystemPrompt('en', 'ko')
    expect(prompt).toContain('English')
    expect(prompt).toContain('Korean')
    expect(prompt).toContain('professional translator')
  })

  it('uses auto description for auto source', () => {
    const prompt = buildTranslateSystemPrompt('auto', 'en')
    expect(prompt).toContain('the source language')
    expect(prompt).toContain('English')
  })

  it('falls back to raw value for unknown languages', () => {
    const prompt = buildTranslateSystemPrompt('pt', 'vi')
    expect(prompt).toContain('pt')
    expect(prompt).toContain('vi')
  })

  it('includes formatting preservation instruction', () => {
    const prompt = buildTranslateSystemPrompt('ko', 'en')
    expect(prompt).toContain('formatting')
    expect(prompt).toContain('Only output the translated text')
  })
})

describe('extractFileText', () => {
  it('extracts text from txt file', async () => {
    const content = 'Hello, this is a test file.'
    const file = new File([content], 'test.txt', { type: 'text/plain' })

    const result = await extractFileText(file)
    expect(result).toBe(content)
  })

  it('extracts text from md file', async () => {
    const content = '# Heading\n\nSome **bold** text.'
    const file = new File([content], 'readme.md', { type: 'text/markdown' })

    const result = await extractFileText(file)
    expect(result).toBe(content)
  })

  it('throws for unsupported file types', async () => {
    const file = new File(['data'], 'image.png', { type: 'image/png' })

    await expect(extractFileText(file)).rejects.toThrow('Unsupported file type')
  })
})
