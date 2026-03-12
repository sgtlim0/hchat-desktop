import { useEffect, useState } from 'react'
import { Mail, Plus, Trash2, ChevronLeft, User, Send } from 'lucide-react'
import { useEmailAssistantStore } from '@/entities/email-assistant/email-assistant.store'
import { useTranslation } from '@/shared/i18n'
import type { EmailDraft, EmailTone } from '@/shared/types'

const TONE_OPTIONS: { value: EmailTone; label: string; color: string }[] = [
  { value: 'formal', label: 'emailAssistant.formal', color: 'text-blue-500' },
  { value: 'casual', label: 'emailAssistant.casual', color: 'text-green-500' },
  { value: 'friendly', label: 'emailAssistant.friendly', color: 'text-amber-500' },
  { value: 'professional', label: 'emailAssistant.professional', color: 'text-purple-500' },
]

export function EmailAssistantPage() {
  const { t } = useTranslation()
  const drafts = useEmailAssistantStore((s) => s.drafts)
  const selectedDraftId = useEmailAssistantStore((s) => s.selectedDraftId)
  const hydrate = useEmailAssistantStore((s) => s.hydrate)
  const createDraft = useEmailAssistantStore((s) => s.createDraft)
  const updateBody = useEmailAssistantStore((s) => s.updateBody)
  const deleteDraft = useEmailAssistantStore((s) => s.deleteDraft)
  const selectDraft = useEmailAssistantStore((s) => s.selectDraft)

  const [showCreate, setShowCreate] = useState(false)
  const [subject, setSubject] = useState('')
  const [recipient, setRecipient] = useState('')
  const [tone, setTone] = useState<EmailTone>('formal')

  useEffect(() => { hydrate() }, [hydrate])

  const selected: EmailDraft | undefined = drafts.find((d) => d.id === selectedDraftId)
  const toneConfig = TONE_OPTIONS.find((o) => o.value === selected?.tone)

  const handleCreate = () => {
    if (!subject.trim() || !recipient.trim()) return
    createDraft(subject.trim(), recipient.trim(), tone)
    setSubject('')
    setRecipient('')
    setShowCreate(false)
  }

  const handleCopy = () => {
    if (!selected) return
    const text = `To: ${selected.recipient}\nSubject: ${selected.subject}\n\n${selected.body}`
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />{t('emailAssistant.title')}
        </h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm">
          <Plus className="w-4 h-4" />{t('emailAssistant.create')}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Draft List */}
        <div className={`${selected ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 border-r border-border overflow-y-auto`}>
          {drafts.length === 0 && <p className="text-center text-text-tertiary text-sm py-12">{t('emailAssistant.empty')}</p>}
          {drafts.map((draft) => {
            const draftTone = TONE_OPTIONS.find((o) => o.value === draft.tone)
            return (
              <button key={draft.id} onClick={() => selectDraft(draft.id)}
                className={`text-left px-4 py-3 border-b border-border hover:bg-surface-secondary transition-colors ${selectedDraftId === draft.id ? 'bg-surface-secondary' : ''}`}>
                <h3 className="font-semibold text-text-primary text-sm truncate">{draft.subject}</h3>
                <div className="flex items-center gap-2 text-xs mt-1">
                  <span className="flex items-center gap-1 text-text-tertiary">
                    <User className="w-3 h-3" />{draft.recipient}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs mt-1">
                  <span className={draftTone?.color}>{t(`emailAssistant.${draft.tone}` as Parameters<typeof t>[0])}</span>
                  {draft.isReply && <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[10px]">{t('emailAssistant.reply')}</span>}
                </div>
                <p className="text-xs text-text-tertiary mt-1">{new Date(draft.createdAt).toLocaleDateString()}</p>
              </button>
            )
          })}
        </div>

        {/* Editor */}
        {selected ? (
          <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <button onClick={() => selectDraft(null)} className="md:hidden p-1 rounded hover:bg-surface-secondary">
                <ChevronLeft className="w-5 h-5 text-text-secondary" />
              </button>
              <div className="flex-1 ml-2 md:ml-0">
                <h2 className="font-bold text-text-primary">{selected.subject}</h2>
                <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{selected.recipient}</span>
                  <span className={toneConfig?.color}>{t(`emailAssistant.${selected.tone}` as Parameters<typeof t>[0])}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={handleCopy} className="p-1.5 rounded hover:bg-surface-secondary" title={t('common.copy')}>
                  <Send className="w-4 h-4 text-primary" />
                </button>
                <button onClick={() => { deleteDraft(selected.id) }} className="p-1.5 rounded hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>

            {/* Email Header Preview */}
            <div className="p-3 rounded-lg bg-surface-secondary border border-border text-sm space-y-1">
              <div className="flex gap-2">
                <span className="text-text-tertiary w-12">{t('emailAssistant.to')}:</span>
                <span className="text-text-primary">{selected.recipient}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-text-tertiary w-12">{t('emailAssistant.subject')}:</span>
                <span className="text-text-primary font-medium">{selected.subject}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-text-tertiary w-12">{t('emailAssistant.tone')}:</span>
                <span className={toneConfig?.color}>{t(`emailAssistant.${selected.tone}` as Parameters<typeof t>[0])}</span>
              </div>
            </div>

            {/* Body Editor */}
            <textarea
              value={selected.body}
              onChange={(e) => updateBody(selected.id, e.target.value)}
              placeholder={t('emailAssistant.bodyPlaceholder')}
              className="w-full flex-1 min-h-[250px] px-4 py-3 text-sm rounded-lg bg-surface-secondary border border-border resize-y leading-relaxed"
            />

            {selected.originalThread && (
              <div className="p-3 rounded-lg bg-surface-secondary border border-dashed border-border">
                <h4 className="text-xs font-semibold text-text-secondary mb-1">{t('emailAssistant.originalThread')}</h4>
                <p className="text-xs text-text-tertiary whitespace-pre-wrap">{selected.originalThread}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-text-tertiary text-sm">
            {t('emailAssistant.selectDraft')}
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
            <h3 className="font-semibold text-text-primary">{t('emailAssistant.create')}</h3>
            <input value={recipient} onChange={(e) => setRecipient(e.target.value)}
              placeholder={t('emailAssistant.recipientPlaceholder')} className="w-full px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border"
               
              autoFocus />
            <input value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder={t('emailAssistant.subjectPlaceholder')} className="w-full px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
            <select value={tone} onChange={(e) => setTone(e.target.value as EmailTone)}
              className="w-full text-sm rounded-lg bg-surface-secondary border border-border px-3 py-2">
              {TONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{t(opt.label as Parameters<typeof t>[0])}</option>
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
