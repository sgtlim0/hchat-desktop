import { useState } from 'react'
import { ArrowLeft, Link2, Play, Square, Plus, Trash2, ChevronDown, GitBranch, Check, X } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { usePromptChainStore } from '@/entities/prompt-chain/prompt-chain.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'
import type { ChainStepType } from '@/shared/types'

export function PromptChainPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const { chains, currentChainId, isRunning, createChain, updateChain, deleteChain, addStep, removeStep, selectChain, runChain, stopChain } = usePromptChainStore()

  const [isCreating, setIsCreating] = useState(false)
  const [newChainName, setNewChainName] = useState('')
  const [newChainDesc, setNewChainDesc] = useState('')
  const [stepForm, setStepForm] = useState({
    type: 'prompt' as ChainStepType,
    label: '',
    promptContent: '',
  })

  const currentChain = chains.find((c) => c.id === currentChainId)

  function handleCreateChain() {
    if (!newChainName.trim()) return
    createChain(newChainName, newChainDesc)
    setNewChainName('')
    setNewChainDesc('')
    setIsCreating(false)
  }

  function handleDeleteChain() {
    if (!currentChainId) return
    if (!confirm(t('promptChain.deleteConfirm'))) return
    deleteChain(currentChainId)
  }

  function handleAddStep() {
    if (!currentChainId || !stepForm.label.trim()) return
    addStep(currentChainId, {
      type: stepForm.type,
      label: stepForm.label,
      promptContent: stepForm.promptContent || undefined,
    })
    setStepForm({ type: 'prompt', label: '', promptContent: '' })
  }

  function handleRemoveStep(stepId: string) {
    if (!currentChainId) return
    removeStep(currentChainId, stepId)
  }

  function getStepIcon(type: ChainStepType) {
    if (type === 'condition') return <GitBranch size={14} />
    return <span className="text-xs">▶</span>
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="h-[52px] border-b border-border px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('home')}
            className="p-1.5 hover:bg-hover rounded-lg transition"
          >
            <ArrowLeft size={18} className="text-text-secondary" />
          </button>
          <Link2 size={18} className="text-primary" />
          <div>
            <h1 className="text-sm font-semibold text-text-primary">{t('promptChain.title')}</h1>
            <p className="text-xs text-text-tertiary">{t('promptChain.description')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {currentChain && (
            <>
              {isRunning ? (
                <Button variant="secondary" size="sm" onClick={stopChain}>
                  <Square size={14} />
                  {t('promptChain.stop')}
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={() => runChain(currentChainId!)}>
                  <Play size={14} />
                  {t('promptChain.run')}
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={handleDeleteChain}>
                <Trash2 size={14} />
              </Button>
            </>
          )}
          <Button variant="primary" size="sm" onClick={() => setIsCreating(true)}>
            <Plus size={14} />
            {t('promptChain.newChain')}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Create new chain form */}
          {isCreating && (
            <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
              <input
                type="text"
                value={newChainName}
                onChange={(e) => setNewChainName(e.target.value)}
                placeholder={t('promptChain.chainNamePlaceholder')}
                className="w-full px-3 py-2 bg-input border border-border-input rounded-lg text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary"
              />
              <textarea
                value={newChainDesc}
                onChange={(e) => setNewChainDesc(e.target.value)}
                placeholder={t('promptChain.chainDescriptionPlaceholder')}
                rows={2}
                className="w-full px-3 py-2 bg-input border border-border-input rounded-lg text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary resize-none"
              />
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={handleCreateChain} disabled={!newChainName.trim()}>
                  <Check size={14} />
                  {t('common.create')}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => { setIsCreating(false); setNewChainName(''); setNewChainDesc('') }}>
                  <X size={14} />
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}

          {/* Chain selector */}
          {chains.length > 0 && (
            <div>
              <label className="text-xs text-text-tertiary mb-2 block">{t('promptChain.selectChain')}</label>
              <div className="relative">
                <select
                  value={currentChainId || ''}
                  onChange={(e) => selectChain(e.target.value || null)}
                  className="w-full px-3 py-2 pr-8 bg-input border border-border-input rounded-lg text-sm text-text-primary outline-none focus:border-primary appearance-none"
                >
                  <option value="">{t('promptChain.selectChain')}</option>
                  {chains.map((chain) => (
                    <option key={chain.id} value={chain.id}>
                      {chain.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
              </div>
            </div>
          )}

          {/* Empty state */}
          {chains.length === 0 && !isCreating && (
            <div className="text-center py-12">
              <Link2 size={48} className="mx-auto text-text-tertiary mb-3" />
              <p className="text-sm text-text-secondary mb-1">{t('promptChain.empty')}</p>
              <p className="text-xs text-text-tertiary">{t('promptChain.emptyHint')}</p>
            </div>
          )}

          {/* Current chain editor */}
          {currentChain && (
            <>
              {/* Chain info */}
              <div className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={currentChain.name}
                      onChange={(e) => updateChain(currentChain.id, { name: e.target.value })}
                      className="w-full px-2 py-1 text-base font-semibold text-text-primary bg-transparent border border-transparent hover:border-border-input focus:border-primary rounded outline-none"
                    />
                    <textarea
                      value={currentChain.description}
                      onChange={(e) => updateChain(currentChain.id, { description: e.target.value })}
                      rows={2}
                      className="w-full px-2 py-1 text-sm text-text-secondary bg-transparent border border-transparent hover:border-border-input focus:border-primary rounded outline-none resize-none mt-1"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-hover text-xs font-medium text-text-secondary">
                    <div className={`w-2 h-2 rounded-full ${
                      currentChain.status === 'running' ? 'bg-primary animate-pulse' :
                      currentChain.status === 'done' ? 'bg-success' :
                      currentChain.status === 'error' ? 'bg-danger' :
                      'bg-text-tertiary'
                    }`} />
                    {t(`promptChain.status.${currentChain.status}`)}
                  </div>
                </div>
              </div>

              {/* Steps timeline */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text-primary">{t('promptChain.steps')}</h3>
                </div>

                {currentChain.steps.length > 0 && (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-border" />

                    {currentChain.steps.map((step, index) => {
                      const result = currentChain.results[step.id]
                      const isCurrentStep = currentChain.currentStepIndex === index && isRunning

                      return (
                        <div key={step.id} className="relative flex gap-4 mb-4">
                          {/* Step number circle */}
                          <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                            isCurrentStep ? 'bg-primary text-white' :
                            result ? 'bg-success text-white' :
                            'bg-surface border-2 border-border text-text-tertiary'
                          }`}>
                            {index + 1}
                          </div>

                          {/* Step content */}
                          <div className="flex-1 bg-surface border border-border rounded-xl p-4 min-h-[80px]">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getStepIcon(step.type)}
                                <span className="text-sm font-medium text-text-primary">{step.label}</span>
                                <span className="text-xs text-text-tertiary px-2 py-0.5 bg-hover rounded">
                                  {t(`promptChain.stepType.${step.type}`)}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleRemoveStep(step.id)}
                                  className="p-1 hover:bg-hover rounded transition"
                                  disabled={isRunning}
                                >
                                  <Trash2 size={12} className="text-text-tertiary" />
                                </button>
                              </div>
                            </div>

                            {step.promptContent && (
                              <p className="text-xs text-text-secondary line-clamp-2 mb-2">
                                {step.promptContent}
                              </p>
                            )}

                            {result && (
                              <div className="mt-2 pt-2 border-t border-border">
                                <p className="text-xs text-success mb-1">✓ {t('promptChain.results')}</p>
                                <p className="text-xs text-text-secondary line-clamp-2">{result}</p>
                              </div>
                            )}

                            {isCurrentStep && (
                              <div className="mt-2 flex items-center gap-2 text-xs text-primary">
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                {t('promptChain.status.running')}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Add step form */}
                <div className="bg-surface border border-dashed border-border rounded-xl p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={stepForm.label}
                        onChange={(e) => setStepForm({ ...stepForm, label: e.target.value })}
                        placeholder={t('promptChain.stepLabelPlaceholder')}
                        disabled={isRunning}
                        className="w-full px-3 py-2 bg-input border border-border-input rounded-lg text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary"
                      />
                    </div>
                    <select
                      value={stepForm.type}
                      onChange={(e) => setStepForm({ ...stepForm, type: e.target.value as ChainStepType })}
                      disabled={isRunning}
                      className="px-3 py-2 bg-input border border-border-input rounded-lg text-sm text-text-primary outline-none focus:border-primary"
                    >
                      <option value="prompt">{t('promptChain.stepType.prompt')}</option>
                      <option value="condition">{t('promptChain.stepType.condition')}</option>
                      <option value="transform">{t('promptChain.stepType.transform')}</option>
                    </select>
                  </div>

                  {stepForm.type === 'prompt' && (
                    <textarea
                      value={stepForm.promptContent}
                      onChange={(e) => setStepForm({ ...stepForm, promptContent: e.target.value })}
                      placeholder={t('promptChain.promptContentPlaceholder')}
                      rows={3}
                      disabled={isRunning}
                      className="w-full px-3 py-2 bg-input border border-border-input rounded-lg text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary resize-none"
                    />
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAddStep}
                    disabled={!stepForm.label.trim() || isRunning}
                  >
                    <Plus size={14} />
                    {t('promptChain.addStep')}
                  </Button>
                </div>
              </div>

              {/* Results section */}
              {Object.keys(currentChain.results).length > 0 && (
                <div className="bg-surface border border-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-text-primary mb-3">{t('promptChain.results')}</h3>
                  <div className="space-y-2">
                    {currentChain.steps.map((step) => {
                      const result = currentChain.results[step.id]
                      if (!result) return null
                      return (
                        <div key={step.id} className="flex items-start gap-3 p-3 bg-hover rounded-lg">
                          <span className="text-xs text-success">✓</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-text-primary mb-1">{step.label}</p>
                            <p className="text-xs text-text-secondary">{result}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
