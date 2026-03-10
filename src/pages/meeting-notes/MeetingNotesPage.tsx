import { useEffect, useState } from 'react'
import { FileText, Plus, Trash2, Users, CheckSquare, Square, ChevronLeft, X } from 'lucide-react'
import { useMeetingNotesStore } from '@/entities/meeting-notes/meeting-notes.store'
import { useTranslation } from '@/shared/i18n'
import type { MeetingNote, MeetingTemplate } from '@/shared/types'

const TEMPLATE_OPTIONS: { value: MeetingTemplate; label: string }[] = [
  { value: 'standup', label: 'meetingNotes.standup' },
  { value: 'brainstorm', label: 'meetingNotes.brainstorm' },
  { value: 'decision', label: 'meetingNotes.decision' },
  { value: 'retrospective', label: 'meetingNotes.retrospective' },
]

const TEMPLATE_COLORS: Record<MeetingTemplate, string> = {
  standup: 'text-blue-500',
  brainstorm: 'text-purple-500',
  decision: 'text-amber-500',
  retrospective: 'text-green-500',
}

export function MeetingNotesPage() {
  const { t } = useTranslation()
  const notes = useMeetingNotesStore((s) => s.notes)
  const hydrate = useMeetingNotesStore((s) => s.hydrate)
  const createNote = useMeetingNotesStore((s) => s.createNote)
  const deleteNote = useMeetingNotesStore((s) => s.deleteNote)
  const updateContent = useMeetingNotesStore((s) => s.updateContent)
  const addActionItem = useMeetingNotesStore((s) => s.addActionItem)
  const toggleActionItem = useMeetingNotesStore((s) => s.toggleActionItem)
  const addParticipant = useMeetingNotesStore((s) => s.addParticipant)
  const removeParticipant = useMeetingNotesStore((s) => s.removeParticipant)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [template, setTemplate] = useState<MeetingTemplate>('standup')
  const [newParticipant, setNewParticipant] = useState('')
  const [newAction, setNewAction] = useState('')

  useEffect(() => { hydrate() }, [hydrate])

  const selected: MeetingNote | undefined = notes.find((n) => n.id === selectedId)

  const handleCreate = async () => {
    if (!title.trim()) return
    await createNote(title.trim(), template)
    setTitle('')
    setShowCreate(false)
  }

  const handleAddParticipant = async () => {
    if (!selected || !newParticipant.trim()) return
    await addParticipant(selected.id, newParticipant.trim())
    setNewParticipant('')
  }

  const handleAddAction = async () => {
    if (!selected || !newAction.trim()) return
    await addActionItem(selected.id, { text: newAction.trim(), assignee: '' })
    setNewAction('')
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />{t('meetingNotes.title')}
        </h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm">
          <Plus className="w-4 h-4" />{t('meetingNotes.create')}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Note List */}
        <div className={`${selected ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 border-r border-border overflow-y-auto`}>
          {notes.length === 0 && <p className="text-center text-text-tertiary text-sm py-12">{t('meetingNotes.empty')}</p>}
          {notes.map((note) => (
            <button key={note.id} onClick={() => setSelectedId(note.id)}
              className={`text-left px-4 py-3 border-b border-border hover:bg-surface-secondary transition-colors ${selectedId === note.id ? 'bg-surface-secondary' : ''}`}>
              <h3 className="font-semibold text-text-primary text-sm truncate">{note.title}</h3>
              <div className="flex items-center gap-2 text-xs mt-1">
                <span className={TEMPLATE_COLORS[note.template]}>{t(`meetingNotes.${note.template}` as Parameters<typeof t>[0])}</span>
                <span className="text-text-tertiary">{note.participants.length} {t('meetingNotes.participants')}</span>
              </div>
              <p className="text-xs text-text-tertiary mt-1">{new Date(note.createdAt).toLocaleDateString()}</p>
            </button>
          ))}
        </div>

        {/* Detail View */}
        {selected ? (
          <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setSelectedId(null)} className="md:hidden p-1 rounded hover:bg-surface-secondary">
                <ChevronLeft className="w-5 h-5 text-text-secondary" />
              </button>
              <h2 className="font-bold text-text-primary flex-1 ml-2 md:ml-0">{selected.title}</h2>
              <button onClick={() => { deleteNote(selected.id); setSelectedId(null) }} className="p-1.5 rounded hover:bg-red-500/10">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>

            {/* Content */}
            <textarea
              value={selected.content}
              onChange={(e) => updateContent(selected.id, e.target.value)}
              placeholder={t('meetingNotes.contentPlaceholder')}
              className="w-full min-h-[120px] px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border resize-y"
            />

            {/* Participants */}
            <div>
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5 mb-2">
                <Users className="w-4 h-4" />{t('meetingNotes.participants')}
              </h3>
              <div className="flex flex-wrap gap-2 mb-2">
                {selected.participants.map((p) => (
                  <span key={p} className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                    {p}
                    <button onClick={() => removeParticipant(selected.id, p)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newParticipant} onChange={(e) => setNewParticipant(e.target.value)}
                  placeholder={t('meetingNotes.addParticipant')} className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-surface-secondary border border-border"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant()} />
                <button onClick={handleAddParticipant} className="px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Items */}
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">{t('meetingNotes.actionItems')}</h3>
              <div className="space-y-1 mb-2">
                {selected.actionItems.map((item) => (
                  <button key={item.id} onClick={() => toggleActionItem(selected.id, item.id)}
                    className="flex items-center gap-2 w-full text-left px-2 py-1 rounded hover:bg-surface-secondary text-sm">
                    {item.done ? <CheckSquare className="w-4 h-4 text-green-500 shrink-0" /> : <Square className="w-4 h-4 text-text-tertiary shrink-0" />}
                    <span className={item.done ? 'line-through text-text-tertiary' : 'text-text-primary'}>{item.text}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newAction} onChange={(e) => setNewAction(e.target.value)}
                  placeholder={t('meetingNotes.addAction')} className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-surface-secondary border border-border"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAction()} />
                <button onClick={handleAddAction} className="px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-text-tertiary text-sm">
            {t('meetingNotes.selectNote')}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCreate(false)}>
          <div className="bg-surface rounded-xl p-6 w-80 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-text-primary">{t('meetingNotes.create')}</h3>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={t('meetingNotes.titlePlaceholder')} className="w-full px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border" autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
            <select value={template} onChange={(e) => setTemplate(e.target.value as MeetingTemplate)}
              className="w-full text-sm rounded-lg bg-surface-secondary border border-border px-3 py-2">
              {TEMPLATE_OPTIONS.map((opt) => (
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
