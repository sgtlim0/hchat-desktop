import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useBatchStore } from '../batch.store'
import type { BatchJob } from '@/shared/types'

// Mock the db module
vi.mock('@/shared/lib/db', () => ({
  getAllBatchJobs: vi.fn(() => Promise.resolve([])),
  putBatchJob: vi.fn(() => Promise.resolve()),
  deleteBatchJobFromDb: vi.fn(() => Promise.resolve()),
}))

// Mock crypto.randomUUID — preserve other crypto methods
const _originalCrypto = globalThis.crypto
vi.stubGlobal('crypto', {
  ..._originalCrypto,
  randomUUID: vi.fn(() => `uuid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
})

describe('BatchStore', () => {
  beforeEach(() => {
    useBatchStore.setState({
      jobs: [],
      selectedJobId: null,
    })
  })

  it('should add a new batch job', () => {
    const { addJob } = useBatchStore.getState()

    addJob(
      'Translate Documents',
      'translate',
      'high',
      'claude-3-5-sonnet',
      ['Document 1', 'Document 2', 'Document 3']
    )

    const jobs = useBatchStore.getState().jobs
    expect(jobs).toHaveLength(1)
    expect(jobs[0].title).toBe('Translate Documents')
    expect(jobs[0].type).toBe('translate')
    expect(jobs[0].priority).toBe('high')
    expect(jobs[0].modelId).toBe('claude-3-5-sonnet')
    expect(jobs[0].items).toHaveLength(3)
    expect(jobs[0].status).toBe('queued')
    expect(jobs[0].progress).toBe(0)
  })

  it('should delete a batch job', () => {
    const { addJob, deleteJob, selectJob } = useBatchStore.getState()

    // Add two jobs
    addJob('Job 1', 'translate', 'normal', 'model-1', ['Input 1'])
    addJob('Job 2', 'analyze', 'high', 'model-2', ['Input 2'])

    const jobs = useBatchStore.getState().jobs
    const jobToDelete = jobs[0].id
    const jobToKeep = jobs[1].id

    // Select the job to delete
    selectJob(jobToDelete)

    deleteJob(jobToDelete)

    const remainingJobs = useBatchStore.getState().jobs
    expect(remainingJobs).toHaveLength(1)
    expect(remainingJobs[0].id).toBe(jobToKeep)
    expect(useBatchStore.getState().selectedJobId).toBeNull()
  })

  it('should pause and resume a job', () => {
    const { addJob, pauseJob, resumeJob } = useBatchStore.getState()

    addJob('Test Job', 'translate', 'normal', 'model-1', ['Input'])

    const jobId = useBatchStore.getState().jobs[0].id

    // Pause the job
    pauseJob(jobId)
    expect(useBatchStore.getState().jobs[0].status).toBe('paused')

    // Resume the job
    resumeJob(jobId)
    expect(useBatchStore.getState().jobs[0].status).toBe('queued')
  })

  it('should cancel a job', () => {
    const { addJob, cancelJob } = useBatchStore.getState()

    addJob('Test Job', 'translate', 'normal', 'model-1', ['Input'])

    const jobId = useBatchStore.getState().jobs[0].id

    cancelJob(jobId)

    expect(useBatchStore.getState().jobs[0].status).toBe('error')
  })

  it('should update job progress', () => {
    const { addJob, updateJobProgress } = useBatchStore.getState()

    addJob('Test Job', 'translate', 'normal', 'model-1', ['Input 1', 'Input 2', 'Input 3'])

    const jobId = useBatchStore.getState().jobs[0].id

    // Update progress for first item
    updateJobProgress(jobId, 33, 0, 'Output 1')

    let job = useBatchStore.getState().jobs[0]
    expect(job.progress).toBe(33)
    expect(job.items[0].output).toBe('Output 1')
    expect(job.items[0].status).toBe('done')

    // Complete the job
    updateJobProgress(jobId, 100, 2, 'Output 3')

    job = useBatchStore.getState().jobs[0]
    expect(job.progress).toBe(100)
    expect(job.status).toBe('done')
    expect(job.completedAt).toBeDefined()
  })

  it('should get queued jobs', () => {
    const { addJob, pauseJob, getQueuedJobs } = useBatchStore.getState()

    // Add jobs with different statuses
    addJob('Job 1', 'translate', 'normal', 'model-1', ['Input 1'])
    addJob('Job 2', 'analyze', 'high', 'model-2', ['Input 2'])
    addJob('Job 3', 'summarize', 'low', 'model-3', ['Input 3'])

    const jobs = useBatchStore.getState().jobs

    // Pause one job
    pauseJob(jobs[1].id)

    const queuedJobs = getQueuedJobs()
    expect(queuedJobs).toHaveLength(2)
    expect(queuedJobs.every(j => j.status === 'queued')).toBe(true)
  })

  it('should get running jobs', () => {
    const { addJob, getRunningJobs } = useBatchStore.getState()

    // Add jobs
    addJob('Job 1', 'translate', 'normal', 'model-1', ['Input 1'])
    addJob('Job 2', 'analyze', 'high', 'model-2', ['Input 2'])

    // Manually set one job to running
    useBatchStore.setState((state) => ({
      jobs: state.jobs.map((j, idx) =>
        idx === 0 ? { ...j, status: 'running' as const } : j
      ),
    }))

    const runningJobs = getRunningJobs()
    expect(runningJobs).toHaveLength(1)
    expect(runningJobs[0].status).toBe('running')
  })

  it('should select and deselect a job', () => {
    const { addJob, selectJob } = useBatchStore.getState()

    addJob('Test Job', 'translate', 'normal', 'model-1', ['Input'])

    const jobId = useBatchStore.getState().jobs[0].id

    // Select the job
    selectJob(jobId)
    expect(useBatchStore.getState().selectedJobId).toBe(jobId)

    // Deselect the job
    selectJob(null)
    expect(useBatchStore.getState().selectedJobId).toBeNull()
  })

  it('should hydrate jobs from database', async () => {
    const { hydrate } = useBatchStore.getState()

    const mockJobs: BatchJob[] = [
      {
        id: 'job-1',
        title: 'Existing Job',
        type: 'translate',
        priority: 'normal',
        status: 'done',
        progress: 100,
        items: [],
        modelId: 'model-1',
        createdAt: '2026-01-01T00:00:00Z',
        completedAt: '2026-01-01T01:00:00Z',
      },
    ]

    const { getAllBatchJobs } = await import('@/shared/lib/db')
    vi.mocked(getAllBatchJobs).mockResolvedValueOnce(mockJobs)

    hydrate()

    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(useBatchStore.getState().jobs).toEqual(mockJobs)
  })

  it('should handle job with different priorities', () => {
    const { addJob } = useBatchStore.getState()

    addJob('High Priority', 'translate', 'high', 'model-1', ['Input'])
    addJob('Normal Priority', 'analyze', 'normal', 'model-2', ['Input'])
    addJob('Low Priority', 'summarize', 'low', 'model-3', ['Input'])

    const jobs = useBatchStore.getState().jobs
    expect(jobs[0].priority).toBe('low')
    expect(jobs[1].priority).toBe('normal')
    expect(jobs[2].priority).toBe('high')
  })
})