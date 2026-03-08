export interface FuzzyResult<T> {
  item: T
  score: number
  matchedRanges: Array<[number, number]>
}

export function fuzzyScore(
  query: string,
  text: string,
): { score: number; ranges: Array<[number, number]> } {
  if (!query) return { score: 1, ranges: [] }
  if (!text) return { score: 0, ranges: [] }

  const q = query.toLowerCase()
  const t = text.toLowerCase()

  // Exact match
  if (t === q) return { score: 1, ranges: [[0, text.length - 1]] }

  // Substring match
  const subIdx = t.indexOf(q)
  if (subIdx !== -1) {
    const positionBonus = subIdx === 0 ? 0.1 : 0
    const lengthRatio = q.length / t.length
    return {
      score: Math.min(1, 0.7 + lengthRatio * 0.2 + positionBonus),
      ranges: [[subIdx, subIdx + q.length - 1]],
    }
  }

  // Subsequence match
  let qi = 0
  let consecutive = 0
  let maxConsecutive = 0
  let totalMatched = 0
  const ranges: Array<[number, number]> = []
  let rangeStart = -1

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      if (rangeStart === -1) rangeStart = ti
      consecutive++
      maxConsecutive = Math.max(maxConsecutive, consecutive)
      totalMatched++
      qi++
    } else {
      if (rangeStart !== -1) {
        ranges.push([rangeStart, ti - 1])
        rangeStart = -1
      }
      consecutive = 0
    }
  }

  if (rangeStart !== -1) {
    ranges.push([rangeStart, ranges.length > 0 ? ranges[ranges.length - 1][1] + consecutive : rangeStart + consecutive - 1])
  }

  if (qi < q.length) return { score: 0, ranges: [] }

  const matchRatio = totalMatched / t.length
  const consecutiveBonus = maxConsecutive / q.length
  const score = Math.min(1, matchRatio * 0.3 + consecutiveBonus * 0.4 + 0.1)

  return { score, ranges }
}

export function fuzzySearch<T>(
  query: string,
  items: T[],
  getText: (item: T) => string,
  options?: { threshold?: number; limit?: number },
): FuzzyResult<T>[] {
  const threshold = options?.threshold ?? 0.3
  const limit = options?.limit ?? items.length

  if (!query.trim()) {
    return items.slice(0, limit).map((item) => ({
      item,
      score: 1,
      matchedRanges: [],
    }))
  }

  return items
    .map((item) => {
      const text = getText(item)
      const { score, ranges } = fuzzyScore(query, text)
      return { item, score, matchedRanges: ranges }
    })
    .filter((r) => r.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
