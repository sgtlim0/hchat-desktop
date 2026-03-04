import { useState } from 'react'
import {
  Workflow,
  Play,
  Square,
  Plus,
  Trash2,
  Settings,
  ArrowDown,
  FileText,
  Languages,
  Filter,
  Zap,
  ArrowLeft,
} from 'lucide-react'
import { useWorkflowStore } from '@/entities/workflow/workflow.store'
import { useSessionStore } from '@/entities/session/session.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'
import type { WorkflowBlockType, WorkflowTrigger } from '@/shared/types'

const BLOCK_ICONS: Record<WorkflowBlockType, React.ReactNode> = {
  prompt: <FileText className="h-4 w-4" />,
  translate: <Languages className="h-4 w-4" />,
  summarize: <FileText className="h-4 w-4" />,
  extract: <Zap className="h-4 w-4" />,
  condition: <Filter className="h-4 w-4" />,
  output: <ArrowDown className="h-4 w-4" />,
}

const TEMPLATES = [
  {
    id: 'daily-report',
    nameKey: 'workflow.template.dailyReport',
    blocks: [
      { type: 'prompt' as const, label: 'Input Analysis', config: {} },
      { type: 'summarize' as const, label: 'Summarize', config: {} },
      { type: 'output' as const, label: 'Final Report', config: {} },
    ],
  },
  {
    id: 'doc-review',
    nameKey: 'workflow.template.docReview',
    blocks: [
      { type: 'prompt' as const, label: 'Document Input', config: {} },
      { type: 'extract' as const, label: 'Extract Key Points', config: {} },
      { type: 'prompt' as const, label: 'Generate Feedback', config: {} },
      { type: 'output' as const, label: 'Review Output', config: {} },
    ],
  },
  {
    id: 'translation-chain',
    nameKey: 'workflow.template.translationChain',
    blocks: [
      { type: 'prompt' as const, label: 'Original Text', config: {} },
      { type: 'translate' as const, label: 'Translate', config: {} },
      { type: 'summarize' as const, label: 'Summarize', config: {} },
      { type: 'output' as const, label: 'Final Output', config: {} },
    ],
  },
]

