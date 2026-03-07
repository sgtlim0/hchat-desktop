// @ts-nocheck
import { useEffect } from 'react'
import { BookOpen, Plus, Trash2 } from 'lucide-react'
import { useTutorialStore } from '@/entities/tutorial/tutorial.store'
import { useTranslation } from '@/shared/i18n'
export function TutorialBuilderPage() {
  const { t } = useTranslation()
  const tutorials = useTutorialStore((s) => s.tutorials)
  const selectedTutorialId = useTutorialStore((s) => s.selectedTutorialId)
  const hydrate = useTutorialStore((s) => s.hydrate)
  const createTutorial = useTutorialStore((s) => s.createTutorial)
  const deleteTutorial = useTutorialStore((s) => s.deleteTutorial)
  const addStep = useTutorialStore((s) => s.addStep)
  const removeStep = useTutorialStore((s) => s.removeStep)
  const selectTutorial = useTutorialStore((s) => s.selectTutorial)
  useEffect(() => { hydrate() }, [hydrate])
  const selected = tutorials.find((t) => t.id === selectedTutorialId)
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" />{t('tutorial.title')}</h1>
        <button onClick={() => createTutorial('New Tutorial')} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm"><Plus className="w-4 h-4" />{t('tutorial.create')}</button>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-56 border-r border-border overflow-y-auto">
          {tutorials.map((tut) => (
            <div key={tut.id} onClick={() => selectTutorial(tut.id)} className={`p-3 border-b border-border cursor-pointer hover:bg-surface-secondary ${tut.id === selectedTutorialId ? 'bg-surface-secondary' : ''}`}>
              <p className="text-sm text-text-primary truncate">{tut.title}</p>
              <p className="text-[10px] text-text-tertiary">{tut.steps.length} steps</p>
            </div>
          ))}
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          {!selected ? <p className="text-text-tertiary text-sm">{t('tutorial.selectTutorial')}</p> : (
            <div className="space-y-4">
              <div className="flex justify-between"><h2 className="font-semibold">{selected.title}</h2>
                <div className="flex gap-1.5"><button onClick={() => addStep(selected.id, 'New Step', '')} className="px-2 py-1 text-xs bg-primary text-white rounded">{t('tutorial.addStep')}</button><button onClick={() => deleteTutorial(selected.id)} className="p-1 hover:bg-red-500/10 rounded"><Trash2 className="w-4 h-4 text-red-500" /></button></div>
              </div>
              {selected.steps.map((step, i) => (
                <div key={step.id} className="p-3 rounded-lg border border-border bg-surface">
                  <div className="flex justify-between"><span className="text-sm font-medium">{i+1}. {step.title}</span><button onClick={() => removeStep(selected.id, step.id)} className="p-0.5 hover:bg-red-500/10 rounded"><Trash2 className="w-3 h-3 text-red-400" /></button></div>
                  <p className="text-xs text-text-secondary mt-1">{step.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
