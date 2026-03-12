import { useEffect, useState } from 'react'
import { Route, Plus, Trash2, CheckCircle, Circle, ChevronRight, ChevronLeft } from 'lucide-react'
import { useLearningPathStore } from '@/entities/learning-path/learning-path.store'
import { useTranslation } from '@/shared/i18n'
import type { LearningPath } from '@/shared/types'

export function LearningPathPage() {
  const { t } = useTranslation()
  const paths = useLearningPathStore((s) => s.paths)
  const hydrate = useLearningPathStore((s) => s.hydrate)
  const createPath = useLearningPathStore((s) => s.createPath)
  const deletePath = useLearningPathStore((s) => s.deletePath)
  const addStep = useLearningPathStore((s) => s.addStep)
  const completeStep = useLearningPathStore((s) => s.completeStep)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [newStepTitle, setNewStepTitle] = useState('')
  const [newStepDesc, setNewStepDesc] = useState('')

  useEffect(() => { hydrate() }, [hydrate])

  const selected: LearningPath | undefined = paths.find((p) => p.id === selectedId)

  const handleCreate = async () => {
    if (!title.trim() || !topic.trim()) return
    await createPath(title.trim(), topic.trim())
    setTitle('')
    setTopic('')
    setShowCreate(false)
  }

  const handleAddStep = async () => {
    if (!selected || !newStepTitle.trim()) return
    await addStep(selected.id, newStepTitle.trim(), newStepDesc.trim())
    setNewStepTitle('')
    setNewStepDesc('')
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Route className="w-5 h-5 text-primary" />{t('learningPath.title')}
        </h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm">
          <Plus className="w-4 h-4" />{t('learningPath.create')}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Path List */}
        <div className={`${selected ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 border-r border-border overflow-y-auto`}>
          {paths.length === 0 && <p className="text-center text-text-tertiary text-sm py-12">{t('learningPath.empty')}</p>}
          {paths.map((path) => (
            <button key={path.id} onClick={() => setSelectedId(path.id)}
              className={`text-left px-4 py-3 border-b border-border hover:bg-surface-secondary transition-colors ${selectedId === path.id ? 'bg-surface-secondary' : ''}`}>
              <h3 className="font-semibold text-text-primary text-sm truncate">{path.title}</h3>
              <p className="text-xs text-text-tertiary mt-0.5">{path.topic}</p>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                  <span>{path.steps.length} {t('learningPath.steps')}</span>
                  <span>{path.progress}%</span>
                </div>
                <div className="w-full bg-surface-secondary rounded-full h-1.5">
                  <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${path.progress}%` }} />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Step Detail */}
        {selected ? (
          <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedId(null)} className="md:hidden p-1 rounded hover:bg-surface-secondary">
                  <ChevronLeft className="w-5 h-5 text-text-secondary" />
                </button>
                <div>
                  <h2 className="font-bold text-text-primary">{selected.title}</h2>
                  <p className="text-xs text-text-secondary">{selected.topic}</p>
                </div>
              </div>
              <button onClick={() => { deletePath(selected.id); setSelectedId(null) }} className="p-1.5 rounded hover:bg-red-500/10">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-sm text-text-secondary mb-1">
                <span>{t('learningPath.progress')}</span>
                <span className="font-semibold text-primary">{selected.progress}%</span>
              </div>
              <div className="w-full bg-surface-secondary rounded-full h-2.5">
                <div className="bg-primary rounded-full h-2.5 transition-all" style={{ width: `${selected.progress}%` }} />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              {selected.steps.map((step, idx) => (
                <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface">
                  <button onClick={() => !step.completed && completeStep(selected.id, step.id)} className="mt-0.5 shrink-0">
                    {step.completed
                      ? <CheckCircle className="w-5 h-5 text-green-500" />
                      : <Circle className="w-5 h-5 text-text-tertiary" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-tertiary">{idx + 1}</span>
                      <h4 className={`text-sm font-medium ${step.completed ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>{step.title}</h4>
                    </div>
                    {step.description && <p className="text-xs text-text-secondary mt-0.5">{step.description}</p>}
                    {step.score !== undefined && <span className="text-xs text-amber-500 mt-1 inline-block">{t('learningPath.score')}: {step.score}</span>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0 mt-0.5" />
                </div>
              ))}
            </div>

            {/* Add Step */}
            <div className="p-3 rounded-lg border border-dashed border-border space-y-2">
              <input value={newStepTitle} onChange={(e) => setNewStepTitle(e.target.value)}
                placeholder={t('learningPath.stepTitle')} className="w-full px-3 py-1.5 text-sm rounded-lg bg-surface-secondary border border-border"
                onKeyDown={(e) => e.key === 'Enter' && handleAddStep()} />
              <input value={newStepDesc} onChange={(e) => setNewStepDesc(e.target.value)}
                placeholder={t('learningPath.stepDescription')} className="w-full px-3 py-1.5 text-sm rounded-lg bg-surface-secondary border border-border" />
              <button onClick={handleAddStep} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg">
                <Plus className="w-4 h-4" />{t('learningPath.addStep')}
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-text-tertiary text-sm">
            {t('learningPath.selectPath')}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowCreate(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowCreate(false) }}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        >
          <div className="bg-surface rounded-xl p-6 w-80 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-text-primary">{t('learningPath.create')}</h3>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={t('learningPath.titlePlaceholder')} className="w-full px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus />
            <input value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder={t('learningPath.topicPlaceholder')} className="w-full px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm rounded-lg bg-surface-secondary">{t('common.cancel')}</button>
              <button onClick={handleCreate} className="px-3 py-1.5 text-sm rounded-lg bg-primary text-white">{t('common.create')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
