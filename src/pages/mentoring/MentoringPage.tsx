import { useEffect, useState } from 'react'
import { GraduationCap, Plus, Trash2, Play, Pause, CheckCircle } from 'lucide-react'
import { useMentoringStore } from '@/entities/mentoring/mentoring.store'
import { useTranslation } from '@/shared/i18n'
import type { MentoringDifficulty } from '@/shared/types'

const DIFFICULTY_COLORS: Record<MentoringDifficulty, string> = { beginner: 'text-green-500', intermediate: 'text-amber-500', advanced: 'text-red-500' }

export function MentoringPage() {
  const { t } = useTranslation()
  const goals = useMentoringStore((s) => s.goals)
  const hydrate = useMentoringStore((s) => s.hydrate)
  const addGoal = useMentoringStore((s) => s.addGoal)
  const updateProgress = useMentoringStore((s) => s.updateProgress)
  const completeGoal = useMentoringStore((s) => s.completeGoal)
  const pauseGoal = useMentoringStore((s) => s.pauseGoal)
  const resumeGoal = useMentoringStore((s) => s.resumeGoal)
  const removeGoal = useMentoringStore((s) => s.removeGoal)
  const [showAdd, setShowAdd] = useState(false)
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState<MentoringDifficulty>('beginner')

  useEffect(() => { hydrate() }, [hydrate])

  const handleAdd = async () => {
    if (!topic.trim()) return
    await addGoal(topic.trim(), difficulty, 10)
    setTopic(''); setShowAdd(false)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />{t('mentoring.title')}
        </h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm">
          <Plus className="w-4 h-4" />{t('mentoring.addGoal')}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {goals.length === 0 && <p className="text-center text-text-tertiary text-sm py-12">{t('mentoring.empty')}</p>}
        {goals.map((goal) => (
          <div key={goal.id} className="p-4 rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-text-primary text-sm">{goal.topic}</h3>
              <div className="flex items-center gap-1.5">
                {goal.status === 'active' && <button onClick={() => pauseGoal(goal.id)} className="p-1 rounded hover:bg-surface-tertiary"><Pause className="w-3.5 h-3.5 text-amber-500" /></button>}
                {goal.status === 'paused' && <button onClick={() => resumeGoal(goal.id)} className="p-1 rounded hover:bg-surface-tertiary"><Play className="w-3.5 h-3.5 text-green-500" /></button>}
                {goal.status !== 'completed' && <button onClick={() => completeGoal(goal.id)} className="p-1 rounded hover:bg-surface-tertiary"><CheckCircle className="w-3.5 h-3.5 text-primary" /></button>}
                <button onClick={() => removeGoal(goal.id)} className="p-1 rounded hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
              <span className={DIFFICULTY_COLORS[goal.difficulty]}>{goal.difficulty}</span>
              <span>{goal.status}</span>
            </div>
            <div className="w-full bg-surface-secondary rounded-full h-2">
              <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${(goal.progress / goal.totalSteps) * 100}%` }} />
            </div>
            <p className="text-xs text-text-tertiary mt-1">{goal.progress}/{goal.totalSteps} {t('mentoring.steps')}</p>
            {goal.status === 'active' && (
              <button onClick={() => updateProgress(goal.id, goal.progress + 1)} className="mt-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20">
                +1 {t('mentoring.step')}
              </button>
            )}
          </div>
        ))}
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAdd(false)}>
          <div className="bg-surface rounded-xl p-6 w-80 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-text-primary">{t('mentoring.addGoal')}</h3>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={t('mentoring.topicPlaceholder')} className="w-full px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as MentoringDifficulty)} className="w-full text-sm rounded-lg bg-surface-secondary border border-border px-3 py-2">
              <option value="beginner">{t('mentoring.beginner')}</option>
              <option value="intermediate">{t('mentoring.intermediate')}</option>
              <option value="advanced">{t('mentoring.advanced')}</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm rounded-lg bg-surface-secondary">{t('common.cancel')}</button>
              <button onClick={handleAdd} className="px-3 py-1.5 text-sm rounded-lg bg-primary text-white">{t('common.add')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
