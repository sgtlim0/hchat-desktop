import type { ProviderModelDef, ModelCapability } from '@/shared/types'

export type IntentCategory =
  | 'code-generation'
  | 'code-review'
  | 'code-debug'
  | 'creative-writing'
  | 'data-analysis'
  | 'translation'
  | 'summarization'
  | 'reasoning'
  | 'math'
  | 'search-query'
  | 'casual-chat'
  | 'document-writing'
  | 'image-analysis'
  | 'explanation'
  | 'task-planning'

interface IntentRule {
  keywords: string[]
  patterns?: RegExp[]
  weight: number
}

const INTENT_RULES: Record<IntentCategory, IntentRule> = {
  'code-generation': {
    keywords: ['코드 작성', '코드 생성', 'write code', 'create function', 'implement', '함수', 'class', 'component', 'API', 'endpoint'],
    patterns: [/(?:write|create|build|make|generate)\s+(?:a\s+)?(?:function|class|component|script|program)/i],
    weight: 1.0,
  },
  'code-review': {
    keywords: ['리뷰', 'review', 'refactor', '리팩토링', 'improve code', '코드 개선', 'optimize'],
    weight: 0.9,
  },
  'code-debug': {
    keywords: ['버그', 'bug', 'debug', 'error', 'fix', '오류', '에러', 'crash', 'not working', '안 됨', '안됨'],
    weight: 1.0,
  },
  'creative-writing': {
    keywords: ['글쓰기', '소설', '시', 'story', 'poem', 'creative', '에세이', 'essay', 'blog', '블로그'],
    weight: 0.8,
  },
  'data-analysis': {
    keywords: ['분석', 'analyze', 'data', '데이터', 'statistics', '통계', 'chart', 'graph', 'trend', 'CSV', 'Excel'],
    weight: 0.9,
  },
  translation: {
    keywords: ['번역', 'translate', 'translation', '영어로', '한국어로', 'in English', 'in Korean', '일본어'],
    patterns: [/(?:번역|translate)\s+(?:해|this|the)/i],
    weight: 1.0,
  },
  summarization: {
    keywords: ['요약', 'summarize', 'summary', 'tl;dr', '간단히', 'briefly', '핵심만', 'key points'],
    weight: 0.9,
  },
  reasoning: {
    keywords: ['왜', 'why', '이유', 'reason', '논리', 'logic', '비교', 'compare', '장단점', 'pros cons', 'tradeoff'],
    weight: 0.8,
  },
  math: {
    keywords: ['계산', 'calculate', '수학', 'math', '공식', 'formula', '방정식', 'equation', 'probability', '확률'],
    patterns: [/\d+\s*[+\-*/^]\s*\d+/, /\bsolve\b/i],
    weight: 0.9,
  },
  'search-query': {
    keywords: ['검색', 'search', '찾아', 'find', '최신', 'latest', '뉴스', 'news', '현재', 'current'],
    patterns: [/(?:what|when|where|who)\s+(?:is|are|was|were)\s+(?:the\s+)?(?:latest|current|newest)/i],
    weight: 1.0,
  },
  'casual-chat': {
    keywords: ['안녕', 'hello', 'hi', '감사', 'thanks', '잘', 'good', '어때', 'how are'],
    weight: 0.5,
  },
  'document-writing': {
    keywords: ['문서', 'document', '보고서', 'report', '기획서', 'proposal', '이메일', 'email', '편지'],
    weight: 0.8,
  },
  'image-analysis': {
    keywords: ['이미지', 'image', '사진', 'photo', '그림', 'picture', 'screenshot', '스크린샷'],
    weight: 0.9,
  },
  explanation: {
    keywords: ['설명', 'explain', '알려', 'tell me', '무엇', 'what is', '어떻게', 'how to', 'how does'],
    weight: 0.7,
  },
  'task-planning': {
    keywords: ['계획', 'plan', '로드맵', 'roadmap', '일정', 'schedule', '단계', 'steps', '전략', 'strategy'],
    weight: 0.8,
  },
}

interface ModelPreference {
  primary: string
  fallback: string
  capability: ModelCapability
}

