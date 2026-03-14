import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import {
  scoreElement,
  getLinkDensity,
  getParagraphScore,
  removeNoise,
  collectCandidates,
  cleanText,
  detectPageType,
  extractMainContent,
} from '../readability'

function createDoc(html: string): Document {
  return new JSDOM(html).window.document
}

describe('scoreElement', () => {
  it('should give high score to article tag', () => {
    const doc = createDoc('<article id="main-content">text</article>')
    const el = doc.querySelector('article')!
    expect(scoreElement(el)).toBeGreaterThanOrEqual(25)
  })

  it('should give positive bonus for content-related class', () => {
    const doc = createDoc('<div class="article-content">text</div>')
    const el = doc.querySelector('div')!
    expect(scoreElement(el)).toBeGreaterThan(5)
  })

  it('should give negative score for nav/sidebar class', () => {
    const doc = createDoc('<div class="sidebar-widget">text</div>')
    const el = doc.querySelector('div')!
    expect(scoreElement(el)).toBeLessThan(5)
  })

  it('should score plain div at 5', () => {
    const doc = createDoc('<div>text</div>')
    const el = doc.querySelector('div')!
    expect(scoreElement(el)).toBe(5)
  })
})

describe('getLinkDensity', () => {
  it('should return 0 for element with no links', () => {
    const doc = createDoc('<div>Hello world this is content</div>')
    expect(getLinkDensity(doc.querySelector('div')!)).toBe(0)
  })

  it('should return high density for link-heavy element', () => {
    const doc = createDoc('<div><a href="#">Link 1</a> <a href="#">Link 2</a> x</div>')
    const density = getLinkDensity(doc.querySelector('div')!)
    expect(density).toBeGreaterThan(0.5)
  })

  it('should return 0 for empty element', () => {
    const doc = createDoc('<div></div>')
    expect(getLinkDensity(doc.querySelector('div')!)).toBe(0)
  })
})

describe('getParagraphScore', () => {
  it('should score element with multiple paragraphs', () => {
    const doc = createDoc(`
      <div>
        <p>This is a paragraph with some text, more text, and even more text here.</p>
        <p>Another paragraph with content, separated by commas, for scoring.</p>
      </div>
    `)
    const score = getParagraphScore(doc.querySelector('div')!)
    expect(score).toBeGreaterThanOrEqual(2)
  })

  it('should return 0 for element with no paragraphs', () => {
    const doc = createDoc('<div><span>text</span></div>')
    expect(getParagraphScore(doc.querySelector('div')!)).toBe(0)
  })

  it('should ignore short paragraphs', () => {
    const doc = createDoc('<div><p>Hi</p><p>Ok</p></div>')
    expect(getParagraphScore(doc.querySelector('div')!)).toBe(0)
  })
})

describe('removeNoise', () => {
  it('should remove script and style elements', () => {
    const doc = createDoc('<html><body><script>evil()</script><style>body{}</style><p>content</p></body></html>')
    removeNoise(doc)
    expect(doc.querySelectorAll('script')).toHaveLength(0)
    expect(doc.querySelectorAll('style')).toHaveLength(0)
    expect(doc.querySelector('p')?.textContent).toBe('content')
  })

  it('should remove nav and footer', () => {
    const doc = createDoc('<html><body><nav>menu</nav><main>content</main><footer>links</footer></body></html>')
    removeNoise(doc)
    expect(doc.querySelectorAll('nav')).toHaveLength(0)
    expect(doc.querySelectorAll('footer')).toHaveLength(0)
  })

  it('should remove cookie banners', () => {
    const doc = createDoc('<html><body><div class="cookie-banner">cookies</div><p>content</p></body></html>')
    removeNoise(doc)
    expect(doc.querySelector('.cookie-banner')).toBeNull()
  })
})

