/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { extractPageIntelligence, extractPageContent, intelligenceToContext } from '../content/page-extractor'

describe('extractPageIntelligence', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    document.title = 'Test Page'
    document.documentElement.lang = 'en'
  })

  it('extracts basic page intelligence', () => {
    document.body.innerHTML = `
      <article>
        <h1>Main Title</h1>
        <p>This is the main content of the page with enough text to be meaningful for extraction.</p>
        <h2>Section One</h2>
        <p>Content for section one with some details and information.</p>
        <h2>Section Two</h2>
        <p>Content for section two with more details.</p>
      </article>
    `

    const intel = extractPageIntelligence()

    expect(intel.url).toBeTruthy()
    expect(intel.title).toBe('Test Page')
    expect(intel.metadata.language).toBe('en')
    expect(intel.sections.length).toBeGreaterThan(0)
    expect(intel.rawText).toContain('Main Title')
    expect(intel.readingTime).toBeGreaterThanOrEqual(1)
    expect(intel.contentDensity).toBeGreaterThanOrEqual(0)
    expect(intel.contentDensity).toBeLessThanOrEqual(1)
  })

  it('extracts tables from page', () => {
    document.body.innerHTML = `
      <table>
        <thead><tr><th>Name</th><th>Value</th></tr></thead>
        <tbody>
          <tr><td>Alpha</td><td>100</td></tr>
          <tr><td>Beta</td><td>200</td></tr>
        </tbody>
      </table>
    `

    const intel = extractPageIntelligence()
    expect(intel.tables.length).toBe(1)
    expect(intel.tables[0].headers).toEqual(['Name', 'Value'])
    expect(intel.tables[0].rows.length).toBe(2)
  })

  it('extracts lists from page', () => {
    document.body.innerHTML = `
      <ul>
        <li>Item one with content</li>
        <li>Item two with content</li>
        <li>Item three with content</li>
      </ul>
    `

    const intel = extractPageIntelligence()
    expect(intel.lists.length).toBe(1)
    expect(intel.lists[0].items.length).toBe(3)
  })

  it('extracts links from page', () => {
    document.body.innerHTML = `
      <a href="https://example.com">Example Link</a>
      <a href="/internal">Internal Link</a>
    `

    const intel = extractPageIntelligence()
    expect(intel.links.length).toBeGreaterThanOrEqual(1)
  })

  it('extracts images from page', () => {
    document.body.innerHTML = `
      <img src="https://example.com/image.jpg" alt="Test Image" width="200" height="150" />
    `

    const intel = extractPageIntelligence()
    expect(intel.images.length).toBe(1)
    expect(intel.images[0].alt).toBe('Test Image')
  })

  it('removes noise elements', () => {
    document.body.innerHTML = `
      <nav><a href="/">Home</a><a href="/about">About</a></nav>
      <main><p>This is the real content of the page that matters most.</p></main>
      <footer><p>Footer info copyright notice</p></footer>
    `

    const intel = extractPageIntelligence()
    expect(intel.rawText).not.toContain('Footer info')
  })

  it('handles empty body gracefully', () => {
    document.body.innerHTML = ''

    const intel = extractPageIntelligence()
    expect(intel.rawText).toBe('')
    expect(intel.sections).toEqual([])
    expect(intel.tables).toEqual([])
    expect(intel.readingTime).toBe(0)
  })

  it('truncates very long text', () => {
    document.body.innerHTML = `<p>${'a'.repeat(200000)}</p>`

    const intel = extractPageIntelligence()
    expect(intel.rawText.length).toBeLessThanOrEqual(100020)
    expect(intel.rawText).toContain('[...truncated]')
  })

  it('extracts metadata when present', () => {
    const meta = document.createElement('meta')
    meta.setAttribute('property', 'og:title')
    meta.content = 'OG Title Test'
    document.head.appendChild(meta)

    document.body.innerHTML = '<p>Content here for testing metadata extraction.</p>'

    const intel = extractPageIntelligence()
    expect(intel.metadata.ogTitle).toBe('OG Title Test')
  })
})

describe('extractPageContent', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.title = 'Test'
    document.documentElement.lang = 'en'
  })

  it('returns backward-compatible PageContext', () => {
    document.body.innerHTML = '<p>Hello World content for testing.</p>'

    const ctx = extractPageContent()
    expect(ctx.url).toBeTruthy()
    expect(ctx.title).toBe('Test')
    expect(ctx.text).toContain('Hello World')
  })

  it('preserves text property for legacy consumers', () => {
    document.body.innerHTML = '<p>Legacy content text extraction test.</p>'

    const ctx = extractPageContent()
    expect(typeof ctx.text).toBe('string')
    expect(ctx.text.length).toBeGreaterThan(0)
  })
})

describe('intelligenceToContext', () => {
  it('generates structured markdown', () => {
    const intel = {
      url: 'https://example.com',
      title: 'Test Article',
      metadata: { language: 'en', author: 'John Doe', publishedDate: '2024-01-01' } as any,
      sections: [
        { level: 2, heading: 'Introduction', content: 'Intro text content here.', children: [] },
        { level: 2, heading: 'Conclusion', content: 'Conclusion text here.', children: [] },
      ],
      tables: [
        { headers: ['Col A', 'Col B'], rows: [['1', '2'], ['3', '4']], sourceIndex: 0 },
      ],
      lists: [{ type: 'unordered' as const, items: ['a', 'b'], sourceIndex: 0 }],
      links: [],
      images: [],
      readingTime: 3,
      contentDensity: 0.7,
      rawText: 'raw text',
    }

    const context = intelligenceToContext(intel)

    expect(context).toContain('# Test Article')
    expect(context).toContain('Author: John Doe')
    expect(context).toContain('Reading time: ~3 min')
    expect(context).toContain('## Content Structure')
    expect(context).toContain('Introduction')
    expect(context).toContain('Conclusion')
    expect(context).toContain('## Tables (1 found)')
    expect(context).toContain('Col A | Col B')
    expect(context).toContain('## Lists (1 found)')
  })

  it('handles empty intelligence', () => {
    const intel = {
      url: 'https://example.com',
      title: 'Empty',
      metadata: { language: 'en' } as any,
      sections: [],
      tables: [],
      lists: [],
      links: [],
      images: [],
      readingTime: 0,
      contentDensity: 0,
      rawText: '',
    }

    const context = intelligenceToContext(intel)
    expect(context).toContain('# Empty')
    expect(context).not.toContain('## Content Structure')
    expect(context).not.toContain('## Tables')
  })
})
