/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { extractMetadata } from '../content/metadata-extractor'

function setMeta(property: string, content: string) {
  const meta = document.createElement('meta')
  meta.setAttribute('property', property)
  meta.content = content
  document.head.appendChild(meta)
}

function setNameMeta(name: string, content: string) {
  const meta = document.createElement('meta')
  meta.name = name
  meta.content = content
  document.head.appendChild(meta)
}

function addJsonLd(data: Record<string, unknown>) {
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}

describe('extractMetadata', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.documentElement.lang = 'en'
  })

  it('extracts OpenGraph metadata', () => {
    setMeta('og:title', 'OG Title')
    setMeta('og:description', 'OG Desc')
    setMeta('og:image', 'https://img.com/og.jpg')
    setMeta('og:type', 'article')

    const meta = extractMetadata()
    expect(meta.ogTitle).toBe('OG Title')
    expect(meta.ogDescription).toBe('OG Desc')
    expect(meta.ogImage).toBe('https://img.com/og.jpg')
    expect(meta.ogType).toBe('article')
  })

  it('falls back to description meta for ogDescription', () => {
    setNameMeta('description', 'Page description')

    const meta = extractMetadata()
    expect(meta.ogDescription).toBe('Page description')
  })

  it('extracts language from html lang', () => {
    document.documentElement.lang = 'ko'
    const meta = extractMetadata()
    expect(meta.language).toBe('ko')
  })

  it('extracts author from meta tag', () => {
    setNameMeta('author', 'John Doe')
    const meta = extractMetadata()
    expect(meta.author).toBe('John Doe')
  })

  it('extracts JSON-LD data', () => {
    addJsonLd({ '@type': 'Article', headline: 'Test' })

    const meta = extractMetadata()
    expect(meta.jsonLd).toHaveLength(1)
    expect(meta.jsonLd![0]['@type']).toBe('Article')
  })

  it('handles malformed JSON-LD gracefully', () => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = '{invalid json'
    document.head.appendChild(script)

    const meta = extractMetadata()
    expect(meta.jsonLd).toHaveLength(0)
  })

  it('extracts canonical URL', () => {
    const link = document.createElement('link')
    link.rel = 'canonical'
    link.href = 'https://example.com/canonical'
    document.head.appendChild(link)

    const meta = extractMetadata()
    expect(meta.canonicalUrl).toBe('https://example.com/canonical')
  })

  it('extracts published date from article:published_time', () => {
    setMeta('article:published_time', '2024-01-15T10:00:00Z')
    const meta = extractMetadata()
    expect(meta.publishedDate).toBe('2024-01-15T10:00:00Z')
  })

  it('extracts published date from time element', () => {
    const time = document.createElement('time')
    time.dateTime = '2024-06-01'
    document.body.appendChild(time)

    const meta = extractMetadata()
    expect(meta.publishedDate).toBe('2024-06-01')

    document.body.removeChild(time)
  })

  it('returns defaults when no metadata present', () => {
    const meta = extractMetadata()
    expect(meta.ogTitle).toBeUndefined()
    expect(meta.ogDescription).toBeUndefined()
    expect(meta.author).toBeUndefined()
    expect(meta.language).toBe('en')
  })
})