describe('collectCandidates', () => {
  it('should find article elements as candidates', () => {
    const doc = createDoc(`
      <html><body>
        <article>
          <p>Long paragraph with substantial text content that exceeds the minimum threshold of eighty characters for scoring purposes.</p>
          <p>Another long paragraph with sufficient text, commas, and content to score well in the readability algorithm.</p>
        </article>
      </body></html>
    `)
    const candidates = collectCandidates(doc)
    expect(candidates.length).toBeGreaterThanOrEqual(1)
  })

  it('should filter out elements with high link density', () => {
    const doc = createDoc(`
      <html><body>
        <div>
          <a href="#">Link1</a> <a href="#">Link2</a> <a href="#">Link3</a> <a href="#">Link4</a> <a href="#">Link5</a>
          <a href="#">Link6</a> <a href="#">Link7</a> <a href="#">Link8</a> <a href="#">Link9</a> <a href="#">Link10</a>
        </div>
      </body></html>
    `)
    const candidates = collectCandidates(doc)
    expect(candidates).toHaveLength(0)
  })

  it('should ignore elements shorter than 80 chars', () => {
    const doc = createDoc('<html><body><p>Short text</p></body></html>')
    const candidates = collectCandidates(doc)
    expect(candidates).toHaveLength(0)
  })
})

describe('cleanText', () => {
  it('should collapse multiple blank lines and filter empties', () => {
    // After regex \n{3,} → \n\n, split+filter removes empty lines
    expect(cleanText('a\n\n\n\nb')).toBe('a\nb')
  })

  it('should trim whitespace from lines', () => {
    expect(cleanText('  hello  \n  world  ')).toBe('hello\nworld')
  })

  it('should respect maxLength', () => {
    const long = 'a'.repeat(10000)
    expect(cleanText(long, 100).length).toBe(100)
  })

  it('should filter empty lines between content', () => {
    expect(cleanText('a\n\n\nb')).toBe('a\nb')
  })
})

describe('detectPageType', () => {
  it('should detect article from URL', () => {
    const doc = createDoc('<html><body></body></html>')
    expect(detectPageType('https://blog.com/article/123', doc)).toBe('article')
  })

  it('should detect product from URL', () => {
    const doc = createDoc('<html><body></body></html>')
    expect(detectPageType('https://shop.com/product/abc', doc)).toBe('product')
  })

  it('should detect doc from URL', () => {
    const doc = createDoc('<html><body></body></html>')
    expect(detectPageType('https://lib.com/docs/api', doc)).toBe('doc')
  })

  it('should detect article from og:type meta', () => {
    const doc = createDoc('<html><head><meta property="og:type" content="article"></head><body></body></html>')
    expect(detectPageType('https://example.com', doc)).toBe('article')
  })

  it('should return general for unknown pages', () => {
    const doc = createDoc('<html><body></body></html>')
    expect(detectPageType('https://example.com', doc)).toBe('general')
  })
})

describe('extractMainContent', () => {
  it('should extract content from article-based page', () => {
    const doc = createDoc(`
      <html><body>
        <nav>Home | About | Contact</nav>
        <article>
          <p>This is the main article content that contains important information for the reader. It should be extracted as the primary content of the page.</p>
          <p>Second paragraph with more detail, additional context, and supporting information that adds value to the article content.</p>
        </article>
        <footer>Copyright 2026</footer>
      </body></html>
    `)
    const content = extractMainContent(doc)
    expect(content).toContain('main article content')
    expect(content).not.toContain('Home | About')
    expect(content).not.toContain('Copyright')
  })

  it('should fall back to body text when no candidates found', () => {
    const doc = createDoc('<html><body>Simple page content</body></html>')
    const content = extractMainContent(doc)
    expect(content).toBe('Simple page content')
  })

  it('should respect maxLength', () => {
    const longParagraph = 'x'.repeat(500)
    const doc = createDoc(`<html><body><article><p>${longParagraph}</p></article></body></html>`)
    const content = extractMainContent(doc, 100)
    expect(content.length).toBeLessThanOrEqual(100)
  })
})
