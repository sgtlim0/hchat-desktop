/**
 * Example integration of fuzzy search in the H Chat app
 * This shows how to use fuzzy search with existing stores
 */

import { fuzzySearch } from '../fuzzy-search'
import type { Session } from '../../types'

// Example: Search sessions with fuzzy matching
export function searchSessions(query: string, sessions: Session[]): Session[] {
  const results = fuzzySearch(
    query,
    sessions,
    session => session.title,
    {
      threshold: 0.3,  // Minimum score to include
      limit: 10        // Maximum results
    }
  )

  return results.map(r => r.item)
}

// Example: Search messages within a session
export function searchMessages(
  query: string,
  messages: Array<{ content: string; role: string }>
): Array<{ message: { content: string; role: string }; score: number; highlights: Array<[number, number]> }> {
  const results = fuzzySearch(
    query,
    messages,
    msg => msg.content,
    {
      threshold: 0.2,  // Lower threshold for message content
      limit: 20
    }
  )

  return results.map(r => ({
    message: r.item,
    score: r.score,
    highlights: r.matchedRanges
  }))
}

// Example: Search prompt templates
export function searchPromptTemplates(
  query: string,
  templates: Array<{ name: string; content: string; category: string }>
) {
  // Search both name and content
  const nameResults = fuzzySearch(query, templates, t => t.name, { threshold: 0.4 })
  const contentResults = fuzzySearch(query, templates, t => t.content, { threshold: 0.3 })

  // Combine and deduplicate results
  const combined = new Map<{ name: string; content: string; category: string }, number>()

  nameResults.forEach(r => {
    combined.set(r.item, Math.max(r.score * 1.5, combined.get(r.item) || 0)) // Name matches get bonus
  })

  contentResults.forEach(r => {
    combined.set(r.item, Math.max(r.score, combined.get(r.item) || 0))
  })

  return Array.from(combined.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([item]) => item)
}

// Example: React hook for fuzzy search
export function useFuzzySearch<T>(
  items: T[],
  getText: (item: T) => string,
  options?: { threshold?: number; limit?: number }
) {
  const search = (query: string) => {
    if (!query.trim()) {
      return items.slice(0, options?.limit)
    }

    return fuzzySearch(query, items, getText, options).map(r => r.item)
  }

  return { search }
}

// Example usage in a React component:
/*
function SearchModal() {
  const sessions = useSessionStore(state => state.sessions)
  const { search } = useFuzzySearch(sessions, s => s.title, { limit: 5 })

  const [query, setQuery] = useState('')
  const results = search(query)

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search sessions..."
      />
      {results.map(session => (
        <div key={session.id}>{session.title}</div>
      ))}
    </div>
  )
}
*/