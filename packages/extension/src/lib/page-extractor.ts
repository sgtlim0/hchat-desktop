export interface PageMeta {
  title: string
  url: string
  description: string
  mainContent: string
}

export function extractPageText(maxLength = 15000): string {
  const mainEl = document.querySelector('main, article, [role="main"]')
  const text = (mainEl?.textContent || document.body.innerText || '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.slice(0, maxLength)
}

export function extractMeta(): PageMeta {
  const getMeta = (name: string): string =>
    document
      .querySelector(`meta[name="${name}"], meta[property="${name}"]`)
      ?.getAttribute('content') || ''

  return {
    title: document.title,
    url: location.href,
    description: getMeta('description') || getMeta('og:description'),
    mainContent: extractPageText(500),
  }
}
