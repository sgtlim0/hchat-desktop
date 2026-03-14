/**
 * 3-tier Korean tokenizer for full-text search.
 *
 * Tier 1: Space split
 * Tier 2: Korean n-gram (2-4 char sliding window)
 * Tier 3: Compound word decomposition
 */

function isKorean(char: string): boolean {
  return /[가-힣]/.test(char)
}

function koreanNgrams(word: string, min = 2, max = 4): string[] {
  if (word.length <= min) return [word]

  const grams: string[] = [word]
  for (let size = min; size <= Math.min(max, word.length); size++) {
    for (let i = 0; i <= word.length - size; i++) {
      grams.push(word.slice(i, i + size))
    }
  }
  return grams
}

const COMPOUND_PATTERNS: ReadonlyArray<readonly [RegExp, readonly string[]]> = [
  [/스마트폰/, ['스마트', '폰']],
  [/노트북/, ['노트', '북']],
  [/가격비교/, ['가격', '비교']],
  [/쇼핑몰/, ['쇼핑', '몰']],
  [/배송비/, ['배송', '비']],
  [/무료배송/, ['무료', '배송']],
  [/할인율/, ['할인', '율']],
  [/판매자/, ['판매', '자']],
  [/구매자/, ['구매', '자']],
  [/인공지능/, ['인공', '지능']],
  [/머신러닝/, ['머신', '러닝']],
  [/딥러닝/, ['딥', '러닝']],
  [/확장프로그램/, ['확장', '프로그램']],
  [/데이터베이스/, ['데이터', '베이스']],
  [/프로그래밍/, ['프로그래', '밍']],
  [/프레임워크/, ['프레임', '워크']],
  [/라이브러리/, ['라이브', '러리']],
  [/웹사이트/, ['웹', '사이트']],
  [/검색엔진/, ['검색', '엔진']],
  [/사용자/, ['사용', '자']],
  [/개발자/, ['개발', '자']],
  [/프론트엔드/, ['프론트', '엔드']],
  [/백엔드/, ['백', '엔드']],
  [/운영체제/, ['운영', '체제']],
  [/클라우드/, ['클라', '우드']],
  [/블록체인/, ['블록', '체인']],
  [/가상화폐/, ['가상', '화폐']],
  [/자동완성/, ['자동', '완성']],
  [/다운로드/, ['다운', '로드']],
  [/업데이트/, ['업', '데이트']],
]

function splitCompound(word: string): string[] {
  const extras: string[] = []
  for (const [pattern, parts] of COMPOUND_PATTERNS) {
    if (pattern.test(word)) {
      extras.push(...parts)
    }
  }
  return extras
}

export function tokenize(text: string): string[] {
  const tokens = new Set<string>()

  const cleaned = text
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned) return []

  const words = cleaned.split(' ').filter((w) => w.length >= 2)

  for (const word of words) {
    tokens.add(word)

    if (isKorean(word[0])) {
      for (const gram of koreanNgrams(word, 2, 4)) {
        tokens.add(gram)
      }
      for (const part of splitCompound(word)) {
        tokens.add(part)
      }
    } else {
      // English: prefix generation for autocomplete
      for (let i = 3; i < word.length; i++) {
        tokens.add(word.slice(0, i))
      }
    }
  }

  return [...tokens].filter((t) => t.length >= 2 && t.length <= 20)
}

export function computeRelevanceScore(
  query: string,
  title: string,
  matchedTokenCount: number,
  queryTokenCount: number,
  savedAt?: number,
): number {
  let score = 0

  // Match ratio (0-40 points)
  const matchRatio = queryTokenCount > 0 ? matchedTokenCount / queryTokenCount : 0
  score += matchRatio * 40

  // Title contains raw query (30 points)
  if (title.toLowerCase().includes(query.toLowerCase())) {
    score += 30
  }

  // Recency bonus — 7 days decay (0-10 points)
  if (savedAt) {
    const daysSince = (Date.now() - savedAt) / 86_400_000
    score += Math.max(0, 10 - daysSince)
  }

  return Math.round(score)
}
