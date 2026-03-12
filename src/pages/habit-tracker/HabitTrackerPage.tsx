// @ts-nocheck
import { useEffect, useState } from 'react'
import { Target, Plus, Trash2, Check, Flame } from 'lucide-react'
import { useHabitStore } from '@/entities/habit/habit.store'
import { useTranslation } from '@/shared/i18n'
export function HabitTrackerPage() {
  const { t } = useTranslation()
  const habits = useHabitStore((s) => s.habits)
  const hydrate = useHabitStore((s) => s.hydrate)
  const createHabit = useHabitStore((s) => s.createHabit)
  const deleteHabit = useHabitStore((s) => s.deleteHabit)
  const toggleComplete = useHabitStore((s) => s.toggleComplete)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  useEffect(() => { hydrate() }, [hydrate])
  const today = new Date().toISOString().split('T')[0]
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2"><Target className="w-5 h-5 text-primary" />{t('habit.title')}</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm"><Plus className="w-4 h-4" />{t('habit.create')}</button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {habits.length === 0 && <p className="text-text-tertiary text-sm text-center py-12">{t('habit.empty')}</p>}
        {habits.map((h) => {
          const done = h.completedDates.includes(today)
          return (
            <div key={h.id} className={`p-4 rounded-xl border ${done ? 'border-green-400 bg-green-50 dark:bg-green-900/10' : 'border-border bg-surface'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleComplete(h.id, today)} className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? 'bg-green-500 text-white' : 'bg-surface-secondary'}`}>
                    {done ? <Check className="w-4 h-4" /> : <span className="text-lg">{h.icon}</span>}
                  </button>
                  <div><p className="text-sm font-medium text-text-primary">{h.name}</p><p className="text-xs text-text-tertiary">{h.frequency}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-amber-500"><Flame className="w-4 h-4" /><span className="text-sm font-bold">{h.streak}</span></div>
                  <button onClick={() => deleteHabit(h.id)} className="p-1 hover:bg-red-500/10 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowAdd(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowAdd(false) }}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        >
          <div className="bg-surface rounded-xl p-6 w-80 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold">{t('habit.create')}</h3>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('habit.habitName')} className="w-full px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border"
               
              autoFocus onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) { createHabit(name.trim(), 'daily', '✅', '#3b82f6'); setName(''); setShowAdd(false) }}} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm rounded-lg bg-surface-secondary">{t('common.cancel')}</button>
              <button onClick={() => { if (name.trim()) { createHabit(name.trim(), 'daily', '✅', '#3b82f6'); setName(''); setShowAdd(false) }}} className="px-3 py-1.5 text-sm rounded-lg bg-primary text-white">{t('common.create')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
