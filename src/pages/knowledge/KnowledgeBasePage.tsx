import { useState, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { BookOpen, Search, Plus, Trash2, FileText, Tag, FolderOpen, X, Upload } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useKnowledgeStore } from '@/entities/knowledge/knowledge.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'
import { extractFileText } from '@/shared/lib/translate'

const ACCEPT_TYPES = '.pdf,.txt,.md,.markdown,.text'

export function KnowledgeBasePage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const {
    documents,
    selectedDocumentId,
    searchQuery,
    searchResults,
    categories,
    selectDocument,
    searchDocuments,
    clearSearch,
    addDocument,
    deleteDocument,
    updateDocument,
  } = useKnowledgeStore(
    useShallow((s) => ({
      documents: s.documents,
      selectedDocumentId: s.selectedDocumentId,
      searchQuery: s.searchQuery,
      searchResults: s.searchResults,
      categories: s.categories,
      selectDocument: s.selectDocument,
      searchDocuments: s.searchDocuments,
      clearSearch: s.clearSearch,
      addDocument: s.addDocument,
      deleteDocument: s.deleteDocument,
      updateDocument: s.updateDocument,
    }))
  )

  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [addMode, setAddMode] = useState<'text' | 'file'>('text')
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newTags, setNewTags] = useState('')
  const [newCategory, setNewCategory] = useState('general')
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedDoc = documents.find((d) => d.id === selectedDocumentId)

  const filteredDocs = documents.filter((doc) =>
    categoryFilter === 'all' ? true : doc.category === categoryFilter
  )

  function handleSearchChange(value: string) {
    searchDocuments(value)
  }

  function handleClearSearch() {
    clearSearch()
  }

  function handleSelectDoc(id: string) {
    selectDocument(id)
    clearSearch()
  }

  async function handleAddDocument() {
    if (!newTitle.trim() || !newContent.trim()) return

    const tags = newTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    addDocument(newTitle, newContent, 'text', newContent.length, tags, newCategory)

    setNewTitle('')
    setNewContent('')
    setNewTags('')
    setNewCategory('general')
    setShowAddModal(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    try {
      const content = await extractFileText(file)
      setNewContent(content)
      setNewTitle(file.name.replace(/\.(pdf|txt|md|markdown|text)$/i, ''))
      setAddMode('text')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to extract text'
      alert(msg)
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function handleDeleteDoc(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm(t('knowledge.confirmDelete'))) {
      deleteDocument(id)
    }
  }

  function handleUpdateTags(docId: string, tagsStr: string) {
    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    updateDocument(docId, { tags })
  }

  function handleUpdateCategory(docId: string, category: string) {
    updateDocument(docId, { category })
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('home')}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-hover transition text-text-tertiary hover:text-text-primary"
            >
              <X size={18} />
            </button>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">{t('knowledge.title')}</h1>
              <p className="text-xs text-text-tertiary">{t('knowledge.subtitle')}</p>
            </div>
          </div>
          <Button variant="primary" size="sm" className="gap-1.5" onClick={() => setShowAddModal(true)}>
            <Plus size={14} />
            {t('knowledge.addDocument')}
          </Button>
        </div>
      </div>

      {/* Search + Category Filter */}
      <div className="flex-shrink-0 px-6 py-3 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder={t('knowledge.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-10 py-2 rounded-lg border border-border bg-input text-text-primary text-sm outline-none focus:border-primary transition placeholder:text-text-tertiary"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              categoryFilter === 'all'
                ? 'bg-primary text-white'
                : 'bg-card text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('knowledge.categoryAll')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                categoryFilter === cat
                  ? 'bg-primary text-white'
                  : 'bg-card text-text-secondary hover:text-text-primary'
              }`}
            >
              {t(`knowledge.category_${cat}` as keyof typeof import('@/shared/i18n/ko').default)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-2">
        {searchQuery && searchResults.length > 0 ? (
          // Search Results
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-text-primary mb-2">
              {t('knowledge.searchResults', { count: searchResults.length })}
            </h2>
            {searchResults.map((result) => {
              const doc = result.document

              const highlightText = (text: string, query: string) => {
                const idx = text.toLowerCase().indexOf(query.toLowerCase())
                if (idx === -1) return text

                const start = Math.max(0, idx - 50)
                const end = Math.min(text.length, idx + query.length + 150)
                let snippet = text.slice(start, end)
                if (start > 0) snippet = '...' + snippet
                if (end < text.length) snippet = snippet + '...'

                const parts = snippet.split(new RegExp(`(${query})`, 'gi'))
                return parts.map((part, i) =>
                  part.toLowerCase() === query.toLowerCase() ? (
                    <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-text-primary">
                      {part}
                    </mark>
                  ) : (
                    part
                  )
                )
              }

              return (
                <div
                  key={result.chunk.id}
                  role="button"
                  tabIndex={0}
                  className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition cursor-pointer"
                  onClick={() => handleSelectDoc(doc.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleSelectDoc(doc.id)
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <FileText size={16} className="text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary mb-1">{doc.title}</p>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {highlightText(result.chunk.content, searchQuery)}
                      </p>
                      <p className="text-[10px] text-text-tertiary mt-2">
                        Chunk {result.chunk.index + 1} of {doc.chunks.length}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : filteredDocs.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen size={32} className="text-primary/50" />
            </div>
            <p className="text-text-secondary text-sm font-medium">{t('knowledge.empty')}</p>
            <p className="text-text-tertiary text-xs mt-1">{t('knowledge.emptyHint')}</p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4 gap-1.5"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={14} />
              {t('knowledge.addDocument')}
            </Button>
          </div>
        ) : (
          // Document List
          <div className="space-y-3">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectDoc(doc.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelectDoc(doc.id)
                  }
                }}
                className={`bg-card border rounded-xl p-4 transition cursor-pointer ${
                  selectedDocumentId === doc.id
                    ? 'border-primary shadow-sm'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <FileText size={18} className="text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary mb-2">{doc.title}</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {doc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs"
                          >
                            <Tag size={10} />
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-text-tertiary">
                        {doc.chunks.length} chunks · {formatBytes(doc.fileSize)} ·{' '}
                        {new Date(doc.updatedAt).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteDoc(doc.id, e)}
                    className="p-1.5 hover:bg-danger/10 rounded-lg transition text-text-tertiary hover:text-danger flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Document Detail */}
        {selectedDoc && !searchQuery && (
          <div className="mt-6 bg-card border border-border rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <FolderOpen size={18} className="text-primary" />
                <h2 className="text-lg font-bold text-text-primary">{selectedDoc.title}</h2>
              </div>
              <button
                onClick={() => selectDocument(null)}
                className="p-1.5 hover:bg-hover rounded-lg transition text-text-tertiary hover:text-text-primary"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Tags */}
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-2 flex items-center gap-1.5">
                  <Tag size={12} />
                  {t('knowledge.tags')}
                </label>
                <input
                  type="text"
                  value={selectedDoc.tags.join(', ')}
                  onChange={(e) => handleUpdateTags(selectedDoc.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-text-primary text-sm outline-none focus:border-primary transition"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-2 flex items-center gap-1.5">
                  <FolderOpen size={12} />
                  {t('knowledge.category')}
                </label>
                <select
                  value={selectedDoc.category}
                  onChange={(e) => handleUpdateCategory(selectedDoc.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-text-primary text-sm outline-none focus:border-primary transition"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {t(`knowledge.category_${cat}` as keyof typeof import('@/shared/i18n/ko').default)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content Preview */}
              <div>
                <p className="text-xs font-semibold text-text-secondary mb-2">{t('knowledge.preview')}</p>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-page p-4">
                  <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {selectedDoc.content.slice(0, 1000)}
                    {selectedDoc.content.length > 1000 && '...'}
                  </p>
                </div>
              </div>

              {/* Chunks */}
              <div>
                <p className="text-xs font-semibold text-text-secondary mb-2">{t('knowledge.chunks')}</p>
                <div className="space-y-2">
                  {selectedDoc.chunks.slice(0, 5).map((chunk) => (
                    <div key={chunk.id} className="rounded-lg border border-border bg-page p-3">
                      <p className="text-[10px] text-text-tertiary mb-1">Chunk {chunk.index + 1}</p>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {chunk.content.slice(0, 150)}
                        {chunk.content.length > 150 && '...'}
                      </p>
                    </div>
                  ))}
                  {selectedDoc.chunks.length > 5 && (
                    <p className="text-xs text-text-tertiary text-center py-2">
                      +{selectedDoc.chunks.length - 5} more chunks
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-text-primary">{t('knowledge.addDocument')}</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-hover rounded-lg transition text-text-tertiary hover:text-text-primary"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setAddMode('text')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    addMode === 'text'
                      ? 'bg-primary text-white'
                      : 'bg-page text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <FileText size={14} className="inline mr-2" />
                  {t('knowledge.addText')}
                </button>
                <button
                  onClick={() => setAddMode('file')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    addMode === 'file'
                      ? 'bg-primary text-white'
                      : 'bg-page text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Upload size={14} className="inline mr-2" />
                  {t('knowledge.uploadFile')}
                </button>
              </div>

              {addMode === 'file' ? (
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                  <Upload size={32} className="mx-auto text-text-tertiary mb-3" />
                  <p className="text-sm text-text-secondary mb-2">{t('knowledge.uploadHint')}</p>
                  <p className="text-xs text-text-tertiary mb-4">PDF, TXT, MD</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPT_TYPES}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                  >
                    {isProcessing ? t('common.processing') : t('knowledge.chooseFile')}
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold text-text-secondary mb-2 block">
                      {t('knowledge.docTitle')}
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-input text-text-primary text-sm outline-none focus:border-primary transition"
                      placeholder={t('knowledge.docTitlePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-secondary mb-2 block">
                      {t('knowledge.docContent')}
                    </label>
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-input text-text-primary text-sm outline-none focus:border-primary transition resize-none"
                      placeholder={t('knowledge.docContentPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-secondary mb-2 block">
                      {t('knowledge.tags')}
                    </label>
                    <input
                      type="text"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-input text-text-primary text-sm outline-none focus:border-primary transition"
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-secondary mb-2 block">
                      {t('knowledge.category')}
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-input text-text-primary text-sm outline-none focus:border-primary transition"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {t(`knowledge.category_${cat}` as keyof typeof import('@/shared/i18n/ko').default)}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <Button variant="secondary" size="md" onClick={() => setShowAddModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleAddDocument}
                disabled={!newTitle.trim() || !newContent.trim() || isProcessing}
              >
                {t('common.add')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
