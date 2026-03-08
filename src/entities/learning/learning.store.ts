import { create } from 'zustand'

export type FeedbackRating = 'good' | 'bad'

export interface Feedback {
  id: string
  messageId: string
  sessionId: string
  modelId: string
  rating: FeedbackRating
  reason?: string
  createdAt: string
}

export interface PromptPattern {
  id: string
  pattern: string
  frequency: number
  avgRating: number
  suggestion: string
}

export interface Suggestion {
  id: string
  type: 'model' | 'prompt' | 'setting'
  title: string
  description: string
  confidence: number
  applied: boolean
  createdAt: string
}

export interface QualityMetrics {
  totalFeedbacks: number
  positiveRate: number
  topModels: Array<{ modelId: string; avgRating: number; count: number }>
  commonIssues: Array<{ reason: string; count: number }>
}

interface LearningState {
  feedbacks: Feedback[]
  patterns: PromptPattern[]
  suggestions: Suggestion[]

  submitFeedback: (
    messageId: string,
    sessionId: string,
    modelId: string,
    rating: FeedbackRating,
    reason?: string,
  ) => void
  removeFeedback: (id: string) => void
  getFeedbackForMessage: (messageId: string) => Feedback | undefined
  analyzePatterns: () => PromptPattern[]
  generateSuggestions: () => Suggestion[]
  getQualityMetrics: () => QualityMetrics
  applySuggestion: (id: string) => void
  clearAll: () => void
}

export const useLearningStore = create<LearningState>((set, get) => ({
  feedbacks: [],
  patterns: [],
  suggestions: [],

  submitFeedback: (messageId, sessionId, modelId, rating, reason) => {
    const feedback: Feedback = {
      id: `fb-${Date.now()}`,
      messageId,
      sessionId,
      modelId,
      rating,
      reason,
      createdAt: new Date().toISOString(),
    }
    set((state) => ({
      feedbacks: [feedback, ...state.feedbacks],
    }))
  },

  removeFeedback: (id) => {
    set((state) => ({
      feedbacks: state.feedbacks.filter((f) => f.id !== id),
    }))
  },

  getFeedbackForMessage: (messageId) => {
    return get().feedbacks.find((f) => f.messageId === messageId)
  },

  analyzePatterns: () => {
    const { feedbacks } = get()
    if (feedbacks.length < 3) return []

    // Group by reason and calculate frequency
    const reasonMap = new Map<string, { good: number; bad: number }>()
    for (const fb of feedbacks) {
      const key = fb.reason || (fb.rating === 'bad' ? 'unspecified-issue' : 'general-positive')
      const entry = reasonMap.get(key) ?? { good: 0, bad: 0 }
      if (fb.rating === 'good') entry.good++
      else entry.bad++
      reasonMap.set(key, entry)
    }

    const patterns: PromptPattern[] = []
    for (const [reason, counts] of reasonMap) {
      const total = counts.good + counts.bad
      if (total < 2) continue
      const avgRating = counts.good / total

      let suggestion = ''
      if (avgRating < 0.4) {
        suggestion = 'Consider switching to a more capable model for this type of query'
      } else if (avgRating < 0.6) {
        suggestion = 'Try adding more context or specificity to your prompts'
      } else {
        suggestion = 'This pattern works well — consider saving as a template'
      }

      patterns.push({
        id: `pat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        pattern: reason,
        frequency: total,
        avgRating,
        suggestion,
      })
    }

    patterns.sort((a, b) => b.frequency - a.frequency)
    set({ patterns })
    return patterns
  },

  generateSuggestions: () => {
    const { feedbacks } = get()
    if (feedbacks.length < 5) return []

    const suggestions: Suggestion[] = []

    // Model performance analysis
    const modelStats = new Map<string, { good: number; total: number }>()
    for (const fb of feedbacks) {
      const entry = modelStats.get(fb.modelId) ?? { good: 0, total: 0 }
      entry.total++
      if (fb.rating === 'good') entry.good++
      modelStats.set(fb.modelId, entry)
    }

    for (const [modelId, stats] of modelStats) {
      const rate = stats.good / stats.total
      if (rate < 0.4 && stats.total >= 3) {
        suggestions.push({
          id: `sug-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'model',
          title: `${modelId} has low satisfaction (${Math.round(rate * 100)}%)`,
          description: `Based on ${stats.total} feedbacks, this model shows ${Math.round(rate * 100)}% positive rate. Consider using a different model for similar tasks.`,
          confidence: Math.min(stats.total / 10, 1),
          applied: false,
          createdAt: new Date().toISOString(),
        })
      }
    }

    // Negative feedback streak detection
    const recent = feedbacks.slice(0, 10)
    const negativeStreak = recent.filter((f) => f.rating === 'bad').length
    if (negativeStreak >= 5) {
      suggestions.push({
        id: `sug-${Date.now()}-streak`,
        type: 'prompt',
        title: 'High negative feedback rate detected',
        description: `${negativeStreak} of last 10 responses received negative feedback. Consider: (1) Adding a system prompt, (2) Providing more context, (3) Trying a different model.`,
        confidence: 0.8,
        applied: false,
        createdAt: new Date().toISOString(),
      })
    }

    // Cost optimization suggestion
    const totalFeedbacks = feedbacks.length
    const positiveRate = feedbacks.filter((f) => f.rating === 'good').length / totalFeedbacks
    if (positiveRate > 0.8) {
      suggestions.push({
        id: `sug-${Date.now()}-cost`,
        type: 'setting',
        title: 'Enable prompt compression to save costs',
        description: `Your satisfaction rate is ${Math.round(positiveRate * 100)}%. With high quality responses, enabling prompt compression could reduce API costs by 30-50% without affecting quality.`,
        confidence: 0.7,
        applied: false,
        createdAt: new Date().toISOString(),
      })
    }

    set({ suggestions })
    return suggestions
  },

  getQualityMetrics: () => {
    const { feedbacks } = get()
    const total = feedbacks.length
    const positive = feedbacks.filter((f) => f.rating === 'good').length

    // Model rankings
    const modelMap = new Map<string, { good: number; total: number }>()
    for (const fb of feedbacks) {
      const entry = modelMap.get(fb.modelId) ?? { good: 0, total: 0 }
      entry.total++
      if (fb.rating === 'good') entry.good++
      modelMap.set(fb.modelId, entry)
    }

    const topModels = Array.from(modelMap.entries())
      .map(([modelId, stats]) => ({
        modelId,
        avgRating: stats.good / stats.total,
        count: stats.total,
      }))
      .sort((a, b) => b.avgRating - a.avgRating)

    // Common issues
    const issueMap = new Map<string, number>()
    for (const fb of feedbacks) {
      if (fb.rating === 'bad' && fb.reason) {
        issueMap.set(fb.reason, (issueMap.get(fb.reason) ?? 0) + 1)
      }
    }
    const commonIssues = Array.from(issueMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      totalFeedbacks: total,
      positiveRate: total > 0 ? positive / total : 0,
      topModels,
      commonIssues,
    }
  },

  applySuggestion: (id) => {
    set((state) => ({
      suggestions: state.suggestions.map((s) =>
        s.id === id ? { ...s, applied: true } : s,
      ),
    }))
  },

  clearAll: () => set({ feedbacks: [], patterns: [], suggestions: [] }),
}))
