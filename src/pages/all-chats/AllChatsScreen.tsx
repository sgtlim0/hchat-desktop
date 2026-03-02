import { useState, useMemo, useRef } from 'react'
import { MessageSquare, Star, Search, Pin, Upload, Download } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { getRelativeTime, getDateGroup } from '@/shared/lib/time'
import { getModelName } from '@/shared/lib/model-meta'
import { useTranslation } from '@/shared/i18n'
import { importFromAnySource, readFileAsText } from '@/shared/lib/import-chat'
import { downloadExport } from '@/shared/lib/export-chat'

type FilterType = 'all' | 'favorites' | 'projects' | 'pinned'

export function AllChatsScreen() {
  const { t } = useTranslation()
  const { sessions, messages, selectSession, importSession } = useSessionStore()
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await readFileAsText(file)
      const { session, messages } = importFromAnySource(text)
      await importSession(session, messages)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      alert(t('import.failed', { error: msg }))
    } finally {
      // Reset file input so same file can be re-imported
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function handleBatchExport() {
    if (filteredSessions.length === 0) {
      alert(t('common.noResults'))
      return
    }

    const messagesMap: Record<string, any[]> = {}
    filteredSessions.forEach((session) => {
      messagesMap[session.id] = messages[session.id] || []
    })

    const exportData = {
      sessions: filteredSessions,
      messages: messagesMap,
    }

    downloadExport(
      JSON.stringify(exportData, null, 2),
      'hchat-export-all.json',
      'application/json'
    )

    alert(t('allChats.exported', { count: filteredSessions.length }))
  }

  const filteredSessions = useMemo(() => {
    let result = sessions

    // Apply filter
    if (filter === 'favorites') {
      result = result.filter((s) => s.isFavorite)
    } else if (filter === 'projects') {
      result = result.filter((s) => s.projectId)
    } else if (filter === 'pinned') {
      result = result.filter((s) => s.pinned)
    }

    // Apply search
    if (searchQuery.trim()) {
      result = result.filter((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return result
  }, [sessions, filter, searchQuery])

  const groupedSessions = useMemo(() => {
    const groups: Record<string, typeof sessions> = {}

    filteredSessions.forEach((session) => {
      const group = getDateGroup(session.updatedAt, t)
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(session)
    })

    return groups
  }, [filteredSessions, t])

  const groupOrder = [t('time.today'), t('time.yesterday'), t('time.thisWeek'), t('time.thisMonth'), t('time.earlier')]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t('allChats.title')}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-hover transition"
          >
            <Upload size={16} />
            {t('import.button')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={handleBatchExport}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-hover transition"
          >
            <Download size={16} />
            {t('allChats.exportAll')}
          </button>
        <div className="relative w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('allChats.searchPlaceholder')}
            className="w-full bg-input border border-border-input rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition"
          />
        </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          aria-pressed={filter === 'all'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-primary text-white'
              : 'border border-border text-text-secondary hover:bg-hover'
          }`}
        >
          {t('allChats.all')}
        </button>
        <button
          onClick={() => setFilter('favorites')}
          aria-pressed={filter === 'favorites'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'favorites'
              ? 'bg-primary text-white'
              : 'border border-border text-text-secondary hover:bg-hover'
          }`}
        >
          {t('allChats.favorites')}
        </button>
        <button
          onClick={() => setFilter('pinned')}
          aria-pressed={filter === 'pinned'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'pinned'
              ? 'bg-primary text-white'
              : 'border border-border text-text-secondary hover:bg-hover'
          }`}
        >
          {t('allChats.pinned')}
        </button>
        <button
          onClick={() => setFilter('projects')}
          aria-pressed={filter === 'projects'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'projects'
              ? 'bg-primary text-white'
              : 'border border-border text-text-secondary hover:bg-hover'
          }`}
        >
          {t('allChats.byProject')}
        </button>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <p className="text-text-secondary text-sm">
            {searchQuery ? t('common.noResults') : t('allChats.noSessions')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupOrder.map((group) => {
            const groupSessions = groupedSessions[group]
            if (!groupSessions || groupSessions.length === 0) return null

            return (
              <div key={group}>
                <h3 className="text-xs font-semibold text-text-tertiary uppercase mb-2">
                  {group}
                </h3>
                <div className="space-y-1">
                  {groupSessions.map((session) => (
                    <div
                      key={session.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectSession(session.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectSession(session.id) } }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-hover cursor-pointer transition focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                    >
                      <MessageSquare className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-sm text-text-primary truncate">
                            {session.title}
                          </div>
                          {session.pinned && (
                            <Pin className="w-3 h-3 text-primary fill-primary flex-shrink-0" />
                          )}
                        </div>
                        {session.lastMessage && (
                          <div className="text-text-secondary text-xs truncate mt-0.5">
                            {session.lastMessage}
                          </div>
                        )}
                        {session.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {session.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {session.isFavorite && (
                        <Star className="w-4 h-4 text-yellow-star fill-yellow-star flex-shrink-0" />
                      )}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-text-tertiary text-xs">
                          {getRelativeTime(session.updatedAt, t)}
                        </span>
                        <span className="text-[11px] text-text-tertiary bg-hover px-2 py-0.5 rounded-full">
                          {getModelName(session.modelId).replace('Claude ', '').replace('4 ', '').replace('3.5 ', '')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
