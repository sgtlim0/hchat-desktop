import { create } from 'zustand'
import { MODELS } from '@hchat/shared'

interface SessionUsage {
  inputTokens: number
  outputTokens: number
  cost: number
}

interface ExtUsageState {
  totalTokens: number
  totalCost: number
  sessionUsage: Record<string, SessionUsage>

  trackUsage: (sessionId: string, inputTokens: number, outputTokens: number, modelId: string) => void
  getSessionCost: (sessionId: string) => number
  resetUsage: () => void
}

function calculateCost(inputTokens: number, outputTokens: number, modelId: string): number {
  const model = MODELS.find(m => m.id === modelId)
  if (!model) return 0
  return (inputTokens * model.cost.input + outputTokens * model.cost.output) / 1_000_000
}

export const useExtUsageStore = create<ExtUsageState>((set, get) => ({
  totalTokens: 0,
  totalCost: 0,
  sessionUsage: {},

  trackUsage: (sessionId, inputTokens, outputTokens, modelId) => {
    const cost = calculateCost(inputTokens, outputTokens, modelId)
    set(state => {
      const existing = state.sessionUsage[sessionId] || { inputTokens: 0, outputTokens: 0, cost: 0 }
      return {
        totalTokens: state.totalTokens + inputTokens + outputTokens,
        totalCost: state.totalCost + cost,
        sessionUsage: {
          ...state.sessionUsage,
          [sessionId]: {
            inputTokens: existing.inputTokens + inputTokens,
            outputTokens: existing.outputTokens + outputTokens,
            cost: existing.cost + cost,
          },
        },
      }
    })
  },

  getSessionCost: (sessionId) => {
    return get().sessionUsage[sessionId]?.cost ?? 0
  },

  resetUsage: () => set({ totalTokens: 0, totalCost: 0, sessionUsage: {} }),
}))
