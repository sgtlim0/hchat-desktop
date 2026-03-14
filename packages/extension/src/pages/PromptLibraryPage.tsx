import { useState } from 'react'
import { Search, ArrowRight } from 'lucide-react'
import { useTranslation } from '@hchat/shared'
import { useExtSessionStore } from '@ext/stores/session.store'
import { useExtSettingsStore } from '@ext/stores/settings.store'

interface PromptTemplate {
  readonly id: string
  readonly title: string
  readonly content: string
  readonly category: string
}

const BUILT_IN_TEMPLATES: PromptTemplate[] = [
  {
    id: 'code-review',
    title: 'Code Review',
    content: 'Please review the following code for bugs, performance issues, and best practices:\n\n{{code}}',
    category: 'coding',
  },
  {
    id: 'summarize',
    title: 'Summarize Document',
    content: 'Please provide a concise summary of the following text, highlighting the key points:\n\n{{text}}',
    category: 'writing',
  },
  {
    id: 'translate-ko-en',
    title: 'Korean to English',
    content: 'Translate the following Korean text to English. Maintain the original tone and nuance:\n\n{{text}}',
    category: 'translation',
  },
  {
    id: 'translate-en-ko',
    title: 'English to Korean',
    content: 'Translate the following English text to Korean. Use natural and professional language:\n\n{{text}}',
    category: 'translation',
  },
  {
    id: 'explain-code',
    title: 'Explain Code',
    content: 'Please explain the following code step by step, as if explaining to a junior developer:\n\n{{code}}',
    category: 'coding',
  },
  {
    id: 'email-draft',
    title: 'Draft Email',
    content: 'Write a professional email about the following topic:\nTopic: {{topic}}\nTone: {{tone}}',
    category: 'writing',
  },
  {
    id: 'data-analysis',
    title: 'Analyze Data',
    content: 'Analyze the following data and provide insights, trends, and recommendations:\n\n{{data}}',
    category: 'analysis',
  },
  {
    id: 'brainstorm',
    title: 'Brainstorm Ideas',
    content: 'Generate creative ideas for the following topic. Provide at least 5 different approaches:\n\nTopic: {{topic}}',
    category: 'general',
  },
]

const CATEGORIES = ['all', 'coding', 'writing', 'translation', 'analysis', 'general'] as const

export function PromptLibraryPage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const createSession = useExtSessionStore((s) => s.createSession)
  const setPage = useExtSessionStore((s) => s.setPage)
  const selectedModel = useExtSettingsStore((s) => s.selectedModel)

  const filtered = BUILT_IN_TEMPLATES.filter((tmpl) => {
    const matchesSearch =
      !searchQuery ||
      tmpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tmpl.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'all' || tmpl.category === activeCategory
    return matchesSearch && matchesCategory
  })

  function handleUseTemplate(template: PromptTemplate) {
    createSession(selectedModel)
    // Navigate to chat with the template content as a starting point
    // The user can fill in variables manually
    setPage('chat')
  }

  return (
    <div className="flex flex-col h-full">
      <header className="px-3 py-2.5 border-b border-[var(--border)]">
        <h1 className="text-sm font-bold text-[var(--text-primary)] mb-2">
          {t('promptLib.title')}
        </h1>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('promptLib.searchPlaceholder')}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
      </header>

      {/* Category tabs */}
      <div className="flex gap-1 px-3 py-2 overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1 text-[10px] rounded-full whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            {cat === 'all' ? t('allChats.all') : cat}
          </button>
        ))}
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1.5">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-xs text-[var(--text-tertiary)]">
            {t('common.noResults')}
          </div>
        ) : (
          filtered.map((template) => (
            <div
              key={template.id}
              className="border border-[var(--border)] rounded-lg p-2.5 hover:bg-[var(--bg-hover)] transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  {template.title}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--bg-card)] text-[var(--text-tertiary)]">
                  {template.category}
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] line-clamp-2 mb-2">
                {template.content}
              </p>
              <button
                onClick={() => handleUseTemplate(template)}
                className="flex items-center gap-1 text-[10px] text-[var(--primary)] font-medium hover:underline"
              >
                {t('promptLib.use')}
                <ArrowRight size={10} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
