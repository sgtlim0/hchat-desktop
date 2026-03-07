import { useEffect, useState, useMemo } from 'react'
import { Bookmark, Trash2, Search, Grid3X3, List, Tag, X } from 'lucide-react'
import { useBookmarkStore } from '@/entities/bookmark/bookmark.store'
import { useTranslation } from '@/shared/i18n'
import type { HighlightColor } from '@/shared/types'

const COLOR_MAP: Record<HighlightColor, string> = {
  yellow: 'bg-yellow-500/20 border-yellow-500/40',
  green: 'bg-green-500/20 border-green-500/40',
  blue: 'bg-blue-500/20 border-blue-500/40',
  pink: 'bg-pink-500/20 border-pink-500/40',
}

const COLOR_DOT: Record<HighlightColor, string> = {
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  pink: 'bg-pink-500',
}

export function BookmarkPage() {
  const { t } = useTranslation()
  const bookmarks = useBookmarkStore((s) => s.bookmarks)
  const searchQuery = useBookmarkStore((s) => s.searchQuery)
  const hydrate = useBookmarkStore((s) => s.hydrate)
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark)
  const updateNote = useBookmarkStore((s) => s.updateNote)
  const addTag = useBookmarkStore((s) => s.addTag)
  const removeTag = useBookmarkStore((s) => s.removeTag)
  const setSearchQuery = useBookmarkStore((s) => s.setSearchQuery)

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<HighlightColor | null>(null)
  const [newTagMap, setNewTagMap] = useState<Record<string, string>>({})

  useEffect(() => { hydrate() }, [hydrate])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    for (const b of bookmarks) {
      for (const tag of b.tags) tags.add(tag)
    }
    return Array.from(tags).sort()
  }, [bookmarks])

  const filtered = useMemo(() => {
    let result = bookmarks
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((b) => b.text.toLowerCase().includes(q) || b.note?.toLowerCase().includes(q))
    }
    if (selectedTag) {
      result = result.filter((b) => b.tags.includes(selectedTag))
    }
    if (selectedColor) {
      result = result.filter((b) => b.color === selectedColor)
    }
    return result
  }, [bookmarks, searchQuery, selectedTag, selectedColor])

  const handleAddTag = (bookmarkId: string) => {
    const tag = newTagMap[bookmarkId]?.trim()
    if (!tag) return
    addTag(bookmarkId, tag)
    setNewTagMap((prev) => ({ ...prev, [bookmarkId]: '' }))
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-primary" />{t('bookmark.title')}
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-text-tertiary hover:bg-surface-secondary'}`}>
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-text-tertiary hover:bg-surface-secondary'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-border space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('bookmark.search')} className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg bg-surface-secondary border border-border" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Color filter */}
          {(Object.keys(COLOR_DOT) as HighlightColor[]).map((color) => (
            <button key={color} onClick={() => setSelectedColor(selectedColor === color ? null : color)}
              className={`w-5 h-5 rounded-full ${COLOR_DOT[color]} ${selectedColor === color ? 'ring-2 ring-primary ring-offset-1' : 'opacity-60 hover:opacity-100'}`} />
          ))}
          <span className="w-px h-4 bg-border" />
          {/* Tag filter */}
          {allTags.map((tag) => (
            <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border ${selectedTag === tag ? 'bg-primary/10 border-primary text-primary' : 'border-border text-text-secondary hover:bg-surface-secondary'}`}>
              <Tag className="w-3 h-3" />{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Bookmarks */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 && <p className="text-center text-text-tertiary text-sm py-12">{t('bookmark.empty')}</p>}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {filtered.map((bm) => (
            <div key={bm.id} className={`p-4 rounded-xl border ${COLOR_MAP[bm.color]}`}>
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm text-text-primary line-clamp-3 flex-1">{bm.text}</p>
                <button onClick={() => removeBookmark(bm.id)} className="p-1 rounded hover:bg-red-500/10 shrink-0 ml-2">
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
              <textarea
                value={bm.note ?? ''}
                onChange={(e) => updateNote(bm.id, e.target.value)}
                placeholder={t('bookmark.notePlaceholder')}
                className="w-full px-2 py-1 text-xs rounded bg-black/5 border-none resize-none min-h-[40px] placeholder:text-text-tertiary"
                rows={2}
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {bm.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-surface text-text-secondary text-xs rounded-full">
                    {tag}
                    <button onClick={() => removeTag(bm.id, tag)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    value={newTagMap[bm.id] ?? ''}
                    onChange={(e) => setNewTagMap((prev) => ({ ...prev, [bm.id]: e.target.value }))}
                    placeholder={t('bookmark.addTag')}
                    className="w-16 px-1.5 py-0.5 text-xs rounded bg-transparent border border-dashed border-border"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag(bm.id)}
                  />
                </div>
              </div>
              <p className="text-xs text-text-tertiary mt-2">{new Date(bm.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
