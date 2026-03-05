import { useState, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ArrowLeft, Plus, Copy, Trash2, Code, Star, Search } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useSnippetStore } from '@/entities/snippet/snippet.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'

const LANGUAGES = [
  '', 'javascript', 'typescript', 'python', 'java', 'go', 'rust',
  'html', 'css', 'sql', 'bash', 'json', 'yaml', 'other',
]

export function SnippetPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const {
    snippets,
    searchQuery,
    selectedLanguage,
    selectedSnippetId,
    hydrate,
    addSnippet,
    deleteSnippet,
    setSearchQuery,
    setLanguage,
    selectSnippet,
    incrementUsage,
    toggleFavorite,
    getFilteredSnippets,
  } = useSnippetStore(
    useShallow((s) => ({
      snippets: s.snippets,
      searchQuery: s.searchQuery,
      selectedLanguage: s.selectedLanguage,
      selectedSnippetId: s.selectedSnippetId,
      hydrate: s.hydrate,
      addSnippet: s.addSnippet,
      deleteSnippet: s.deleteSnippet,
      setSearchQuery: s.setSearchQuery,
      setLanguage: s.setLanguage,
      selectSnippet: s.selectSnippet,
      incrementUsage: s.incrementUsage,
      toggleFavorite: s.toggleFavorite,
      getFilteredSnippets: s.getFilteredSnippets,
    }))
  )

  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newLanguage, setNewLanguage] = useState('javascript')
  const [newCode, setNewCode] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newTags, setNewTags] = useState('')

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const filteredSnippets = getFilteredSnippets()
  const selectedSnippet = snippets.find((s) => s.id === selectedSnippetId) ?? null

  function handleCreate() {
    if (!newTitle.trim() || !newCode.trim()) return

    const tags = newTags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    addSnippet(newTitle.trim(), newLanguage, newCode, newDescription.trim(), tags)
    setShowModal(false)
    resetForm()
  }

  function resetForm() {
    setNewTitle('')
    setNewLanguage('javascript')
    setNewCode('')
    setNewDescription('')
    setNewTags('')
  }

  function handleCopy(code: string, id: string) {
    navigator.clipboard.writeText(code).catch(() => {})
    incrementUsage(id)
  }

  function handleDelete(id: string) {
    if (confirm(t('snippet.deleteConfirm'))) {
      deleteSnippet(id)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b dark:border-zinc-700">
        <button
          onClick={() => setView('home')}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Code className="w-5 h-5" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{t('snippet.title')}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('snippet.subtitle')}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" />
          {t('snippet.new')}
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Filter + List */}
        <div className="w-80 border-r dark:border-zinc-700 flex flex-col overflow-hidden">
          {/* Language Filter */}
          <div className="p-3 border-b dark:border-zinc-700">
            <div className="flex flex-wrap gap-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang || 'all'}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-1 text-xs rounded ${
                    selectedLanguage === lang
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {lang || t('snippet.allLangs')}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="p-3 border-b dark:border-zinc-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('snippet.searchPlaceholder')}
                className="w-full pl-9 pr-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800 text-sm"
              />
            </div>
          </div>

          {/* Snippet List */}
          <div className="flex-1 overflow-auto">
            {filteredSnippets.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center p-4">
                <div>
                  <Code className="w-10 h-10 mx-auto mb-2 text-zinc-400" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('snippet.empty')}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{t('snippet.emptyHint')}</p>
                </div>
              </div>
            ) : (
              <div className="divide-y dark:divide-zinc-700">
                {filteredSnippets.map((snippet) => (
                  <button
                    key={snippet.id}
                    onClick={() => selectSnippet(snippet.id)}
                    className={`w-full text-left p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                      selectedSnippetId === snippet.id ? 'bg-zinc-100 dark:bg-zinc-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate flex-1">{snippet.title}</span>
                      {snippet.isFavorite && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                        {snippet.language}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {t('snippet.usedCount').replace('{count}', String(snippet.usageCount))}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Detail */}
        <div className="flex-1 overflow-auto">
          {selectedSnippet ? (
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedSnippet.title}</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    {selectedSnippet.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFavorite(selectedSnippet.id)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                    title="Favorite"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        selectedSnippet.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-400'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleCopy(selectedSnippet.code, selectedSnippet.id)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                    title={t('snippet.copy')}
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedSnippet.id)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-red-500"
                    title={t('common.delete')}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  {selectedSnippet.language}
                </span>
                {selectedSnippet.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs rounded bg-zinc-100 dark:bg-zinc-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <pre className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border dark:border-zinc-700 overflow-auto text-sm">
                <code>{selectedSnippet.code}</code>
              </pre>

              <div className="mt-4 text-xs text-zinc-400">
                {t('snippet.usedCount').replace('{count}', String(selectedSnippet.usageCount))}
                {' · '}
                {new Date(selectedSnippet.createdAt).toLocaleDateString()}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Code className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                <p className="text-zinc-500 dark:text-zinc-400">{t('snippet.empty')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Snippet Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-lg p-6 m-4">
            <h2 className="text-lg font-semibold mb-4">{t('snippet.new')}</h2>

            <div className="space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t('snippet.titlePlaceholder')}
                className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
              />

              <select
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
              >
                {LANGUAGES.filter(Boolean).map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>

              <textarea
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder={t('snippet.codePlaceholder')}
                rows={8}
                className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800 font-mono text-sm"
              />

              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder={t('snippet.descPlaceholder')}
                className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
              />

              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder={t('snippet.tags')}
                className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
              >
                {t('common.cancel')}
              </Button>
              <Button onClick={handleCreate}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
