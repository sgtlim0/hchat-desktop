import { create } from 'zustand'
import type { AiModel, ModelBenchmark } from '@/shared/types'
const DEFAULT_MODELS: AiModel[] = [
  { id: 'claude-sonnet', name: 'Claude Sonnet 4.6', provider: 'Anthropic', category: 'chat', speed: 85, quality: 95, costPer1k: 3 },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', category: 'chat', speed: 80, quality: 90, costPer1k: 5 },
  { id: 'gemini-pro', name: 'Gemini 2.0 Pro', provider: 'Google', category: 'chat', speed: 90, quality: 85, costPer1k: 1 },
]
interface ApiMarketplaceState { models: AiModel[]; benchmarks: Record<string, ModelBenchmark>; selectedModelId: string | null; addModel: (model: AiModel) => void; removeModel: (id: string) => void; setBenchmark: (modelId: string, benchmark: ModelBenchmark) => void; selectModel: (id: string | null) => void }
export const useApiMarketplaceStore = create<ApiMarketplaceState>((set) => ({
  models: DEFAULT_MODELS, benchmarks: {}, selectedModelId: null,
  addModel: (model) => set((s) => ({ models: [...s.models, model] })),
  removeModel: (id) => set((s) => ({ models: s.models.filter((m) => m.id !== id), selectedModelId: s.selectedModelId === id ? null : s.selectedModelId })),
  setBenchmark: (modelId, benchmark) => set((s) => ({ benchmarks: { ...s.benchmarks, [modelId]: benchmark } })),
  selectModel: (id) => set({ selectedModelId: id }),
}))
