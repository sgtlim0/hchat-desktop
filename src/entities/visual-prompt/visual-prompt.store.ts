import { create } from 'zustand'
import type { VisualPrompt, PromptBlock, PromptBlockType } from '@/shared/types'
import { getAllVisualPrompts, putVisualPrompt, deleteVisualPromptFromDb } from '@/shared/lib/db'

interface VisualPromptState {
  prompts: VisualPrompt[]
  selectedPromptId: string | null

  hydrate: () => Promise<void>
  createPrompt: (title: string) => Promise<string>
  deletePrompt: (id: string) => Promise<void>
  addBlock: (promptId: string, type: PromptBlockType, content: string) => Promise<void>
  updateBlock: (promptId: string, blockId: string, content: string) => Promise<void>
  removeBlock: (promptId: string, blockId: string) => Promise<void>
  reorderBlocks: (promptId: string, blockIds: string[]) => Promise<void>
  generatePrompt: (promptId: string) => Promise<void>
  setSelectedPromptId: (id: string | null) => void
}

function computeQuality(blocks: PromptBlock[]): number {
  let score = 0
  const types = new Set(blocks.map((b) => b.type))
  if (types.has('instruction')) score += 30
  if (types.has('context')) score += 20
  if (types.has('constraint')) score += 15
  if (types.has('output_format')) score += 20
  if (types.has('example')) score += 15
  return Math.min(100, score)
}

function buildPromptText(blocks: PromptBlock[]): string {
  const sorted = [...blocks].sort((a, b) => a.order - b.order)
  return sorted.map((b) => {
    const label = { instruction: '## 지시사항', context: '## 컨텍스트', constraint: '## 제약조건', output_format: '## 출력 형식', example: '## 예시' }[b.type]
    return `${label}\n${b.content}`
  }).join('\n\n')
}

export const useVisualPromptStore = create<VisualPromptState>()((set, get) => ({
  prompts: [],
  selectedPromptId: null,

  hydrate: async () => {
    const prompts = await getAllVisualPrompts()
    set({ prompts })
  },

  createPrompt: async (title) => {
    const now = new Date().toISOString()
    const prompt: VisualPrompt = {
      id: crypto.randomUUID(), title, blocks: [], generatedPrompt: '',
      qualityScore: 0, createdAt: now, updatedAt: now,
    }
    await putVisualPrompt(prompt)
    set((s) => ({ prompts: [prompt, ...s.prompts], selectedPromptId: prompt.id }))
    return prompt.id
  },

  deletePrompt: async (id) => {
    await deleteVisualPromptFromDb(id)
    set((s) => ({
      prompts: s.prompts.filter((p) => p.id !== id),
      selectedPromptId: s.selectedPromptId === id ? null : s.selectedPromptId,
    }))
  },

  addBlock: async (promptId, type, content) => {
    const prompt = get().prompts.find((p) => p.id === promptId)
    if (!prompt) return
    const block: PromptBlock = { id: crypto.randomUUID(), type, content, order: prompt.blocks.length }
    const blocks = [...prompt.blocks, block]
    const updated = { ...prompt, blocks, qualityScore: computeQuality(blocks), generatedPrompt: buildPromptText(blocks), updatedAt: new Date().toISOString() }
    await putVisualPrompt(updated)
    set((s) => ({ prompts: s.prompts.map((p) => (p.id === promptId ? updated : p)) }))
  },

  updateBlock: async (promptId, blockId, content) => {
    const prompt = get().prompts.find((p) => p.id === promptId)
    if (!prompt) return
    const blocks = prompt.blocks.map((b) => (b.id === blockId ? { ...b, content } : b))
    const updated = { ...prompt, blocks, generatedPrompt: buildPromptText(blocks), updatedAt: new Date().toISOString() }
    await putVisualPrompt(updated)
    set((s) => ({ prompts: s.prompts.map((p) => (p.id === promptId ? updated : p)) }))
  },

  removeBlock: async (promptId, blockId) => {
    const prompt = get().prompts.find((p) => p.id === promptId)
    if (!prompt) return
    const blocks = prompt.blocks.filter((b) => b.id !== blockId).map((b, i) => ({ ...b, order: i }))
    const updated = { ...prompt, blocks, qualityScore: computeQuality(blocks), generatedPrompt: buildPromptText(blocks), updatedAt: new Date().toISOString() }
    await putVisualPrompt(updated)
    set((s) => ({ prompts: s.prompts.map((p) => (p.id === promptId ? updated : p)) }))
  },

  reorderBlocks: async (promptId, blockIds) => {
    const prompt = get().prompts.find((p) => p.id === promptId)
    if (!prompt) return
    const blocks = blockIds.map((id, i) => {
      const block = prompt.blocks.find((b) => b.id === id)
      return block ? { ...block, order: i } : null
    }).filter(Boolean) as PromptBlock[]
    const updated = { ...prompt, blocks, generatedPrompt: buildPromptText(blocks), updatedAt: new Date().toISOString() }
    await putVisualPrompt(updated)
    set((s) => ({ prompts: s.prompts.map((p) => (p.id === promptId ? updated : p)) }))
  },

  generatePrompt: async (promptId) => {
    const prompt = get().prompts.find((p) => p.id === promptId)
    if (!prompt) return
    const updated = { ...prompt, generatedPrompt: buildPromptText(prompt.blocks), updatedAt: new Date().toISOString() }
    await putVisualPrompt(updated)
    set((s) => ({ prompts: s.prompts.map((p) => (p.id === promptId ? updated : p)) }))
  },

  setSelectedPromptId: (selectedPromptId) => set({ selectedPromptId }),
}))
