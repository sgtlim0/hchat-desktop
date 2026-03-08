import { describe, it, expect } from 'vitest'
import { extractHeadings, generateTOC, countCodeBlocks, extractCodeBlocks, stripMarkdown, wordCount, estimateReadingTime } from '../markdown-utils'

describe('markdown-utils', () => {
  describe('extractHeadings', () => {
    it('finds headings', () => {
      const md = '# Title\n\nText\n\n## Section\n\n### Sub'
      const h = extractHeadings(md)
      expect(h).toHaveLength(3)
      expect(h[0].level).toBe(1)
      expect(h[0].text).toBe('Title')
      expect(h[1].level).toBe(2)
    })

    it('returns empty for no headings', () => {
      expect(extractHeadings('Just text.')).toHaveLength(0)
    })

    it('generates slug ids', () => {
      const h = extractHeadings('# Hello World')
      expect(h[0].id).toBe('hello-world')
    })
  })

  describe('generateTOC', () => {
    it('creates nested TOC', () => {
      const h = extractHeadings('# A\n## B\n## C\n### D')
      const toc = generateTOC(h)
      expect(toc).toHaveLength(1) // 1 root
      expect(toc[0].children).toHaveLength(2) // B, C
    })

    it('handles single level', () => {
      const h = extractHeadings('## A\n## B')
      const toc = generateTOC(h)
      expect(toc).toHaveLength(2)
    })
  })

  describe('countCodeBlocks', () => {
    it('counts blocks', () => {
      expect(countCodeBlocks('```js\ncode\n```\n\n```py\ncode\n```')).toBe(2)
    })
    it('zero for none', () => {
      expect(countCodeBlocks('no code')).toBe(0)
    })
  })

  describe('extractCodeBlocks', () => {
    it('extracts language and content', () => {
      const blocks = extractCodeBlocks('```typescript\nconst x = 1\n```')
      expect(blocks).toHaveLength(1)
      expect(blocks[0].language).toBe('typescript')
      expect(blocks[0].content).toContain('const x')
    })
  })

  describe('stripMarkdown', () => {
    it('removes formatting', () => {
      expect(stripMarkdown('**bold** and *italic*')).toBe('bold and italic')
    })
    it('preserves plain text', () => {
      expect(stripMarkdown('Hello world')).toBe('Hello world')
    })
  })

  describe('wordCount', () => {
    it('counts words', () => {
      expect(wordCount('Hello world this is a test')).toBe(6)
    })
  })

  describe('estimateReadingTime', () => {
    it('returns at least 1 minute', () => {
      expect(estimateReadingTime('short')).toBe(1)
    })
    it('calculates for longer text', () => {
      const words = Array(400).fill('word').join(' ')
      expect(estimateReadingTime(words)).toBe(2) // 400/200 = 2
    })
  })
})
