import { create } from 'zustand'

interface UsageRecord {
  readonly modelId: string
  readonly inputTokens: number
  readonly outputTokens: number
  readonly cost: number
  readonly timestamp: number
}

interface ExtUsageState {
  records: UsageRecord[]
  addUsage: (record: { modelId: string; inputTokens: number; outputTokens: number }) => void
  getTotalCost: () => number
  clearAll: () => void
}

const STORAGE_KEY = 'hchat-ext-usage'

function calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  // Cost per 1M tokens (USD)
  const costs: Record<string, { input: number; output: number }> = {
    'claude-opus-4.6': { input: 15, output: 75 },
    'claude-sonnet-4.6': { input: 3, output: 15 },
    'claude-haiku-4.5': { input: 0.8, output: 4 },
    'gpt-4o': { input: 2.5, output: 10 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    'gemini-2.0-flash': { input: 0.1, output: 0.4 },
    'gemini-1.5-pro': { input: 1.25, output: 5 },
  }
  const rate = costs[modelId] ?? { input: 3, output: 15 }
  return (inputTokens * rate.input + outputTokens * rate.output) / 1_000_000
}

function persistRecords(records: UsageRecord[]): void {
  chrome.storage.local.set({ [STORAGE_KEY]: records }).catch(console.error)
}

export const useExtUsageStore = create<ExtUsageState>((set, get) => ({
  records: [],

  addUsage: ({ modelId, inputTokens, outputTokens }) => {
    const cost = calculateCost(modelId, inputTokens, outputTokens)
    const record: UsageRecord = {
      modelId,
      inputTokens,
      outputTokens,
      cost,
      timestamp: Date.now(),
    }
    set((state) => {
      const updated = [...state.records, record]
      persistRecords(updated)
      return { records: updated }
    })
  },

  getTotalCost: () => {
    return get().records.reduce((sum, r) => sum + r.cost, 0)
  },

  clearAll: () => {
    set({ records: [] })
    persistRecords([])
  },
}))

// Load records from chrome.storage on init
chrome.storage.local.get(STORAGE_KEY).then((result) => {
  const stored = result[STORAGE_KEY]
  if (Array.isArray(stored)) {
    useExtUsageStore.setState({ records: stored })
  }
}).catch(console.error)
