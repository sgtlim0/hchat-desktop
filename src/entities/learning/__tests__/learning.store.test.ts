import { describe, it, expect, beforeEach } from 'vitest'
import { useLearningStore } from '../learning.store'

describe('learning.store', () => {
  beforeEach(() => {
    useLearningStore.getState().clearAll()
  })

  describe('submitFeedback', () => {
    it('adds feedback to store', () => {
      useLearningStore.getState().submitFeedback('msg-1', 'sess-1', 'claude-opus-4.6', 'good')
      expect(useLearningStore.getState().feedbacks).toHaveLength(1)
      expect(useLearningStore.getState().feedbacks[0].rating).toBe('good')
    })

    it('adds feedback with reason', () => {
      useLearningStore.getState().submitFeedback('msg-2', 'sess-1', 'gpt-4o', 'bad', 'inaccurate')
      const fb = useLearningStore.getState().feedbacks[0]
      expect(fb.reason).toBe('inaccurate')
      expect(fb.modelId).toBe('gpt-4o')
    })

    it('prepends new feedback (newest first)', () => {
      useLearningStore.getState().submitFeedback('msg-1', 'sess-1', 'claude-opus-4.6', 'good')
      useLearningStore.getState().submitFeedback('msg-2', 'sess-1', 'gpt-4o', 'bad')
      expect(useLearningStore.getState().feedbacks[0].messageId).toBe('msg-2')
    })
  })

  describe('getFeedbackForMessage', () => {
    it('returns feedback for a specific message', () => {
      useLearningStore.getState().submitFeedback('msg-1', 'sess-1', 'claude-opus-4.6', 'good')
      const fb = useLearningStore.getState().getFeedbackForMessage('msg-1')
      expect(fb).toBeDefined()
      expect(fb!.rating).toBe('good')
    })

    it('returns undefined for unknown message', () => {
      const fb = useLearningStore.getState().getFeedbackForMessage('nonexistent')
      expect(fb).toBeUndefined()
    })
  })

  describe('removeFeedback', () => {
    it('removes feedback by id', () => {
      useLearningStore.getState().submitFeedback('msg-1', 'sess-1', 'claude-opus-4.6', 'good')
      const id = useLearningStore.getState().feedbacks[0].id
      useLearningStore.getState().removeFeedback(id)
      expect(useLearningStore.getState().feedbacks).toHaveLength(0)
    })
  })

  describe('analyzePatterns', () => {
    it('returns empty for < 3 feedbacks', () => {
      useLearningStore.getState().submitFeedback('msg-1', 'sess-1', 'claude-opus-4.6', 'good')
      const patterns = useLearningStore.getState().analyzePatterns()
      expect(patterns).toHaveLength(0)
    })

    it('detects repeated patterns', () => {
      const store = useLearningStore.getState()
      store.submitFeedback('m1', 's1', 'opus', 'bad', 'too verbose')
      store.submitFeedback('m2', 's1', 'opus', 'bad', 'too verbose')
      store.submitFeedback('m3', 's1', 'opus', 'good', 'too verbose')
      const patterns = useLearningStore.getState().analyzePatterns()
      expect(patterns.length).toBeGreaterThan(0)
      const verbose = patterns.find((p) => p.pattern === 'too verbose')
      expect(verbose).toBeDefined()
      expect(verbose!.frequency).toBe(3)
    })
  })

  describe('generateSuggestions', () => {
    it('returns empty for < 5 feedbacks', () => {
      const store = useLearningStore.getState()
      store.submitFeedback('m1', 's1', 'opus', 'bad')
      const suggestions = store.generateSuggestions()
      expect(suggestions).toHaveLength(0)
    })

    it('suggests model change for low satisfaction', () => {
      const store = useLearningStore.getState()
      for (let i = 0; i < 5; i++) {
        store.submitFeedback(`m${i}`, 's1', 'bad-model', 'bad')
      }
      const suggestions = useLearningStore.getState().generateSuggestions()
      const modelSug = suggestions.find((s) => s.type === 'model')
      expect(modelSug).toBeDefined()
      expect(modelSug!.title).toContain('bad-model')
    })

    it('suggests compression for high satisfaction', () => {
      const store = useLearningStore.getState()
      for (let i = 0; i < 10; i++) {
        store.submitFeedback(`m${i}`, 's1', 'opus', 'good')
      }
      const suggestions = useLearningStore.getState().generateSuggestions()
      const costSug = suggestions.find((s) => s.type === 'setting')
      expect(costSug).toBeDefined()
      expect(costSug!.title).toContain('compression')
    })
  })

  describe('getQualityMetrics', () => {
    it('calculates metrics correctly', () => {
      const store = useLearningStore.getState()
      store.submitFeedback('m1', 's1', 'opus', 'good')
      store.submitFeedback('m2', 's1', 'opus', 'good')
      store.submitFeedback('m3', 's1', 'gpt-4o', 'bad', 'wrong answer')
      const metrics = useLearningStore.getState().getQualityMetrics()
      expect(metrics.totalFeedbacks).toBe(3)
      expect(metrics.positiveRate).toBeCloseTo(2 / 3)
      expect(metrics.topModels[0].modelId).toBe('opus')
      expect(metrics.commonIssues[0].reason).toBe('wrong answer')
    })

    it('returns zero metrics for empty feedbacks', () => {
      const metrics = useLearningStore.getState().getQualityMetrics()
      expect(metrics.totalFeedbacks).toBe(0)
      expect(metrics.positiveRate).toBe(0)
    })
  })

  describe('applySuggestion', () => {
    it('marks suggestion as applied', () => {
      const store = useLearningStore.getState()
      for (let i = 0; i < 5; i++) {
        store.submitFeedback(`m${i}`, 's1', 'bad-model', 'bad')
      }
      useLearningStore.getState().generateSuggestions()
      const suggestions = useLearningStore.getState().suggestions
      if (suggestions.length > 0) {
        useLearningStore.getState().applySuggestion(suggestions[0].id)
        expect(useLearningStore.getState().suggestions[0].applied).toBe(true)
      }
    })
  })
})
