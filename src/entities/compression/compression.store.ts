import { create } from 'zustand'
import { PromptCompressor, type CompressorOptions } from '@/shared/lib/compression/prompt-compressor'
import { EntropyEncoder } from '@/shared/lib/compression/entropy-encoder'
import { pruneContext, type PruneOptions } from '@/shared/lib/compression/context-pruner'

export interface CompressionStats {
  totalCompressed: number
  totalSavedTokens: number
  totalSavedCost: number
  averageRatio: number
}

interface CompressionState {
  enabled: boolean
  threshold: number
  contextPruningEnabled: boolean
  maxContextTokens: number
  stats: CompressionStats

  setEnabled: (enabled: boolean) => void
  setThreshold: (threshold: number) => void
  setContextPruningEnabled: (enabled: boolean) => void
  setMaxContextTokens: (maxTokens: number) => void
  recordCompression: (savedTokens: number, costPerToken: number) => void
  resetStats: () => void

  compressPrompt: (prompt: string) => { compressed: string; savedTokens: number }
  compressMessages: (
    messages: Array<{ role: string; content: string }>,
  ) => Array<{ role: string; content: string }>
  pruneMessages: (
    messages: Array<{ role: string; content: string }>,
    overrideOptions?: Partial<PruneOptions>,
  ) => Array<{ role: string; content: string }>
}

const INITIAL_STATS: CompressionStats = {
  totalCompressed: 0,
  totalSavedTokens: 0,
  totalSavedCost: 0,
  averageRatio: 0,
}

export const useCompressionStore = create<CompressionState>((set, get) => {
  let compressor = new PromptCompressor({ entropyThreshold: 0.3 })

  return {
    enabled: false,
    threshold: 0.3,
    contextPruningEnabled: false,
    maxContextTokens: 8000,
    stats: { ...INITIAL_STATS },

    setEnabled: (enabled) => set({ enabled }),

    setThreshold: (threshold) => {
      compressor = new PromptCompressor({ entropyThreshold: threshold })
      set({ threshold })
    },

    setContextPruningEnabled: (contextPruningEnabled) => set({ contextPruningEnabled }),
    setMaxContextTokens: (maxContextTokens) => set({ maxContextTokens }),

    recordCompression: (savedTokens, costPerToken) => {
      set((state) => {
        const newTotal = state.stats.totalCompressed + 1
        const newSavedTokens = state.stats.totalSavedTokens + savedTokens
        const newSavedCost = state.stats.totalSavedCost + savedTokens * costPerToken
        return {
          stats: {
            totalCompressed: newTotal,
            totalSavedTokens: newSavedTokens,
            totalSavedCost: newSavedCost,
            averageRatio:
              newTotal > 0
                ? (state.stats.averageRatio * (newTotal - 1) + (savedTokens > 0 ? 1 : 0)) / newTotal
                : 0,
          },
        }
      })
    },

    resetStats: () => set({ stats: { ...INITIAL_STATS } }),

    compressPrompt: (prompt) => {
      if (!get().enabled) return { compressed: prompt, savedTokens: 0 }
      const result = compressor.compress(prompt)
      return { compressed: result.compressed, savedTokens: result.savedTokens }
    },

    compressMessages: (messages) => {
      if (!get().enabled) return messages
      return compressor.compressMessages(messages)
    },

    pruneMessages: (messages, overrideOptions) => {
      if (!get().contextPruningEnabled) return messages
      const result = pruneContext(messages, {
        maxTokens: get().maxContextTokens,
        ...overrideOptions,
      })
      return result.messages
    },
  }
})
