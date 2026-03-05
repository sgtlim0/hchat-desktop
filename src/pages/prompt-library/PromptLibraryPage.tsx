import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Plus, Star, Search, Trash2, Edit3, Play, X } from 'lucide-react'
import { usePromptLibraryStore } from '@/entities/prompt-library/prompt-library.store'
import { useSessionStore } from '@/entities/session/session.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'
import type { PromptCategory, SavedPrompt } from '@/shared/types'
import { extractVariables, fillTemplate } from '@/shared/lib/prompt-template'

const CATEGORIES: PromptCategory[] = ['general', 'coding', 'writing', 'analysis', 'translation', 'custom']

export function PromptLibraryPage() {
  const { t } = useTranslation()
  const { prompts, addPrompt, updatePrompt, deletePrompt, toggleFavorite, incrementUsage } = usePromptLibraryStore(
    useShallow((s) => ({
      prompts: s.prompts,
      addPrompt: s.addPrompt,
      updatePrompt: s.updatePrompt,
      deletePrompt: s.deletePrompt,
      toggleFavorite: s.toggleFavorite,
      incrementUsage: s.incrementUsage,
    }))
  )
  const createSession = useSessionStore((s) => s.createSession)
  const setPendingPrompt = useSessionStore((s) => s.setPendingPrompt)

  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<SavedPrompt | null>(null)
  const [variableModal, setVariableModal] = useState<{ prompt: SavedPrompt; variables: string[] } | null>(null)
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formCategory, setFormCategory] = useState<PromptCategory>('general')
  const [formTags, setFormTags] = useState('')

  const filtered = prompts.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)
    }
    return true
  })

  function resetForm() {
    setFormTitle('')
    setFormContent('')
    setFormCategory('general')
    setFormTags('')
    setEditingPrompt(null)
    setShowForm(false)
  }

  function handleEdit(prompt: SavedPrompt) {
    setEditingPrompt(prompt)
    setFormTitle(prompt.title)
    setFormContent(prompt.content)
    setFormCategory(prompt.category)
    setFormTags(prompt.tags.join(', '))
    setShowForm(true)
  }

  function handleSave() {
    if (!formTitle.trim() || !formContent.trim()) return

    const now = new Date().toISOString()
    const tags = formTags.split(',').map((t) => t.trim()).filter(Boolean)

    if (editingPrompt) {
      updatePrompt(editingPrompt.id, {
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory,
        tags,
      })
    } else {
      addPrompt({
        id: `prompt-${Date.now()}`,
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory,
        tags,
        isFavorite: false,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      })
    }
    resetForm()
  }

  function handleUsePrompt(prompt: SavedPrompt) {
    const variables = extractVariables(prompt.content)
    if (variables.length > 0) {
      setVariableModal({ prompt, variables })
      setVariableValues({})
    } else {
      applyPrompt(prompt, prompt.content)
    }
  }

  function handleApplyVariables() {
    if (!variableModal) return
    const filled = fillTemplate(variableModal.prompt.content, variableValues)
    applyPrompt(variableModal.prompt, filled)
    setVariableModal(null)
    setVariableValues({})
  }

  function applyPrompt(prompt: SavedPrompt, content: string) {
    incrementUsage(prompt.id)
    createSession(prompt.title.slice(0, 50))
    setPendingPrompt(content)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-text-primary">{t('promptLib.title')}</h1>
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            {t('promptLib.new')}
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('promptLib.searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary outline-none focus:border-primary transition"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              selectedCategory === 'all'
                ? 'bg-primary text-white'
                : 'bg-hover text-text-secondary hover:bg-hover'
            }`}
          >
            {t('allChats.all')}
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                selectedCategory === cat
                  ? 'bg-primary text-white'
                  : 'bg-hover text-text-secondary hover:bg-hover'
              }`}
            >
              {t(`promptLib.category.${cat}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Inline form */}
        {showForm && (
          <div className="mb-6 p-4 border border-border rounded-xl bg-surface space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">
                {editingPrompt ? t('common.edit') : t('promptLib.new')}
              </h3>
              <button onClick={resetForm} className="p-1 hover:bg-hover rounded-lg transition">
                <X size={16} className="text-text-secondary" />
              </button>
            </div>
            <input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder={t('promptLib.titlePlaceholder')}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary outline-none focus:border-primary"
            />
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder={t('promptLib.contentPlaceholder')}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary outline-none focus:border-primary resize-none"
            />
            <div className="flex gap-3">
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as PromptCategory)}
                className="px-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{t(`promptLib.category.${cat}`)}</option>
                ))}
              </select>
              <input
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                placeholder={t('promptLib.tagsPlaceholder')}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary outline-none focus:border-primary"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={resetForm}>{t('common.cancel')}</Button>
              <Button variant="primary" onClick={handleSave}>{t('common.save')}</Button>
            </div>
          </div>
        )}

        {/* Prompt cards */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-text-secondary text-sm">
            <p>{t('promptLib.empty')}</p>
            <p className="text-xs mt-1 text-text-tertiary">{t('promptLib.emptyHint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((prompt) => (
              <div
                key={prompt.id}
                className="border border-border rounded-xl p-4 bg-surface hover:border-primary/30 transition space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{prompt.title}</h3>
                    <span className="text-xs text-text-tertiary">{t(`promptLib.category.${prompt.category}`)}</span>
                  </div>
                  <button
                    onClick={() => toggleFavorite(prompt.id)}
                    className="p-1 hover:bg-hover rounded transition"
                  >
                    <Star size={14} className={prompt.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-text-tertiary'} />
                  </button>
                </div>
                <p className="text-xs text-text-secondary line-clamp-3">{prompt.content}</p>
                {prompt.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {prompt.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-hover text-text-tertiary">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-[10px] text-text-tertiary">
                    {t('promptLib.usedCount', { count: String(prompt.usageCount) })}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(prompt)}
                      className="p-1 hover:bg-hover rounded transition"
                      title={t('common.edit')}
                    >
                      <Edit3 size={12} className="text-text-tertiary" />
                    </button>
                    <button
                      onClick={() => deletePrompt(prompt.id)}
                      className="p-1 hover:bg-hover rounded transition"
                      title={t('common.delete')}
                    >
                      <Trash2 size={12} className="text-text-tertiary" />
                    </button>
                    <button
                      onClick={() => handleUsePrompt(prompt)}
                      className="p-1 hover:bg-primary/10 rounded transition"
                      title={t('promptLib.use')}
                    >
                      <Play size={12} className="text-primary" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Variable input modal */}
      {variableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-text-primary">{t('promptLib.fillVariables')}</h3>
            <p className="text-sm text-text-secondary">{variableModal.prompt.title}</p>
            {variableModal.variables.map((v) => (
              <div key={v}>
                <label className="text-xs font-medium text-text-secondary block mb-1">{`{{${v}}}`}</label>
                <input
                  value={variableValues[v] ?? ''}
                  onChange={(e) => setVariableValues({ ...variableValues, [v]: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary outline-none focus:border-primary"
                  placeholder={v}
                />
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setVariableModal(null); setVariableValues({}) }}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" onClick={handleApplyVariables}>
                {t('promptLib.apply')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
