import { useState } from 'react'
import { X, ListTodo, Plus, Pause, Play, XCircle, Trash2 } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useBatchStore } from '@/entities/batch/batch.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'
import type { BatchJob, BatchPriority } from '@/shared/types'

export function BatchQueuePage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const { jobs, selectedJobId, selectJob, pauseJob, resumeJob, cancelJob, deleteJob } = useBatchStore()
  const [showModal, setShowModal] = useState(false)

  const selectedJob = jobs.find((j) => j.id === selectedJobId)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b dark:border-zinc-700">
        <button
          onClick={() => setView('home')}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          aria-label={t('common.close')}
        >
          <X className="w-5 h-5" />
        </button>
        <ListTodo className="w-5 h-5" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{t('batch.title')}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('batch.subtitle')}</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="text-sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          {t('batch.newJob')}
        </Button>
      </header>

      <div className="flex-1 overflow-auto">
        {jobs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <ListTodo className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
              <p className="text-zinc-500 dark:text-zinc-400">{t('batch.noJobs')}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isSelected={job.id === selectedJobId}
                onSelect={() => selectJob(job.id)}
                onPause={() => pauseJob(job.id)}
                onResume={() => resumeJob(job.id)}
                onCancel={() => cancelJob(job.id)}
                onDelete={() => {
                  if (confirm(t('batch.deleteConfirm'))) {
                    deleteJob(job.id)
                  }
                }}
              />
            ))}
          </div>
        )}

        {selectedJob && (
          <div className="border-t dark:border-zinc-700 p-4">
            <h3 className="font-semibold mb-3">
              {t('batch.items').replace('{count}', String(selectedJob.items.length))}
            </h3>
            <div className="space-y-2">
              {selectedJob.items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 border dark:border-zinc-700 rounded text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-zinc-500">#{idx + 1}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-2">
                    {item.input}
                  </div>
                  {item.output && (
                    <div className="text-xs bg-zinc-50 dark:bg-zinc-800 p-2 rounded">
                      {item.output}
                    </div>
                  )}
                  {item.error && (
                    <div className="text-xs text-red-600 dark:text-red-400">{item.error}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && <NewJobModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

interface JobCardProps {
  job: BatchJob
  isSelected: boolean
  onSelect: () => void
  onPause: () => void
  onResume: () => void
  onCancel: () => void
  onDelete: () => void
}

function JobCard({ job, isSelected, onSelect, onPause, onResume, onCancel, onDelete }: JobCardProps) {
  const { t } = useTranslation()

  return (
    <div
      className={`border dark:border-zinc-700 rounded-lg p-4 cursor-pointer transition ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{job.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <TypeBadge type={job.type} />
            <PriorityBadge priority={job.priority} />
            <StatusBadge status={job.status} />
          </div>
        </div>
        <div className="flex gap-1">
          {job.status === 'running' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPause()
              }}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
              title={t('batch.pause')}
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          {job.status === 'paused' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onResume()
              }}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
              title={t('batch.resume')}
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          {(job.status === 'queued' || job.status === 'running') && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCancel()
              }}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-red-600"
              title={t('batch.cancel')}
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
            title={t('common.delete')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded overflow-hidden mb-2">
        <div
          className="absolute left-0 top-0 h-full bg-blue-500 transition-all"
          style={{ width: `${job.progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          {t('batch.progress').replace('{percent}', String(job.progress))}
        </span>
        <span>
          {t('batch.items').replace('{count}', String(job.items.length))}
        </span>
      </div>
    </div>
  )
}

function TypeBadge({ type }: { type: BatchJob['type'] }) {
  const { t } = useTranslation()
  return (
    <span className="px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
      {t(`batch.type.${type}`)}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: BatchPriority }) {
  const { t } = useTranslation()
  const colors = {
    high: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    normal: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    low: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  }
  return (
    <span className={`px-2 py-0.5 text-xs rounded ${colors[priority]}`}>
      {t(`batch.priority.${priority}`)}
    </span>
  )
}

function StatusBadge({ status }: { status: BatchJob['status'] | 'pending' | 'processing' | 'done' | 'error' }) {
  const { t } = useTranslation()
  const colors = {
    queued: 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300',
    running: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    done: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    error: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    paused: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
    pending: 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300',
    processing: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  }
  const key = `batch.status.${status}` as const
  return (
    <span className={`px-2 py-0.5 text-xs rounded ${colors[status]}`}>
      {t(key as any)}
    </span>
  )
}

function NewJobModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const addJob = useBatchStore((s) => s.addJob)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<BatchJob['type']>('translate')
  const [priority, setPriority] = useState<BatchPriority>('normal')
  const [modelId, setModelId] = useState('claude-3-5-sonnet-v2')
  const [inputs, setInputs] = useState('')

  function handleCreate() {
    if (!title.trim() || !inputs.trim()) return
    const inputLines = inputs.split('\n').filter((line) => line.trim())
    addJob(title, type, priority, modelId, inputLines)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('batch.newJob')}</h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('batch.jobTitle')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
              placeholder={t('batch.jobTitle')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('batch.type')}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as BatchJob['type'])}
              className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
            >
              <option value="translate">{t('batch.type.translate')}</option>
              <option value="summarize">{t('batch.type.summarize')}</option>
              <option value="analyze">{t('batch.type.analyze')}</option>
              <option value="custom">{t('batch.type.custom')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('batch.priority')}</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as BatchPriority)}
              className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
            >
              <option value="high">{t('batch.priority.high')}</option>
              <option value="normal">{t('batch.priority.normal')}</option>
              <option value="low">{t('batch.priority.low')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('settings.api.defaultModel')}</label>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
            >
              <option value="claude-3-5-sonnet-v2">Claude 3.5 Sonnet v2</option>
              <option value="claude-3-5-haiku">Claude 3.5 Haiku</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4o-mini">GPT-4o mini</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('batch.inputText')}</label>
            <textarea
              value={inputs}
              onChange={(e) => setInputs(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800 font-mono text-sm"
              placeholder={t('batch.inputText')}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={onClose} className="bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={!title.trim() || !inputs.trim()}>
              {t('common.create')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
