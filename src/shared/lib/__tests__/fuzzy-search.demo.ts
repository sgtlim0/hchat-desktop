/**
 * Demo showing fuzzy search in action
 * Run with: npx tsx src/shared/lib/__tests__/fuzzy-search.demo.ts
 */

import { fuzzySearch } from '../fuzzy-search'

// Sample data representing chat sessions
const sessions = [
  { id: 1, title: 'H Chat Desktop Introduction', createdAt: '2024-01-01' },
  { id: 2, title: 'TypeScript Best Practices', createdAt: '2024-01-02' },
  { id: 3, title: 'React Performance Optimization', createdAt: '2024-01-03' },
  { id: 4, title: 'Building a Chat Application', createdAt: '2024-01-04' },
  { id: 5, title: '새 채팅 시작하기', createdAt: '2024-01-05' },
  { id: 6, title: 'AI 프롬프트 작성 가이드', createdAt: '2024-01-06' },
  { id: 7, title: 'Debugging TypeScript Errors', createdAt: '2024-01-07' },
  { id: 8, title: 'Chat with Claude Assistant', createdAt: '2024-01-08' },
]

console.log('🔍 Fuzzy Search Demo\n')
console.log('Sessions:', sessions.map(s => s.title).join(', '))
console.log('\n' + '='.repeat(60) + '\n')

// Test different queries
const queries = [
  'chat',      // Should match "H Chat Desktop", "Building a Chat Application", "Chat with Claude"
  'tpye',      // Typo for "type" - should still match "TypeScript"
  'react',     // Should match "React Performance"
  '채팅',      // Korean - should match "새 채팅 시작하기"
  'ts',        // Abbreviation - should match "TypeScript"
  'debug',     // Should match "Debugging TypeScript"
  'ai프롬',    // Korean partial - should match "AI 프롬프트"
]

queries.forEach(query => {
  console.log(`Query: "${query}"`)

  const results = fuzzySearch(
    query,
    sessions,
    s => s.title,
    { threshold: 0.3, limit: 3 }
  )

  if (results.length === 0) {
    console.log('  No matches found\n')
  } else {
    results.forEach(({ item, score, matchedRanges }) => {
      // Highlight matched portions
      let highlighted = item.title
      const ranges = [...matchedRanges].sort((a, b) => b[0] - a[0]) // Process from end to start

      for (const [start, end] of ranges) {
        highlighted =
          highlighted.slice(0, start) +
          '[' + highlighted.slice(start, end) + ']' +
          highlighted.slice(end)
      }

      console.log(`  ${score.toFixed(2)} | ${highlighted}`)
    })
    console.log()
  }
})

console.log('✅ Demo complete!')