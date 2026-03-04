import { create } from 'zustand'
import type { BatchJob, BatchJobItem, BatchPriority, BatchJobStatus } from '@/shared/types'
import { getAllBatchJobs, putBatchJob, deleteBatchJobFromDb } from '@/shared/lib/db'

interface BatchState {
  jobs: BatchJob[]
  selectedJobId: string | null

  hydrate: () => void
  addJob: (title: string, type: BatchJob['type'], priority: BatchPriority, modelId: string, inputs: string[]) => void
  deleteJob: (id: string) => void
  selectJob: (id: string | null) => void
  pauseJob: (id: string) => void
  resumeJob: (id: string) => void
  cancelJob: (id: string) => void
  updateJobProgress: (id: string, progress: number, itemIndex?: number, output?: string) => void
  getQueuedJobs: () => BatchJob[]
  getRunningJobs: () => BatchJob[]
}

export const useBatchStore = create<BatchState>((set, get) => ({
  jobs: [],
  selectedJobId: null,

  hydrate: () => {
    getAllBatchJobs()
      .then((jobs) => set({ jobs }))
      .catch(console.error)
  },

  addJob: (title, type, priority, modelId, inputs) => {
    const job: BatchJob = {
      id: crypto.randomUUID(),
      title,
      type,
      priority,
      status: 'queued',
      progress: 0,
      items: inputs.map((input) => ({
        id: crypto.randomUUID(),
        input,
        status: 'pending',
      })),
      modelId,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      jobs: [job, ...state.jobs],
    }))

    putBatchJob(job).catch(console.error)
  },

  deleteJob: (id) => {
    set((state) => ({
      jobs: state.jobs.filter((j) => j.id !== id),
      selectedJobId: state.selectedJobId === id ? null : state.selectedJobId,
    }))

    deleteBatchJobFromDb(id).catch(console.error)
  },

  selectJob: (id) => {
    set({ selectedJobId: id })
  },

  pauseJob: (id) => {
    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === id
          ? { ...j, status: 'paused' as BatchJobStatus }
          : j
      ),
    }))

    const job = get().jobs.find((j) => j.id === id)
    if (job) putBatchJob({ ...job, status: 'paused' }).catch(console.error)
  },

  resumeJob: (id) => {
    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === id
          ? { ...j, status: 'queued' as BatchJobStatus }
          : j
      ),
    }))

    const job = get().jobs.find((j) => j.id === id)
    if (job) putBatchJob({ ...job, status: 'queued' }).catch(console.error)
  },

  cancelJob: (id) => {
    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === id
          ? { ...j, status: 'error' as BatchJobStatus }
          : j
      ),
    }))

    const job = get().jobs.find((j) => j.id === id)
    if (job) putBatchJob({ ...job, status: 'error' }).catch(console.error)
  },

  updateJobProgress: (id, progress, itemIndex, output) => {
    set((state) => ({
      jobs: state.jobs.map((j) => {
        if (j.id !== id) return j

        let updatedItems = [...j.items]
        if (itemIndex !== undefined && output) {
          updatedItems = updatedItems.map((item, idx) =>
            idx === itemIndex
              ? { ...item, output, status: 'done' as BatchJobItem['status'] }
              : item
          )
        }

        const newJob = {
          ...j,
          progress,
          items: updatedItems,
          status: progress >= 100 ? ('done' as BatchJobStatus) : j.status,
          completedAt: progress >= 100 ? new Date().toISOString() : j.completedAt,
        }

        putBatchJob(newJob).catch(console.error)
        return newJob
      }),
    }))
  },

  getQueuedJobs: () => {
    return get().jobs.filter((j) => j.status === 'queued')
  },

  getRunningJobs: () => {
    return get().jobs.filter((j) => j.status === 'running')
  },
}))
