import { describe, it, expect } from 'vitest'
import { analyzeIntent, routeByIntent } from '../router-rules'
import type { ProviderModelDef } from '@/shared/types'

const MOCK_MODELS: ProviderModelDef[] = [
  { id: 'claude-opus-4.6', provider: 'bedrock', label: 'Opus', shortLabel: 'Opus', capabilities: ['chat', 'code', 'vision', 'reasoning'], cost: { input: 15, output: 75 } },
  { id: 'claude-sonnet-4.6', provider: 'bedrock', label: 'Sonnet', shortLabel: 'Sonnet', capabilities: ['chat', 'code', 'vision', 'reasoning'], cost: { input: 3, output: 15 } },
  { id: 'claude-haiku-4.5', provider: 'bedrock', label: 'Haiku', shortLabel: 'Haiku', capabilities: ['chat', 'code', 'fast'], cost: { input: 0.8, output: 4 } },
  { id: 'gpt-4o', provider: 'openai', label: 'GPT-4o', shortLabel: '4o', capabilities: ['chat', 'code', 'vision', 'reasoning'], cost: { input: 2.5, output: 10 } },
  { id: 'gpt-4o-mini', provider: 'openai', label: 'GPT-4o mini', shortLabel: 'mini', capabilities: ['chat', 'code', 'fast'], cost: { input: 0.15, output: 0.6 } },
]

describe('analyzeIntent', () => {
  it('detects code-generation intent', () => {
    const result = analyzeIntent('Write a function to sort an array')
    expect(result.category).toBe('code-generation')
    expect(result.confidence).toBeGreaterThan(0)
  })

  it('detects code-debug intent', () => {
    const result = analyzeIntent('이 코드에 버그가 있어. fix해줘')
    expect(result.category).toBe('code-debug')
  })

  it('detects translation intent', () => {
    const result = analyzeIntent('이 문장을 영어로 번역해줘')
    expect(result.category).toBe('translation')
  })

  it('detects summarization intent', () => {
    const result = analyzeIntent('이 글을 요약해줘. 핵심만 간단히')
    expect(result.category).toBe('summarization')
  })

  it('detects reasoning intent', () => {
    const result = analyzeIntent('왜 React가 Vue보다 인기가 많은지 비교 분석해줘')
    expect(result.category).toBe('reasoning')
  })

  it('detects math intent', () => {
    const result = analyzeIntent('Calculate 15 * 23 + 100')
    expect(result.category).toBe('math')
  })

  it('detects search intent', () => {
    const result = analyzeIntent('최신 AI 뉴스 검색해줘')
    expect(result.category).toBe('search-query')
  })

  it('detects casual-chat for greetings', () => {
    const result = analyzeIntent('안녕하세요')
    expect(result.category).toBe('casual-chat')
  })

  it('detects image-analysis intent', () => {
    const result = analyzeIntent('이 사진의 내용을 설명해줘. image analysis')
    expect(result.category).toBe('image-analysis')
  })

  it('defaults to casual-chat for ambiguous input', () => {
    const result = analyzeIntent('hmm')
    expect(result.category).toBe('casual-chat')
  })

  it('returns allScores with multiple categories', () => {
    const result = analyzeIntent('이 코드를 분석하고 버그를 fix해줘')
    expect(Object.keys(result.allScores).length).toBeGreaterThan(1)
  })
})

describe('routeByIntent', () => {
  it('routes code tasks to claude-opus', () => {
    const decision = routeByIntent('Write a React component', MOCK_MODELS)
    expect(decision.modelId).toBe('claude-opus-4.6')
    expect(decision.intent.category).toBe('code-generation')
  })

  it('routes translation to gpt-4o-mini', () => {
    const decision = routeByIntent('번역해줘 영어로', MOCK_MODELS)
    expect(decision.modelId).toBe('gpt-4o-mini')
  })

  it('routes summarization to gpt-4o-mini', () => {
    const decision = routeByIntent('간단히 요약해줘', MOCK_MODELS)
    expect(decision.modelId).toBe('gpt-4o-mini')
  })

  it('routes casual chat to haiku', () => {
    const decision = routeByIntent('안녕', MOCK_MODELS)
    expect(decision.modelId).toBe('claude-haiku-4.5')
  })

  it('respects preferCost option', () => {
    const decision = routeByIntent('Write code for me', MOCK_MODELS, { preferCost: true })
    // Should pick cheapest model with code capability
    expect(['gpt-4o-mini', 'claude-haiku-4.5']).toContain(decision.modelId)
    expect(decision.reason).toBe('cost-optimized')
  })

  it('respects preferSpeed option', () => {
    const decision = routeByIntent('분석해줘', MOCK_MODELS, { preferSpeed: true })
    expect(decision.reason).toBe('speed-optimized')
    const model = MOCK_MODELS.find((m) => m.id === decision.modelId)
    expect(model?.capabilities).toContain('fast')
  })

  it('falls back to first model when no match', () => {
    const limited = [MOCK_MODELS[0]]
    const decision = routeByIntent('unknown intent xyz', limited)
    expect(decision.modelId).toBe(limited[0].id)
  })

  it('returns estimated cost', () => {
    const decision = routeByIntent('hello', MOCK_MODELS)
    expect(decision.estimatedCost).toBeDefined()
    expect(decision.estimatedCost.input).toBeGreaterThanOrEqual(0)
  })
})
