import { describe, it, expect } from 'vitest'
import { PromptCompressor } from '../prompt-compressor'

describe('PromptCompressor', () => {
  it('does not compress short prompts', () => {
    const compressor = new PromptCompressor({ minTokensToCompress: 20 })
    const result = compressor.compress('hello world')
    expect(result.compressed).toBe('hello world')
    expect(result.savedTokens).toBe(0)
    expect(result.stages).toHaveLength(0)
  })

  it('applies stopword removal as stage 1', () => {
    const compressor = new PromptCompressor({ minTokensToCompress: 5 })
    const text = 'the quick brown fox is a very good animal that jumps over the lazy dog in the park'
    const result = compressor.compress(text)
    expect(result.stages.length).toBeGreaterThanOrEqual(2)
    expect(result.stages[0].name).toBe('stopword-removal')
    expect(result.stages[0].outputTokens).toBeLessThanOrEqual(result.stages[0].inputTokens)
  })

  it('applies entropy filtering as stage 2', () => {
    const compressor = new PromptCompressor({ minTokensToCompress: 5 })
    const text = 'Write a function to sort an array using quicksort algorithm in TypeScript with proper error handling'
    const result = compressor.compress(text)
    expect(result.stages.length).toBeGreaterThanOrEqual(2)
    expect(result.stages[1].name).toBe('entropy-filter')
  })

  it('applies sentence ranking when maxSentences is set', () => {
    const compressor = new PromptCompressor({
      minTokensToCompress: 5,
      maxSentences: 2,
    })
    const text = 'First sentence here. Second sentence with details. Third sentence with more info. Fourth closing sentence.'
    const result = compressor.compress(text)
    const hasRanking = result.stages.some((s) => s.name === 'sentence-ranking')
    expect(hasRanking).toBe(true)
  })

  it('reduces token count on lengthy prompts', () => {
    const compressor = new PromptCompressor({ minTokensToCompress: 5 })
    const text = 'Please write a very detailed and comprehensive function that implements the binary search algorithm with all the necessary error handling and edge cases covered in TypeScript'
    const result = compressor.compress(text)
    expect(result.ratio).toBeGreaterThan(0)
    expect(result.savedTokens).toBeGreaterThan(0)
  })

  it('compresses array of messages', () => {
    const compressor = new PromptCompressor({ minTokensToCompress: 5 })
    const messages = [
      { role: 'user', content: 'Please write a very detailed function for sorting an array in JavaScript with error handling' },
      { role: 'assistant', content: 'Here is the implementation of the sorting function that handles all the edge cases properly' },
    ]
    const compressed = compressor.compressMessages(messages)
    expect(compressed).toHaveLength(2)
    expect(compressed[0].role).toBe('user')
    expect(compressed[1].role).toBe('assistant')
  })

  it('preserves empty messages', () => {
    const compressor = new PromptCompressor()
    const messages = [
      { role: 'user', content: '' },
      { role: 'assistant', content: 'hello' },
    ]
    const compressed = compressor.compressMessages(messages)
    expect(compressed[0].content).toBe('')
  })

  it('handles threshold change', () => {
    const compressor = new PromptCompressor({ entropyThreshold: 0.1 })
    const text = 'the the the unique word here another unique special token added for testing compression pipeline'

    const low = compressor.compress(text)
    compressor.setEntropyThreshold(0.5)
    const high = compressor.compress(text)

    // Higher threshold should compress more aggressively
    expect(high.savedTokens).toBeGreaterThanOrEqual(low.savedTokens)
  })

  it('reports stopword ratio', () => {
    const compressor = new PromptCompressor()
    const ratio = compressor.getStopwordRatio('the quick brown fox is a very good animal')
    expect(ratio).toBeGreaterThan(0)
    expect(ratio).toBeLessThan(1)
  })

  it('handles Korean prompts', () => {
    const compressor = new PromptCompressor({ minTokensToCompress: 5 })
    const text = '리액트와 타입스크립트를 사용하여 아주 상세하고 포괄적인 정렬 함수를 작성해주세요'
    const result = compressor.compress(text)
    expect(result.compressed.length).toBeGreaterThan(0)
    expect(result.stages.length).toBeGreaterThanOrEqual(2)
  })

  it('ratio is between 0 and 1', () => {
    const compressor = new PromptCompressor({ minTokensToCompress: 5 })
    const text = 'This is a somewhat longer prompt that should trigger the compression pipeline with multiple stages of processing'
    const result = compressor.compress(text)
    expect(result.ratio).toBeGreaterThanOrEqual(0)
    expect(result.ratio).toBeLessThanOrEqual(1)
  })
})
