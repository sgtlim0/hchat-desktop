import { create } from 'zustand'
import type { DataPipeline, PipelineBlock, PipelineBlockType, PipelineStatus } from '@/shared/types'
import { getAllDataPipelines, putDataPipeline, deleteDataPipelineFromDb } from '@/shared/lib/db'

interface DataPipelineState {
  pipelines: DataPipeline[]
  selectedPipelineId: string | null

  hydrate: () => Promise<void>
  createPipeline: (name: string) => Promise<string>
  deletePipeline: (id: string) => Promise<void>
  addBlock: (pipelineId: string, type: PipelineBlockType, label: string) => Promise<void>
  updateBlock: (pipelineId: string, blockId: string, config: Record<string, string>) => Promise<void>
  removeBlock: (pipelineId: string, blockId: string) => Promise<void>
  runPipeline: (id: string) => Promise<void>
  setSelectedPipelineId: (id: string | null) => void
}

export const useDataPipelineStore = create<DataPipelineState>()((set, get) => ({
  pipelines: [],
  selectedPipelineId: null,

  hydrate: async () => {
    const pipelines = await getAllDataPipelines()
    set({ pipelines })
  },

  createPipeline: async (name) => {
    const now = new Date().toISOString()
    const pipeline: DataPipeline = {
      id: crypto.randomUUID(), name, blocks: [], status: 'draft', createdAt: now, updatedAt: now,
    }
    await putDataPipeline(pipeline)
    set((s) => ({ pipelines: [pipeline, ...s.pipelines], selectedPipelineId: pipeline.id }))
    return pipeline.id
  },

  deletePipeline: async (id) => {
    await deleteDataPipelineFromDb(id)
    set((s) => ({
      pipelines: s.pipelines.filter((p) => p.id !== id),
      selectedPipelineId: s.selectedPipelineId === id ? null : s.selectedPipelineId,
    }))
  },

  addBlock: async (pipelineId, type, label) => {
    const pipeline = get().pipelines.find((p) => p.id === pipelineId)
    if (!pipeline) return
    const block: PipelineBlock = { id: crypto.randomUUID(), type, label, config: {}, order: pipeline.blocks.length }
    const updated = { ...pipeline, blocks: [...pipeline.blocks, block], updatedAt: new Date().toISOString() }
    await putDataPipeline(updated)
    set((s) => ({ pipelines: s.pipelines.map((p) => (p.id === pipelineId ? updated : p)) }))
  },

  updateBlock: async (pipelineId, blockId, config) => {
    const pipeline = get().pipelines.find((p) => p.id === pipelineId)
    if (!pipeline) return
    const blocks = pipeline.blocks.map((b) => (b.id === blockId ? { ...b, config } : b))
    const updated = { ...pipeline, blocks, updatedAt: new Date().toISOString() }
    await putDataPipeline(updated)
    set((s) => ({ pipelines: s.pipelines.map((p) => (p.id === pipelineId ? updated : p)) }))
  },

  removeBlock: async (pipelineId, blockId) => {
    const pipeline = get().pipelines.find((p) => p.id === pipelineId)
    if (!pipeline) return
    const blocks = pipeline.blocks.filter((b) => b.id !== blockId).map((b, i) => ({ ...b, order: i }))
    const updated = { ...pipeline, blocks, updatedAt: new Date().toISOString() }
    await putDataPipeline(updated)
    set((s) => ({ pipelines: s.pipelines.map((p) => (p.id === pipelineId ? updated : p)) }))
  },

  runPipeline: async (id) => {
    const pipeline = get().pipelines.find((p) => p.id === id)
    if (!pipeline) return
    const running = { ...pipeline, status: 'running' as PipelineStatus, updatedAt: new Date().toISOString() }
    await putDataPipeline(running)
    set((s) => ({ pipelines: s.pipelines.map((p) => (p.id === id ? running : p)) }))
    // Simulate completion
    setTimeout(async () => {
      const completed = { ...running, status: 'completed' as PipelineStatus, lastRun: new Date().toISOString(), updatedAt: new Date().toISOString() }
      await putDataPipeline(completed)
      set((s) => ({ pipelines: s.pipelines.map((p) => (p.id === id ? completed : p)) }))
    }, 1000)
  },

  setSelectedPipelineId: (selectedPipelineId) => set({ selectedPipelineId }),
}))
