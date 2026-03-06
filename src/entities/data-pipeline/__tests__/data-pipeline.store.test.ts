import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDataPipelineStore } from '../data-pipeline.store'

vi.mock('@/shared/lib/db', () => ({
  getAllDataPipelines: vi.fn().mockResolvedValue([]),
  putDataPipeline: vi.fn().mockResolvedValue(undefined),
  deleteDataPipelineFromDb: vi.fn().mockResolvedValue(undefined),
}))

describe('DataPipelineStore', () => {
  beforeEach(() => { useDataPipelineStore.setState({ pipelines: [], selectedPipelineId: null }) })

  it('should have empty initial state', () => {
    expect(useDataPipelineStore.getState().pipelines).toEqual([])
  })

  it('should create a pipeline', async () => {
    const id = await useDataPipelineStore.getState().createPipeline('ETL Job')
    expect(id).toBeTruthy()
    expect(useDataPipelineStore.getState().pipelines[0].name).toBe('ETL Job')
    expect(useDataPipelineStore.getState().pipelines[0].status).toBe('draft')
  })

  it('should add blocks', async () => {
    const pid = await useDataPipelineStore.getState().createPipeline('Test')
    await useDataPipelineStore.getState().addBlock(pid, 'source', 'CSV Input')
    await useDataPipelineStore.getState().addBlock(pid, 'filter', 'Remove nulls')
    expect(useDataPipelineStore.getState().pipelines[0].blocks).toHaveLength(2)
    expect(useDataPipelineStore.getState().pipelines[0].blocks[1].order).toBe(1)
  })

  it('should update block config', async () => {
    const pid = await useDataPipelineStore.getState().createPipeline('Test')
    await useDataPipelineStore.getState().addBlock(pid, 'source', 'API')
    const blockId = useDataPipelineStore.getState().pipelines[0].blocks[0].id
    await useDataPipelineStore.getState().updateBlock(pid, blockId, { url: 'https://api.example.com' })
    expect(useDataPipelineStore.getState().pipelines[0].blocks[0].config.url).toBe('https://api.example.com')
  })

  it('should remove a block and reorder', async () => {
    const pid = await useDataPipelineStore.getState().createPipeline('Test')
    await useDataPipelineStore.getState().addBlock(pid, 'source', 'A')
    await useDataPipelineStore.getState().addBlock(pid, 'filter', 'B')
    await useDataPipelineStore.getState().addBlock(pid, 'output', 'C')
    const blockId = useDataPipelineStore.getState().pipelines[0].blocks[0].id
    await useDataPipelineStore.getState().removeBlock(pid, blockId)
    const blocks = useDataPipelineStore.getState().pipelines[0].blocks
    expect(blocks).toHaveLength(2)
    expect(blocks[0].order).toBe(0)
    expect(blocks[1].order).toBe(1)
  })

  it('should run pipeline (simulate)', async () => {
    vi.useFakeTimers()
    const pid = await useDataPipelineStore.getState().createPipeline('Test')
    await useDataPipelineStore.getState().runPipeline(pid)
    expect(useDataPipelineStore.getState().pipelines[0].status).toBe('running')
    await vi.advanceTimersByTimeAsync(1100)
    expect(useDataPipelineStore.getState().pipelines[0].status).toBe('completed')
    expect(useDataPipelineStore.getState().pipelines[0].lastRun).toBeTruthy()
    vi.useRealTimers()
  })

  it('should delete a pipeline', async () => {
    const pid = await useDataPipelineStore.getState().createPipeline('Test')
    await useDataPipelineStore.getState().deletePipeline(pid)
    expect(useDataPipelineStore.getState().pipelines).toHaveLength(0)
  })
})
