export interface SearchResult {
  title: string
  url: string
  snippet: string
}

interface SearchResponse {
  results: SearchResult[]
  error?: string
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export async function webSearch(
  query: string,
  maxResults: number = 5
): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${API_BASE}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, maxResults }),
    })

    if (!response.ok) {
      throw new Error(`Search failed: HTTP ${response.status}`)
    }

    const data: SearchResponse = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    return data.results
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Web search failed'
    throw new Error(message)
  }
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No search results found.'
  }

  return results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\n    URL: ${r.url}\n    ${r.snippet}`
    )
    .join('\n\n')
}
