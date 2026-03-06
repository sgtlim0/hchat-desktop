import { useEffect, useState, useCallback } from 'react'
import { Bot, Play, Pause, Square, Trash2, Brain, Wrench, Eye, MessageSquare, Shield } from 'lucide-react'
import { useAutonomousAgentStore } from '@/entities/autonomous-agent/autonomous-agent.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useTranslation } from '@/shared/i18n'
import type { AgentStep } from '@/shared/types'

const STEP_ICONS: Record<AgentStep['type'], typeof Brain> = {
  think: Brain, tool_call: Wrench, observe: Eye, answer: MessageSquare,
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-text-tertiary', running: 'text-amber-500 animate-pulse',
  done: 'text-green-500', error: 'text-red-500', awaiting_approval: 'text-purple-500',
}

export function AutonomousAgentPage() {
  const { t } = useTranslation()
  const runs = useAutonomousAgentStore((s) => s.runs)
  const currentRunId = useAutonomousAgentStore((s) => s.currentRunId)
  const requireApproval = useAutonomousAgentStore((s) => s.requireApproval)
  const hydrate = useAutonomousAgentStore((s) => s.hydrate)
  const startRun = useAutonomousAgentStore((s) => s.startRun)
  const pauseRun = useAutonomousAgentStore((s) => s.pauseRun)
  const resumeRun = useAutonomousAgentStore((s) => s.resumeRun)
  const completeRun = useAutonomousAgentStore((s) => s.completeRun)
  const deleteRun = useAutonomousAgentStore((s) => s.deleteRun)
  const setCurrentRunId = useAutonomousAgentStore((s) => s.setCurrentRunId)
  const toggleRequireApproval = useAutonomousAgentStore((s) => s.toggleRequireApproval)
  const selectedModel = useSettingsStore((s) => s.selectedModel)
  const [goal, setGoal] = useState('')

  useEffect(() => { hydrate() }, [hydrate])

  const handleStart = useCallback(async () => {
    if (!goal.trim()) return
    await startRun(goal.trim(), selectedModel)
    setGoal('')
  }, [goal, selectedModel, startRun])

  const currentRun = runs.find((r) => r.id === currentRunId)
  const runStatusColors = { running: 'bg-amber-500/10 text-amber-600', completed: 'bg-green-500/10 text-green-600', failed: 'bg-red-500/10 text-red-600', paused: 'bg-purple-500/10 text-purple-600' }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />{t('autonomousAgent.title')}
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('autonomousAgent.description')}</p>

        <div className="flex gap-2 mt-3">
          <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder={t('autonomousAgent.goalPlaceholder')} className="flex-1 px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border" onKeyDown={(e) => e.key === 'Enter' && handleStart()} />
          <button onClick={handleStart} disabled={!goal.trim()} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50">
            <Play className="w-4 h-4" />{t('autonomousAgent.start')}
          </button>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
            <input type="checkbox" checked={requireApproval} onChange={toggleRequireApproval} className="rounded" />
            <Shield className="w-3.5 h-3.5" />{t('autonomousAgent.requireApproval')}
          </label>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Run list */}
        <div className="w-64 border-r border-border overflow-y-auto">
          {runs.length === 0 && <p className="p-4 text-xs text-text-tertiary">{t('autonomousAgent.noRuns')}</p>}
          {runs.map((run) => (
            <div key={run.id} onClick={() => setCurrentRunId(run.id)} className={`p-3 border-b border-border cursor-pointer hover:bg-surface-secondary ${run.id === currentRunId ? 'bg-surface-secondary' : ''}`}>
              <p className="text-sm text-text-primary truncate">{run.goal}</p>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${runStatusColors[run.status]}`}>{run.status}</span>
                <span className="text-[10px] text-text-tertiary">{run.steps.length} steps</span>
              </div>
            </div>
          ))}
        </div>

        {/* Execution tree */}
        <div className="flex-1 p-6 overflow-y-auto">
          {!currentRun ? (
            <div className="flex items-center justify-center h-full text-text-tertiary text-sm">{t('autonomousAgent.selectRun')}</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-text-primary">{currentRun.goal}</h2>
                <div className="flex gap-1.5">
                  {currentRun.status === 'running' && (
                    <button onClick={() => pauseRun(currentRun.id)} className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20"><Pause className="w-4 h-4 text-amber-600" /></button>
                  )}
                  {currentRun.status === 'paused' && (
                    <button onClick={() => resumeRun(currentRun.id)} className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20"><Play className="w-4 h-4 text-green-600" /></button>
                  )}
                  {(currentRun.status === 'running' || currentRun.status === 'paused') && (
                    <button onClick={() => completeRun(currentRun.id, 'completed')} className="p-1.5 rounded-lg bg-surface-tertiary hover:bg-surface-secondary"><Square className="w-4 h-4 text-text-secondary" /></button>
                  )}
                  <button onClick={() => deleteRun(currentRun.id)} className="p-1.5 rounded-lg hover:bg-red-500/10"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              </div>

              {/* Steps tree */}
              <div className="space-y-2">
                {currentRun.steps.length === 0 && <p className="text-xs text-text-tertiary">{t('autonomousAgent.noSteps')}</p>}
                {currentRun.steps.map((step, i) => {
                  const Icon = STEP_ICONS[step.type]
                  return (
                    <div key={step.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${step.status === 'done' ? 'bg-green-500/10' : step.status === 'running' ? 'bg-amber-500/10' : 'bg-surface-secondary'}`}>
                          <Icon className={`w-3.5 h-3.5 ${STATUS_COLORS[step.status]}`} />
                        </div>
                        {i < currentRun.steps.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-text-secondary">{step.type}</span>
                          {step.toolName && <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{step.toolName}</span>}
                        </div>
                        <p className="text-sm text-text-primary mt-0.5 whitespace-pre-wrap">{step.content}</p>
                        {step.toolResult && <p className="text-xs text-text-secondary mt-1 bg-surface-secondary p-2 rounded font-mono">{step.toolResult}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
