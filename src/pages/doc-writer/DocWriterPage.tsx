import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ArrowLeft, Loader2, Plus, Trash2, Download, RefreshCw, ChevronRight, ChevronLeft, FileText } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useDocWriterStore, type DocType } from '@/entities/doc-writer/doc-writer.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'
import { MODELS } from '@/shared/constants'

const DOC_TYPES: { id: DocType; labelKey: string }[] = [
  { id: 'report', labelKey: 'docWriter.docType.report' },
  { id: 'proposal', labelKey: 'docWriter.docType.proposal' },
  { id: 'presentation', labelKey: 'docWriter.docType.presentation' },
  { id: 'manual', labelKey: 'docWriter.docType.manual' },
]

const STEPS = [
  'docWriter.step1',
  'docWriter.step2',
  'docWriter.step3',
  'docWriter.step4',
  'docWriter.step5',
] as const

export function DocWriterPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const selectedModel = useSettingsStore((s) => s.selectedModel)
  const credentials = useSettingsStore((s) => s.credentials)
  const openaiApiKey = useSettingsStore((s) => s.openaiApiKey)
  const geminiApiKey = useSettingsStore((s) => s.geminiApiKey)

  const {
    currentProject,
    step,
    isGenerating,
    createProject,
    setContext,
    generateOutline,
    updateOutlineSection,
    addOutlineSection,
    removeOutlineSection,
    generateSectionContent,
    updateSectionContent,
    exportMarkdown,
    exportText,
    setStep,
    reset,
  } = useDocWriterStore(
    useShallow((s) => ({
      currentProject: s.currentProject,
      step: s.step,
      isGenerating: s.isGenerating,
      createProject: s.createProject,
      setContext: s.setContext,
      generateOutline: s.generateOutline,
      updateOutlineSection: s.updateOutlineSection,
      addOutlineSection: s.addOutlineSection,
      removeOutlineSection: s.removeOutlineSection,
      generateSectionContent: s.generateSectionContent,
      updateSectionContent: s.updateSectionContent,
      exportMarkdown: s.exportMarkdown,
      exportText: s.exportText,
      setStep: s.setStep,
      reset: s.reset,
    }))
  )

  // Step 1 local state
  const [projectName, setProjectName] = useState('')
  const [docType, setDocType] = useState<DocType>('report')
  const [modelId, setModelId] = useState(selectedModel)

  // Step 3 local state
  const [newSectionTitle, setNewSectionTitle] = useState('')

  // Step 4 local state
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)

  function handleCreateProject() {
    if (!projectName.trim()) return
    createProject(projectName.trim(), docType, modelId)
    setStep(2)
  }

  async function handleGenerateOutline() {
    try {
      await generateOutline(credentials, openaiApiKey, geminiApiKey)
    } catch {
      // Error handled in store
    }
  }

  function handleAddSection() {
    if (!newSectionTitle.trim()) return
    addOutlineSection(newSectionTitle.trim(), 1)
    setNewSectionTitle('')
  }

  async function handleGenerateSectionContent() {
    if (!selectedSectionId) return
    try {
      await generateSectionContent(selectedSectionId, credentials, openaiApiKey, geminiApiKey)
    } catch {
      // Error handled in store
    }
  }

  function handleDownloadMd() {
    const md = exportMarkdown()
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentProject?.name ?? 'document'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleDownloadTxt() {
    const txt = exportText()
    const blob = new Blob([txt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentProject?.name ?? 'document'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleBack() {
    reset()
    setView('home')
  }

  function canGoNext(): boolean {
    if (step === 1) return !!projectName.trim()
    if (step === 2) return !!currentProject
    if (step === 3) return (currentProject?.outline.length ?? 0) > 0
    if (step === 4) return currentProject?.outline.some((s) => !!s.content) ?? false
    return false
  }

  const selectedSection = currentProject?.outline.find((s) => s.id === selectedSectionId)

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <button onClick={handleBack} className="p-2 hover:bg-hover rounded-lg transition">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">{t('docWriter.title')}</h1>
          <p className="text-sm text-text-secondary">{t('docWriter.desc')}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          {STEPS.map((labelKey, i) => {
            const stepNum = i + 1
            const isActive = step === stepNum
            const isDone = step > stepNum
            return (
              <div key={labelKey} className="flex items-center gap-2">
                {i > 0 && <div className={`w-8 h-0.5 ${isDone ? 'bg-primary' : 'bg-border'}`} />}
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                      isDone
                        ? 'bg-green-500 text-white'
                        : isActive
                          ? 'bg-primary text-white'
                          : 'bg-hover text-text-tertiary'
                    }`}
                  >
                    {isDone ? '✓' : stepNum}
                  </div>
                  <span className={`text-xs ${isActive ? 'text-text-primary font-medium' : 'text-text-tertiary'}`}>
                    {t(labelKey as any)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Step 1: Project setup */}
        {step === 1 && (
          <div className="max-w-xl space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">{t('docWriter.projectName')}</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder={t('docWriter.projectName')}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">{t('docWriter.docType')}</label>
              <div className="grid grid-cols-2 gap-2">
                {DOC_TYPES.map((dt) => (
                  <button
                    key={dt.id}
                    onClick={() => setDocType(dt.id)}
                    className={`px-4 py-3 rounded-lg border text-sm font-medium transition ${
                      docType === dt.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-surface text-text-secondary hover:bg-hover'
                    }`}
                  >
                    {t(dt.labelKey as any)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">{t('settings.api.defaultModel')}</label>
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Context */}
        {step === 2 && (
          <div className="max-w-xl space-y-4">
            <label className="block text-sm font-medium text-text-primary">{t('docWriter.context')}</label>
            <textarea
              value={currentProject?.context ?? ''}
              onChange={(e) => setContext(e.target.value)}
              placeholder={t('docWriter.context')}
              rows={12}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <p className="text-xs text-text-tertiary">{t('docWriter.context.fileHint')}</p>
          </div>
        )}

        {/* Step 3: Outline */}
        {step === 3 && (
          <div className="max-w-xl space-y-4">
            <div className="flex items-center gap-2">
              <Button onClick={handleGenerateOutline} disabled={isGenerating}>
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                {currentProject?.outline.length
                  ? t('docWriter.regenerateOutline')
                  : t('docWriter.generateOutline')}
              </Button>
            </div>

            {currentProject?.outline.length ? (
              <div className="space-y-1 mt-4">
                {currentProject.outline.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-hover group"
                    style={{ paddingLeft: `${section.level * 16 + 12}px` }}
                  >
                    <FileText size={14} className="text-text-tertiary flex-shrink-0" />
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateOutlineSection(section.id, { title: e.target.value })}
                      className="flex-1 bg-transparent text-sm text-text-primary outline-none"
                    />
                    <button
                      onClick={() => removeOutlineSection(section.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex items-center gap-2 mt-4">
              <input
                type="text"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
                placeholder={t('docWriter.addSection')}
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button variant="secondary" size="sm" onClick={handleAddSection}>
                <Plus size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Content writing */}
        {step === 4 && (
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-text-primary">{t('docWriter.selectSection')}</label>
              <select
                value={selectedSectionId ?? ''}
                onChange={(e) => setSelectedSectionId(e.target.value || null)}
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{t('docWriter.selectSection')}</option>
                {currentProject?.outline.map((s) => (
                  <option key={s.id} value={s.id}>
                    {'  '.repeat(s.level - 1)}{s.title}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={handleGenerateSectionContent}
                disabled={!selectedSectionId || isGenerating}
              >
                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : null}
                {selectedSection?.content ? t('docWriter.regenerateContent') : t('docWriter.generateContent')}
              </Button>
            </div>

            {selectedSection && (
              <textarea
                value={selectedSection.content ?? ''}
                onChange={(e) => updateSectionContent(selectedSectionId!, e.target.value)}
                rows={16}
                className="w-full px-4 py-3 border border-border rounded-lg bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono"
                placeholder={t('docWriter.generateContent')}
              />
            )}
          </div>
        )}

        {/* Step 5: Export */}
        {step === 5 && (
          <div className="max-w-3xl space-y-4">
            <h3 className="text-lg font-semibold text-text-primary">{t('docWriter.preview')}</h3>
            <div className="border border-border rounded-lg bg-surface p-6 max-h-[60vh] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-text-primary font-mono">
                {exportMarkdown()}
              </pre>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleDownloadMd}>
                <Download size={16} />
                {t('docWriter.downloadMd')}
              </Button>
              <Button variant="secondary" onClick={handleDownloadTxt}>
                <Download size={16} />
                {t('docWriter.downloadTxt')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-6 py-4 border-t border-border flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => {
            if (step === 1) {
              handleBack()
            } else {
              setStep(step - 1)
            }
          }}
        >
          <ChevronLeft size={16} />
          {t('docWriter.prev')}
        </Button>
        {step < 5 ? (
          <Button
            onClick={() => {
              if (step === 1 && !currentProject) {
                handleCreateProject()
              } else {
                setStep(step + 1)
              }
            }}
            disabled={!canGoNext() && step !== 2}
          >
            {t('docWriter.next')}
            <ChevronRight size={16} />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
