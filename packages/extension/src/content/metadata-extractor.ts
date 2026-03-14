import type { PageMetadata } from '@ext/shared/types'

function getMetaContent(name: string): string | undefined {
  const el =
    document.querySelector<HTMLMetaElement>(`meta[property="${name}"]`) ||
    document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  return el?.content || undefined
}

function extractJsonLd(): ReadonlyArray<Record<string, unknown>> {
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    'script[type="application/ld+json"]',
  )
  const results: Record<string, unknown>[] = []
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script.textContent || '')
      if (Array.isArray(parsed)) {
        results.push(...parsed)
      } else {
        results.push(parsed)
      }
    } catch {
      // skip malformed JSON-LD
    }
  }
  return results
}

function extractAuthor(): string | undefined {
  const meta = getMetaContent('author')
  if (meta) return meta

  const jsonLd = extractJsonLd()
  for (const item of jsonLd) {
    if (typeof item.author === 'string') return item.author
    if (item.author && typeof (item.author as Record<string, unknown>).name === 'string') {
      return (item.author as Record<string, unknown>).name as string
    }
  }

  const authorEl = document.querySelector('[rel="author"], .author, [itemprop="author"]')
  return authorEl?.textContent?.trim() || undefined
}

function extractPublishedDate(): string | undefined {
  const meta =
    getMetaContent('article:published_time') ||
    getMetaContent('datePublished') ||
    getMetaContent('date')
  if (meta) return meta

  const timeEl = document.querySelector<HTMLTimeElement>('time[datetime]')
  if (timeEl?.dateTime) return timeEl.dateTime

  const jsonLd = extractJsonLd()
  for (const item of jsonLd) {
    if (typeof item.datePublished === 'string') return item.datePublished
  }

  return undefined
}

export function extractMetadata(): PageMetadata {
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')

  return {
    ogTitle: getMetaContent('og:title'),
    ogDescription: getMetaContent('og:description') || getMetaContent('description'),
    ogImage: getMetaContent('og:image'),
    ogType: getMetaContent('og:type'),
    author: extractAuthor(),
    publishedDate: extractPublishedDate(),
    language: document.documentElement.lang || 'unknown',
    canonicalUrl: canonical?.href || undefined,
    jsonLd: extractJsonLd(),
  }
}
