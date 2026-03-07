import { useEffect, useState } from 'react'
import { FileBarChart, Plus, Trash2, ChevronLeft, GitBranch, Copy } from 'lucide-react'
import { useReportGeneratorStore } from '@/entities/report-generator/report-generator.store'
import { useTranslation } from '@/shared/i18n'
import type { Report, ReportTemplate } from '@/shared/types'

const TEMPLATE_OPTIONS: { value: ReportTemplate; label: string }[] = [
  { value: 'weekly', label: 'reportGenerator.weekly' },
  { value: 'monthly', label: 'reportGenerator.monthly' },
  { value: 'project', label: 'reportGenerator.project' },
  { value: 'custom', label: 'reportGenerator.analysis' },
]

const TEMPLATE_COLORS: Record<ReportTemplate, string> = {
  weekly: 'text-blue-500',
  monthly: 'text-purple-500',
  project: 'text-amber-500',
  custom: 'text-green-500',
}

export function ReportGeneratorPage() {
  const { t } = useTranslation()
  const reports = useReportGeneratorStore((s) => s.reports)
  const hydrate = useReportGeneratorStore((s) => s.hydrate)
  const createReport = useReportGeneratorStore((s) => s.createReport)
  const deleteReport = useReportGeneratorStore((s) => s.deleteReport)
  const updateContent = useReportGeneratorStore((s) => s.updateContent)
  const incrementVersion = useReportGeneratorStore((s) => s.incrementVersion)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [template, setTemplate] = useState<ReportTemplate>('weekly')

  useEffect(() => { hydrate() }, [hydrate])

  const selected: Report | undefined = reports.find((r) => r.id === selectedId)

  const handleCreate = async () => {
    if (!title.trim()) return
    await createReport(title.trim(), template)
    setTitle('')
    setShowCreate(false)
  }

  const handleCopyContent = () => {
    if (!selected) return
    navigator.clipboard.writeText(selected.content)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <FileBarChart className="w-5 h-5 text-primary" />{t('reportGenerator.title')}
        </h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm">
          <Plus className="w-4 h-4" />{t('reportGenerator.create')}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Report List */}
        <div className={`${selected ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 border-r border-border overflow-y-auto`}>
          {reports.length === 0 && <p className="text-center text-text-tertiary text-sm py-12">{t('reportGenerator.empty')}</p>}
          {reports.map((report) => (
            <button key={report.id} onClick={() => setSelectedId(report.id)}
              className={`text-left px-4 py-3 border-b border-border hover:bg-surface-secondary transition-colors ${selectedId === report.id ? 'bg-surface-secondary' : ''}`}>
              <h3 className="font-semibold text-text-primary text-sm truncate">{report.title}</h3>
              <div className="flex items-center gap-2 text-xs mt-1">
                <span className={TEMPLATE_COLORS[report.template]}>{t(`reportGenerator.${report.template}`)}</span>
                <span className="text-text-tertiary">v{report.version}</span>
              </div>
              <p className="text-xs text-text-tertiary mt-1">{new Date(report.updatedAt).toLocaleDateString()}</p>
            </button>
          ))}
        </div>

        {/* Editor */}
        {selected ? (
          <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedId(null)} className="md:hidden p-1 rounded hover:bg-surface-secondary">
                  <ChevronLeft className="w-5 h-5 text-text-secondary" />
                </button>
                <h2 className="font-bold text-text-primary">{selected.title}</h2>
                <span className="text-xs px-2 py-0.5 bg-surface-secondary rounded-full text-text-secondary">v{selected.version}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={handleCopyContent} className="p-1.5 rounded hover:bg-surface-secondary" title={t('common.copy')}>
                  <Copy className="w-4 h-4 text-text-secondary" />
                </button>
                <button onClick={() => incrementVersion(selected.id)} className="p-1.5 rounded hover:bg-surface-secondary" title={t('reportGenerator.newVersion')}>
                  <GitBranch className="w-4 h-4 text-primary" />
                </button>
                <button onClick={() => { deleteReport(selected.id); setSelectedId(null) }} className="p-1.5 rounded hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <span className={TEMPLATE_COLORS[selected.template]}>{t(`reportGenerator.${selected.template}`)}</span>
              <span>{t('reportGenerator.lastUpdated')}: {new Date(selected.updatedAt).toLocaleString()}</span>
            </div>

            <textarea
              value={selected.content}
              onChange={(e) => updateContent(selected.id, e.target.value)}
              placeholder={t('reportGenerator.contentPlaceholder')}
              className="w-full flex-1 min-h-[300px] px-4 py-3 text-sm rounded-lg bg-surface-secondary border border-border resize-y font-mono leading-relaxed"
            />
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-text-tertiary text-sm">
            {t('reportGenerator.selectReport')}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCreate(false)}>
          <div className="bg-surface rounded-xl p-6 w-80 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-text-primary">{t('reportGenerator.create')}</h3>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={t('reportGenerator.titlePlaceholder')} className="w-full px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border" autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
            <select value={template} onChange={(e) => setTemplate(e.target.value as ReportTemplate)}
              className="w-full text-sm rounded-lg bg-surface-secondary border border-border px-3 py-2">
              {TEMPLATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{(t as any)(opt.label)}</option>
              ))}
            </select>
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
