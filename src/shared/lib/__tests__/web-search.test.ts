import { describe, it, expect, vi, beforeEach } from 'vitest'
import { webSearch, formatSearchResults } from '../web-search'

describe('webSearch', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should return search results on success', async () => {
    const mockResults = [
      { title: 'Result 1', url: 'https://example.com/1', snippet: 'Snippet 1' },
      { title: 'Result 2', url: 'https://example.com/2', snippet: 'Snippet 2' },
    ]
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: mockResults }),
    })

    const results = await webSearch('test query')

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/search'),
      expect.objectContaining({ method: 'POST' }),
    )
    expect(results).toEqual(mockResults)
  })

  it('should throw on HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })

    await expect(webSearch('query')).rejects.toThrow('Search failed: HTTP 500')
  })

  it('should throw on API error response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [], error: 'Rate limited' }),
    })

    await expect(webSearch('query')).rejects.toThrow('Rate limited')
  })

  it('should throw on network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    await expect(webSearch('query')).rejects.toThrow('Network error')
  })

  it('should pass maxResults parameter', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    })

    await webSearch('query', 10)

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ query: 'query', maxResults: 10 }),
      }),
    )
  })
})

describe('formatSearchResults', () => {
  it('should format results with numbering', () => {
    const results = [
      { title: 'Title A', url: 'https://a.com', snippet: 'Snippet A' },
      { title: 'Title B', url: 'https://b.com', snippet: 'Snippet B' },
    ]

    const formatted = formatSearchResults(results)

    expect(formatted).toContain('[1] Title A')
    expect(formatted).toContain('URL: https://a.com')
    expect(formatted).toContain('Snippet A')
    expect(formatted).toContain('[2] Title B')
  })

  it('should return no results message for empty array', () => {
    expect(formatSearchResults([])).toBe('No search results found.')
  })
})
