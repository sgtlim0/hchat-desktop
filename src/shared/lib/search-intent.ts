const SEARCH_KEYWORDS = [
  'search for',
  'look up',
  'find me',
  'find information',
  'google',
  'what is the latest',
  'what are the latest',
  'current news',
  'recent news',
  'today',
  'yesterday',
  'this week',
  'this month',
  'in 2025',
  'in 2026',
  'latest version',
  'release date',
  'stock price',
  'weather',
  'score',
  'how much does',
  'where can I',
  'who won',
  'who is the current',
]

const SEARCH_PATTERNS = [
  /what('s| is| are) .+ (right now|today|currently|these days)/i,
  /when (is|was|will|did) .+ (happening|released|announced|scheduled)/i,
  /https?:\/\/\S+/,
  /검색|찾아|최신|최근|오늘|어제|뉴스|현재|지금/,
]

export function detectSearchIntent(message: string): boolean {
  const lower = message.toLowerCase()

  for (const keyword of SEARCH_KEYWORDS) {
    if (lower.includes(keyword)) {
      return true
    }
  }

  for (const pattern of SEARCH_PATTERNS) {
    if (pattern.test(message)) {
      return true
    }
  }

  return false
}
