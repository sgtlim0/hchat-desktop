import { useEffect, useState } from 'react'
import { Presentation as PresentationIcon, Plus, Trash2, ChevronLeft, GripVertical, StickyNote } from 'lucide-react'
import { usePresentationStore } from '@/entities/presentation/presentation.store'
import { useTranslation } from '@/shared/i18n'
import type { Presentation } from '@/shared/types'

const TEMPLATE_OPTIONS: { value: Presentation['template']; label: string }[] = [
  { value: 'education', label: 'presentation.minimal' },
  { value: 'business', label: 'presentation.business' },
  { value: 'summary', label: 'presentation.creative' },
  { value: 'tech', label: 'presentation.academic' },
]

export function PresentationPage() {
  const { t } = useTranslation()
  const presentations = usePresentationStore((s) => s.presentations)
  const selectedPresentationId = usePresentationStore((s) => s.selectedPresentationId)
  const hydrate = usePresentationStore((s) => s.hydrate)
  const createPresentation = usePresentationStore((s) => s.createPresentation)
  const deletePresentation = usePresentationStore((s) => s.deletePresentation)
  const addSlide = usePresentationStore((s) => s.addSlide)
  const updateSlide = usePresentationStore((s) => s.updateSlide)
  const removeSlide = usePresentationStore((s) => s.removeSlide)
  const selectPresentation = usePresentationStore((s) => s.selectPresentation)

  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [template, setTemplate] = useState<Presentation['template']>('education')
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null)

  useEffect(() => { hydrate() }, [hydrate])

  const selected = presentations.find((p) => p.id === selectedPresentationId)
  const selectedSlide = selected?.slides.find((s) => s.id === selectedSlideId)

  useEffect(() => {
    if (selected && selected.slides.length > 0 && !selectedSlideId) {
      setSelectedSlideId(selected.slides[0].id)
    }
  }, [selected, selectedSlideId])

  const handleCreate = () => {
    if (!title.trim()) return
    createPresentation(title.trim(), template)
    setTitle('')
    setShowCreate(false)
    setSelectedSlideId(null)
  }

  const handleAddSlide = () => {
    if (!selected) return
    addSlide(selected.id, `Slide ${selected.slides.length + 1}`, '', '')
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <PresentationIcon className="w-5 h-5 text-primary" />{t('presentation.title')}
        </h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm">
          <Plus className="w-4 h-4" />{t('presentation.create')}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Presentation List */}
        {!selected && (
          <div className="flex-1 overflow-y-auto p-6">
            {presentations.length === 0 && <p className="text-center text-text-tertiary text-sm py-12">{t('presentation.empty')}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {presentations.map((pres) => (
                <div key={pres.id} className="p-4 rounded-xl border border-border bg-surface hover:border-primary/40 transition-colors cursor-pointer"
                  onClick={() => { selectPresentation(pres.id); setSelectedSlideId(null) }}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-text-primary text-sm truncate">{pres.title}</h3>
                    <button onClick={(e) => { e.stopPropagation(); deletePresentation(pres.id) }} className="p-1 rounded hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className="text-primary">{pres.template}</span>
                    <span>{pres.slides.length} {t('presentation.slides')}</span>
                  </div>
                  <p className="text-xs text-text-tertiary mt-1">{new Date(pres.updatedAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Slide Editor */}
        {selected && (
          <>
            {/* Slide Sidebar */}
            <div className="w-48 border-r border-border overflow-y-auto bg-surface-secondary/50 flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <button onClick={() => { selectPresentation(null); setSelectedSlideId(null) }}
                  className="p-1 rounded hover:bg-surface-secondary">
                  <ChevronLeft className="w-4 h-4 text-text-secondary" />
                </button>
                <span className="text-xs text-text-secondary font-medium truncate flex-1 ml-2">{selected.title}</span>
                <button onClick={handleAddSlide} className="p-1 rounded hover:bg-primary/10">
                  <Plus className="w-4 h-4 text-primary" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {selected.slides.map((slide, idx) => (
                  <button key={slide.id} onClick={() => setSelectedSlideId(slide.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${selectedSlideId === slide.id ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-surface-secondary'}`}>
                    <GripVertical className="w-3 h-3 text-text-tertiary shrink-0" />
                    <span className="truncate">{idx + 1}. {slide.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Slide Content */}
            <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-4">
              {selectedSlide ? (
                <>
                  <div className="flex items-center justify-between">
                    <input
                      value={selectedSlide.title}
                      onChange={(e) => updateSlide(selected.id, selectedSlide.id, { title: e.target.value })}
                      className="text-lg font-bold text-text-primary bg-transparent border-none outline-none flex-1"
                      placeholder={t('presentation.slideTitle')}
                    />
                    <button onClick={() => { removeSlide(selected.id, selectedSlide.id); setSelectedSlideId(null) }}
                      className="p-1.5 rounded hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>

                  <textarea
                    value={selectedSlide.content}
                    onChange={(e) => updateSlide(selected.id, selectedSlide.id, { content: e.target.value })}
                    placeholder={t('presentation.contentPlaceholder')}
                    className="w-full flex-1 min-h-[200px] px-4 py-3 text-sm rounded-lg bg-surface-secondary border border-border resize-y"
                  />

                  <div>
                    <h4 className="text-sm font-semibold text-text-primary flex items-center gap-1.5 mb-2">
                      <StickyNote className="w-4 h-4" />{t('presentation.speakerNotes')}
                    </h4>
                    <textarea
                      value={selectedSlide.notes}
                      onChange={(e) => updateSlide(selected.id, selectedSlide.id, { notes: e.target.value })}
                      placeholder={t('presentation.notesPlaceholder')}
                      className="w-full min-h-[80px] px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border resize-y"
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">
                  {t('presentation.selectSlide')}
                </div>
              )}
            </div>
          </>
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
            <h3 className="font-semibold text-text-primary">{t('presentation.create')}</h3>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={t('presentation.titlePlaceholder')} className="w-full px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
            <select value={template} onChange={(e) => setTemplate(e.target.value as Presentation['template'])}
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