const INTENT_MODEL_MAP: Record<IntentCategory, ModelPreference> = {
  'code-generation':  { primary: 'claude-opus-4.6', fallback: 'claude-sonnet-4.6', capability: 'code' },
  'code-review':      { primary: 'claude-sonnet-4.6', fallback: 'gpt-4o', capability: 'code' },
  'code-debug':       { primary: 'claude-opus-4.6', fallback: 'claude-sonnet-4.6', capability: 'code' },
  'creative-writing': { primary: 'claude-opus-4.6', fallback: 'gpt-4o', capability: 'chat' },
  'data-analysis':    { primary: 'gpt-4o', fallback: 'claude-sonnet-4.6', capability: 'reasoning' },
  translation:        { primary: 'gpt-4o-mini', fallback: 'gemini-2.0-flash', capability: 'chat' },
  summarization:      { primary: 'gpt-4o-mini', fallback: 'claude-haiku-4.5', capability: 'fast' },
  reasoning:          { primary: 'claude-opus-4.6', fallback: 'gpt-4o', capability: 'reasoning' },
  math:               { primary: 'claude-opus-4.6', fallback: 'gpt-4o', capability: 'reasoning' },
  'search-query':     { primary: 'gpt-4o-mini', fallback: 'claude-haiku-4.5', capability: 'fast' },
  'casual-chat':      { primary: 'claude-haiku-4.5', fallback: 'gpt-4o-mini', capability: 'fast' },
  'document-writing': { primary: 'claude-sonnet-4.6', fallback: 'gpt-4o', capability: 'chat' },
  'image-analysis':   { primary: 'gpt-4o', fallback: 'claude-sonnet-4.6', capability: 'vision' },
  explanation:        { primary: 'claude-sonnet-4.6', fallback: 'gpt-4o-mini', capability: 'chat' },
  'task-planning':    { primary: 'claude-sonnet-4.6', fallback: 'gpt-4o', capability: 'reasoning' },
}

export interface IntentAnalysis {
  category: IntentCategory
  confidence: number
  allScores: Partial<Record<IntentCategory, number>>
}

export interface RoutingDecision {
  modelId: string
  intent: IntentAnalysis
  reason: string
  estimatedCost: { input: number; output: number }
}

export function analyzeIntent(prompt: string): IntentAnalysis {
  const lower = prompt.toLowerCase()
  const scores: Partial<Record<IntentCategory, number>> = {}

  for (const [category, rule] of Object.entries(INTENT_RULES) as [IntentCategory, IntentRule][]) {
    let score = 0

    for (const keyword of rule.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        score += rule.weight
      }
    }

    if (rule.patterns) {
      for (const pattern of rule.patterns) {
        if (pattern.test(prompt)) {
          score += rule.weight * 1.5
        }
      }
    }

    if (score > 0) {
      scores[category] = score
    }
  }

  const entries = Object.entries(scores) as [IntentCategory, number][]
  entries.sort((a, b) => b[1] - a[1])

  const topCategory: IntentCategory = entries[0]?.[0] ?? 'casual-chat'
  const topScore = entries[0]?.[1] ?? 0
  const totalScore = entries.reduce((sum, [, s]) => sum + s, 0)
  const confidence = totalScore > 0 ? topScore / totalScore : 0.5

  return {
    category: topCategory,
    confidence: Math.min(confidence, 1),
    allScores: scores,
  }
}

export function routeByIntent(
  prompt: string,
  availableModels: ProviderModelDef[],
  options?: { preferCost?: boolean; preferSpeed?: boolean }
): RoutingDecision {
  const intent = analyzeIntent(prompt)
  const preference = INTENT_MODEL_MAP[intent.category]

  // Cost-first: prefer cheapest model with required capability
  if (options?.preferCost) {
    const cheapModels = [...availableModels]
      .filter((m) => m.capabilities?.includes(preference.capability))
      .sort((a, b) => a.cost.input + a.cost.output - (b.cost.input + b.cost.output))
    if (cheapModels.length > 0) {
      return buildDecision(cheapModels[0], intent, 'cost-optimized')
    }
  }

  // Speed-first: prefer fast models
  if (options?.preferSpeed) {
    const fastModel = availableModels.find(
      (m) => m.capabilities?.includes('fast')
    )
    if (fastModel) {
      return buildDecision(fastModel, intent, 'speed-optimized')
    }
  }

  // Intent-based: use preference map
  const primary = availableModels.find((m) => m.id === preference.primary)
  if (primary) {
    return buildDecision(primary, intent, 'intent-matched')
  }

  const fallback = availableModels.find((m) => m.id === preference.fallback)
  if (fallback) {
    return buildDecision(fallback, intent, 'fallback')
  }

  // Capability-based fallback
  const capModel = availableModels.find(
    (m) => m.capabilities?.includes(preference.capability)
  )
  if (capModel) {
    return buildDecision(capModel, intent, 'capability-fallback')
  }

  return buildDecision(availableModels[0], intent, 'default')
}

function buildDecision(
  model: ProviderModelDef,
  intent: IntentAnalysis,
  reason: string,
): RoutingDecision {
  return {
    modelId: model.id,
    intent,
    reason,
    estimatedCost: model.cost,
  }
}
