import type { Message, SentimentType, ConversationAnalysis } from '@/shared/types'

/**
 * Analyze sentiment of messages — simple keyword-based heuristic
 * (real LLM call would be done server-side)
 */
export function analyzeSentiment(messages: Message[]): SentimentType {
  // Count positive/negative keywords across all message text
  const positiveWords = ['감사', '좋아', '완벽', '훌륭', 'thanks', 'great', 'perfect', 'excellent', 'good', 'love', 'awesome', 'helpful', '도움', '성공']
  const negativeWords = ['문제', '오류', '실패', '안됨', 'error', 'fail', 'wrong', 'bad', 'broken', 'issue', 'bug', '버그', '불만']

  let positiveCount = 0
  let negativeCount = 0

  for (const msg of messages) {
    const text = msg.segments.map(s => s.content || '').join(' ').toLowerCase()
    for (const word of positiveWords) {
      if (text.includes(word.toLowerCase())) positiveCount++
    }
    for (const word of negativeWords) {
      if (text.includes(word.toLowerCase())) negativeCount++
    }
  }

  if (positiveCount > negativeCount + 2) return 'positive'
  if (negativeCount > positiveCount + 2) return 'negative'
  return 'neutral'
}

/**
 * Generate smart title from first few messages
 */
export function generateSmartTitle(messages: Message[]): string {
  // Take first user message content, truncate to ~40 chars
  const firstUserMsg = messages.find(m => m.role === 'user')
  if (!firstUserMsg) return 'New Conversation'

  const text = firstUserMsg.segments
    .filter(s => s.type === 'text')
    .map(s => s.content || '')
    .join(' ')
    .trim()

  if (!text) return 'New Conversation'

  // Remove newlines, trim whitespace
  const cleaned = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()

  if (cleaned.length <= 40) return cleaned

  // Cut at word boundary
  const truncated = cleaned.substring(0, 40)
  const lastSpace = truncated.lastIndexOf(' ')
  return (lastSpace > 20 ? truncated.substring(0, lastSpace) : truncated) + '...'
}

/**
 * Suggest tags based on message content — keyword extraction
 */
export function suggestTags(messages: Message[]): string[] {
  const tagKeywords: Record<string, string[]> = {
    'coding': ['코드', 'code', 'function', 'class', 'api', 'bug', 'debug', 'typescript', 'javascript', 'python', 'react'],
    'writing': ['작성', '글쓰기', 'write', 'essay', 'article', 'blog', 'report', '보고서', '문서'],
    'translation': ['번역', 'translate', 'translation', '영어', '한국어', 'english', 'korean'],
    'analysis': ['분석', 'analyze', 'analysis', 'data', '데이터', 'chart', 'statistics'],
    'brainstorm': ['아이디어', 'idea', 'brainstorm', '브레인스토밍', 'creative', '창의'],
    'learning': ['배우', 'learn', 'study', 'explain', '설명', '교육', 'tutorial'],
    'business': ['비즈니스', 'business', 'marketing', '마케팅', 'strategy', '전략', 'plan'],
    'design': ['디자인', 'design', 'ui', 'ux', 'layout', '레이아웃', 'css', 'style'],
  }

  const allText = messages
    .map(m => m.segments.map(s => s.content || '').join(' '))
    .join(' ')
    .toLowerCase()

  const suggested: string[] = []

  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    const matchCount = keywords.filter(kw => allText.includes(kw)).length
    if (matchCount >= 2) {
      suggested.push(tag)
    }
  }

  return suggested.slice(0, 4) // max 4 tags
}

/**
 * Find similar sessions by comparing titles and content overlap
 * Returns session IDs sorted by similarity (most similar first)
 */
export function findSimilarSessions(
  currentMessages: Message[],
  allSessions: Array<{ id: string; title: string; lastMessage?: string }>,
  currentSessionId: string,
  maxResults: number = 5
): string[] {
  const currentText = currentMessages
    .map(m => m.segments.map(s => s.content || '').join(' '))
    .join(' ')
    .toLowerCase()

  // Extract keywords (words > 3 chars, appearing in current conversation)
  const words = currentText.split(/\s+/).filter(w => w.length > 3)
  const wordFreq = new Map<string, number>()
  for (const w of words) {
    wordFreq.set(w, (wordFreq.get(w) || 0) + 1)
  }

  // Top keywords by frequency
  const topKeywords = [...wordFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([w]) => w)

  // Score other sessions by keyword overlap
  const scored = allSessions
    .filter(s => s.id !== currentSessionId)
    .map(session => {
      const sessionText = `${session.title} ${session.lastMessage || ''}`.toLowerCase()
      const matchCount = topKeywords.filter(kw => sessionText.includes(kw)).length
      return { id: session.id, score: matchCount }
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, maxResults).map(s => s.id)
}

/**
 * Full conversation analysis
 */
export function analyzeConversation(
  sessionId: string,
  messages: Message[]
): ConversationAnalysis {
  return {
    sessionId,
    sentiment: analyzeSentiment(messages),
    autoTags: suggestTags(messages),
    smartTitle: generateSmartTitle(messages),
    analyzedAt: new Date().toISOString(),
  }
}