export function WorkflowBuilderPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const darkMode = useSettingsStore((s) => s.darkMode)

  const {
    workflows,
    currentWorkflowId,
    isRunning,
    blockResults,
    createWorkflow,
    deleteWorkflow,
    selectWorkflow,
    addBlock,
    removeBlock,
    updateBlock,
    runWorkflow,
    stopWorkflow,
  } = useWorkflowStore()

  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newTrigger, setNewTrigger] = useState<WorkflowTrigger>('manual')
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)

  const currentWorkflow = workflows.find((w) => w.id === currentWorkflowId)

  function handleCreateWorkflow() {
    if (!newName.trim()) return
    const id = createWorkflow(newName, newDescription, newTrigger)
    setIsCreating(false)
    setNewName('')
    setNewDescription('')
    setNewTrigger('manual')
    selectWorkflow(id)
  }

  function handleDeleteWorkflow() {
    if (!currentWorkflowId) return
    if (confirm(t('workflow.deleteConfirm'))) {
      deleteWorkflow(currentWorkflowId)
    }
  }

  function handleAddBlock(type: WorkflowBlockType) {
    if (!currentWorkflowId) return
    const labels: Record<WorkflowBlockType, string> = {
      prompt: t('workflow.block.prompt'),
      translate: t('workflow.block.translate'),
      summarize: t('workflow.block.summarize'),
      extract: t('workflow.block.extract'),
      condition: t('workflow.block.condition'),
      output: t('workflow.block.output'),
    }
    const label = labels[type]
    const blockCount = currentWorkflow?.blocks.length ?? 0
    addBlock(currentWorkflowId, {
      type,
      label,
      config: {},
      x: 0,
      y: blockCount * 100,
    })
  }

  function handleRunWorkflow() {
    if (currentWorkflowId && !isRunning) {
      runWorkflow(currentWorkflowId)
    }
  }

  function handleUseTemplate(templateId: string) {
    const template = TEMPLATES.find((tmpl) => tmpl.id === templateId)
    if (!template) return
    const templateNames = {
      'daily-report': t('workflow.template.dailyReport'),
      'doc-review': t('workflow.template.docReview'),
      'translation-chain': t('workflow.template.translationChain'),
    }
    const name = templateNames[templateId as keyof typeof templateNames] ?? templateId
    const id = createWorkflow(
      name,
      `Template: ${name}`,
      'manual'
    )
    selectWorkflow(id)
    template.blocks.forEach((block) => {
      addBlock(id, { ...block, x: 0, y: 0 })
    })
  }

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50'
  const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900'
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600'
  const inputClass = darkMode
    ? 'bg-gray-700 border-gray-600 text-gray-100'
    : 'bg-white border-gray-300 text-gray-900'
  const blockClass = darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'

  return (
    <div className={`flex-1 ${bgClass} overflow-auto`}>
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setView('home')}
            className={`p-2 rounded-lg ${mutedClass} hover:bg-gray-200 dark:hover:bg-gray-700`}
            aria-label={t('common.back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Workflow className={`h-6 w-6 ${mutedClass}`} />
              <h1 className={`text-2xl font-bold ${textClass}`}>{t('workflow.title')}</h1>
            </div>
            <p className={`text-sm ${mutedClass} mt-1`}>{t('workflow.subtitle')}</p>
          </div>
        </div>

        {/* Create + Select Row */}
        <div className={`${cardClass} border rounded-lg p-4 mb-4`}>
          <div className="flex items-center gap-3">
            <Button onClick={() => setIsCreating(true)} disabled={isRunning}>
              <Plus className="h-4 w-4 mr-1" />
              {t('workflow.newWorkflow')}
            </Button>
            {workflows.length > 0 && (
              <select
                className={`flex-1 px-3 py-2 border rounded-lg ${inputClass}`}
                value={currentWorkflowId ?? ''}
                onChange={(e) => selectWorkflow(e.target.value)}
                disabled={isRunning}
              >
                <option value="">{t('workflow.selectWorkflow')}</option>
                {workflows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            )}
            {currentWorkflowId && (
              <button
                onClick={handleDeleteWorkflow}
                className={`p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg`}
                disabled={isRunning}
                aria-label={t('common.delete')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Create Form */}
        {isCreating && (
          <div className={`${cardClass} border rounded-lg p-4 mb-4`}>
            <div className="space-y-3">
              <div>
                <label className={`block text-sm font-medium ${textClass} mb-1`}>
                  {t('workflow.name')}
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t('workflow.name')}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${textClass} mb-1`}>
                  {t('workflow.description')}
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder={t('workflow.description')}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${textClass} mb-1`}>
                  {t('workflow.trigger')}
                </label>
                <div className="flex gap-2">
                  {(['manual', 'schedule', 'webhook'] as const).map((trig) => (
                    <button
                      key={trig}
                      onClick={() => setNewTrigger(trig)}
                      className={`px-3 py-2 border rounded-lg text-sm ${
                        newTrigger === trig
                          ? 'bg-blue-500 text-white border-blue-500'
                          : `${inputClass}`
                      }`}
                    >
                      {t(`workflow.trigger.${trig}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateWorkflow}>{t('common.create')}</Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsCreating(false)
                    setNewName('')
                    setNewDescription('')
                  }}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Templates */}
        {!currentWorkflowId && workflows.length === 0 && !isCreating && (
          <div className={`${cardClass} border rounded-lg p-6 mb-4`}>
            <h3 className={`text-lg font-semibold ${textClass} mb-3`}>{t('workflow.templates')}</h3>
            <div className="grid grid-cols-3 gap-3">
              {TEMPLATES.map((tmpl) => {
                const templateNames = {
                  'daily-report': t('workflow.template.dailyReport'),
                  'doc-review': t('workflow.template.docReview'),
                  'translation-chain': t('workflow.template.translationChain'),
                }
                const name = templateNames[tmpl.id as keyof typeof templateNames] ?? tmpl.id
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => handleUseTemplate(tmpl.id)}
                    className={`p-4 border rounded-lg ${blockClass} hover:border-blue-500 text-left`}
                  >
                    <div className={`font-medium ${textClass}`}>{name}</div>
                    <div className={`text-xs ${mutedClass} mt-1`}>
                      {tmpl.blocks.length} blocks
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Workflow Editor */}
        {currentWorkflow && (
          <>
            {/* Workflow Info */}
            <div className={`${cardClass} border rounded-lg p-4 mb-4`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${textClass}`}>{currentWorkflow.name}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      currentWorkflow.status === 'running'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : currentWorkflow.status === 'done'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {t(`workflow.status.${currentWorkflow.status}`)}
                  </span>
                </div>
                <div className={`text-sm ${mutedClass}`}>
                  {t(`workflow.trigger.${currentWorkflow.trigger}`)}
                </div>
              </div>
              {currentWorkflow.description && (
                <p className={`text-sm ${mutedClass}`}>{currentWorkflow.description}</p>
              )}
            </div>

            {/* Add Block Buttons */}
            <div className={`${cardClass} border rounded-lg p-4 mb-4`}>
              <div className={`text-sm font-medium ${textClass} mb-2`}>
                {t('workflow.addBlock')}
              </div>
              <div className="flex flex-wrap gap-2">
                {(['prompt', 'translate', 'summarize', 'extract', 'condition', 'output'] as const).map(
                  (type) => {
                    const labels: Record<WorkflowBlockType, string> = {
                      prompt: t('workflow.block.prompt'),
                      translate: t('workflow.block.translate'),
                      summarize: t('workflow.block.summarize'),
                      extract: t('workflow.block.extract'),
                      condition: t('workflow.block.condition'),
                      output: t('workflow.block.output'),
                    }
                    return (
                      <button
                        key={type}
                        onClick={() => handleAddBlock(type)}
                        disabled={isRunning}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${blockClass} hover:border-blue-500 disabled:opacity-50`}
                      >
                        {BLOCK_ICONS[type]}
                        <span className="text-sm">{labels[type]}</span>
                      </button>
                    )
                  }
                )}
              </div>
            </div>

            {/* Block List */}
            <div className={`${cardClass} border rounded-lg p-4 mb-4`}>
              <div className={`text-sm font-medium ${textClass} mb-3`}>{t('workflow.blocks')}</div>
              {currentWorkflow.blocks.length === 0 ? (
                <div className={`text-sm ${mutedClass} text-center py-8`}>
                  {t('workflow.createFirst')}
                </div>
              ) : (
                <div className="space-y-3">
                  {currentWorkflow.blocks.map((block, idx) => (
                    <div key={block.id}>
                      <div
                        className={`flex items-center justify-between p-3 border rounded-lg ${blockClass}`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {BLOCK_ICONS[block.type]}
                          <div className="flex-1">
                            <div className={`font-medium ${textClass} text-sm`}>{block.label}</div>
                            <div className={`text-xs ${mutedClass}`}>
                              {(() => {
                                const labels: Record<WorkflowBlockType, string> = {
                                  prompt: t('workflow.block.prompt'),
                                  translate: t('workflow.block.translate'),
                                  summarize: t('workflow.block.summarize'),
                                  extract: t('workflow.block.extract'),
                                  condition: t('workflow.block.condition'),
                                  output: t('workflow.block.output'),
                                }
                                return labels[block.type]
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setEditingBlockId(editingBlockId === block.id ? null : block.id)
                            }
                            className={`p-1 rounded ${mutedClass} hover:bg-gray-200 dark:hover:bg-gray-600`}
                            disabled={isRunning}
                            aria-label={t('workflow.editBlock')}
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => currentWorkflowId && removeBlock(currentWorkflowId, block.id)}
                            className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            disabled={isRunning}
                            aria-label={t('common.delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Inline Block Editor */}
                      {editingBlockId === block.id && (
                        <div className={`ml-6 mt-2 p-3 border rounded-lg ${inputClass}`}>
                          <div className="space-y-2">
                            <div>
                              <label className={`block text-xs font-medium ${textClass} mb-1`}>
                                {t('workflow.name')}
                              </label>
                              <input
                                type="text"
                                className={`w-full px-2 py-1 text-sm border rounded ${inputClass}`}
                                value={block.label}
                                onChange={(e) =>
                                  currentWorkflowId && updateBlock(currentWorkflowId, block.id, {
                                    label: e.target.value,
                                  })
                                }
                              />
                            </div>
                            {block.type === 'prompt' && (
                              <div>
                                <label className={`block text-xs font-medium ${textClass} mb-1`}>
                                  {t('workflow.promptContent')}
                                </label>
                                <textarea
                                  className={`w-full px-2 py-1 text-sm border rounded ${inputClass}`}
                                  rows={3}
                                  value={(block.config.content as string) ?? ''}
                                  onChange={(e) =>
                                    currentWorkflowId && updateBlock(currentWorkflowId, block.id, {
                                      config: { ...block.config, content: e.target.value },
                                    })
                                  }
                                />
                              </div>
                            )}
                            {block.type === 'translate' && (
                              <>
                                <div>
                                  <label className={`block text-xs font-medium ${textClass} mb-1`}>
                                    {t('workflow.sourceLang')}
                                  </label>
                                  <input
                                    type="text"
                                    className={`w-full px-2 py-1 text-sm border rounded ${inputClass}`}
                                    value={(block.config.sourceLang as string) ?? 'auto'}
                                    onChange={(e) =>
                                      currentWorkflowId && updateBlock(currentWorkflowId, block.id, {
                                        config: { ...block.config, sourceLang: e.target.value },
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className={`block text-xs font-medium ${textClass} mb-1`}>
                                    {t('workflow.targetLang')}
                                  </label>
                                  <input
                                    type="text"
                                    className={`w-full px-2 py-1 text-sm border rounded ${inputClass}`}
                                    value={(block.config.targetLang as string) ?? 'en'}
                                    onChange={(e) =>
                                      currentWorkflowId && updateBlock(currentWorkflowId, block.id, {
                                        config: { ...block.config, targetLang: e.target.value },
                                      })
                                    }
                                  />
                                </div>
                              </>
                            )}
                            {block.type === 'output' && (
                              <div>
                                <label className={`block text-xs font-medium ${textClass} mb-1`}>
                                  {t('workflow.outputMessage')}
                                </label>
                                <input
                                  type="text"
                                  className={`w-full px-2 py-1 text-sm border rounded ${inputClass}`}
                                  value={(block.config.message as string) ?? ''}
                                  onChange={(e) =>
                                    currentWorkflowId && updateBlock(currentWorkflowId, block.id, {
                                      config: { ...block.config, message: e.target.value },
                                    })
                                  }
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Arrow */}
                      {idx < currentWorkflow.blocks.length - 1 && (
                        <div className="flex justify-center my-2">
                          <ArrowDown className={`h-5 w-5 ${mutedClass}`} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Execution Results */}
            {Object.keys(blockResults).length > 0 && (
              <div className={`${cardClass} border rounded-lg p-4 mb-4`}>
                <div className={`text-sm font-medium ${textClass} mb-3`}>
                  {t('workflow.results')}
                </div>
                <div className="space-y-2">
                  {currentWorkflow.blocks.map((block, idx) => {
                    const result = blockResults[block.id]
                    return (
                      <div key={block.id} className={`text-sm ${mutedClass}`}>
                        <div className="flex items-center gap-2">
                          <span>Block {idx + 1}:</span>
                          {result ? (
                            <>
                              <span className="text-green-500">✓</span>
                              <span className={textClass}>{result}</span>
                            </>
                          ) : (
                            <span>—</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Run Controls */}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleRunWorkflow}
                disabled={isRunning || currentWorkflow.blocks.length === 0}
              >
                <Play className="h-4 w-4 mr-1" />
                {isRunning ? t('workflow.running') : t('workflow.run')}
              </Button>
              {isRunning && (
                <Button variant="secondary" onClick={stopWorkflow}>
                  <Square className="h-4 w-4 mr-1" />
                  {t('workflow.stop')}
                </Button>
              )}
            </div>
          </>
        )}

        {/* Empty State */}
        {workflows.length === 0 && !isCreating && (
          <div className={`${cardClass} border rounded-lg p-12 text-center`}>
            <Workflow className={`h-12 w-12 ${mutedClass} mx-auto mb-3`} />
            <div className={`text-lg font-medium ${textClass} mb-1`}>
              {t('workflow.noWorkflows')}
            </div>
            <div className={`text-sm ${mutedClass}`}>{t('workflow.createFirst')}</div>
          </div>
        )}
      </div>
    </div>
  )
}
