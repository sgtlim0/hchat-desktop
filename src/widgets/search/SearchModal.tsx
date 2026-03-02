import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, Check, MessageSquare, FolderOpen, FileText } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useProjectStore } from '@/entities/project/project.store'
import { getRelativeTime } from '@/shared/lib/time'
import { useTranslation } from '@/shared/i18n'

interface SearchResult {
  id: string
  type: 'session' | 'project' | 'message'
  title: string
  subtitle?: string
  time: string
  sessionId?: string
}

export function SearchModal() {
  const { t } = useTranslation()
  const { searchOpen, setSearchOpen, sessions, currentSessionId, selectSession, searchMessages } = useSessionStore()
  const setView = useSessionStore((s) => s.setView)
  const { projects, selectProject } = useProjectStore()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo((): SearchResult[] => {
    const q = query.toLowerCase().trim()

    const sessionResults: SearchResult[] = sessions
      .filter((s) => !q || s.title.toLowerCase().includes(q) || s.lastMessage?.toLowerCase().includes(q))
      .slice(0, q ? 10 : 5)
      .map((s) => ({
        id: s.id,
        type: 'session' as const,
        title: s.title,
        subtitle: s.lastMessage,
        time: getRelativeTime(s.updatedAt, t),
      }))

    const projectResults: SearchResult[] = projects
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
      .slice(0, q ? 5 : 3)
      .map((p) => ({
        id: p.id,
        type: 'project' as const,
        title: p.name,
        subtitle: p.description,
        time: getRelativeTime(p.updatedAt, t),
      }))

    const messageResults: SearchResult[] = q
      ? searchMessages(q).slice(0, 5).map((m) => {
          const snippet = m.content.substring(0, 100) + (m.content.length > 100 ? '...' : '')
          return {
            id: m.messageId,
            type: 'message' as const,
            title: m.sessionTitle,
            subtitle: snippet,
            time: '',
            sessionId: m.sessionId,
          }
        })
      : []

    return [...sessionResults, ...projectResults, ...messageResults]
  }, [sessions, projects, query, searchMessages, t])

  const sessionResults = results.filter((r) => r.type === 'session')
  const projectResults = results.filter((r) => r.type === 'project')
  const messageResults = results.filter((r) => r.type === 'message')

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [searchOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (!searchOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [searchOpen])

  function handleSelect(result: SearchResult) {
    if (result.type === 'session') {
      selectSession(result.id)
    } else if (result.type === 'project') {
      selectProject(result.id)
      setView('projectDetail')
    } else if (result.type === 'message' && result.sessionId) {
      selectSession(result.sessionId)
    }
    setSearchOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setSearchOpen(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSearchOpen(false)
    }
  }

  const highlightMatch = (text: string, q: string) => {
    if (!q) return text
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <span key={i} className="bg-yellow-200/30">{part}</span>
      ) : (
        part
      )
    )
  }

  if (!searchOpen) return null

  let flatIndex = 0

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-[120px]"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={t('search.placeholder')}
    >
      <div className="bg-page rounded-xl w-[560px] shadow-2xl border border-border overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-text-tertiary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('search.placeholder')}
            className="flex-1 bg-transparent text-text-primary text-sm outline-none placeholder:text-text-tertiary"
          />
          <kbd className="px-2 py-0.5 bg-hover border border-border rounded text-[10px] font-medium text-text-tertiary flex-shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {results.length === 0 ? (
            <div className="py-12 text-center text-text-secondary text-sm">
              {t('common.noResults')}
            </div>
          ) : (
            <>
              {/* Session Results */}
              {sessionResults.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-[11px] font-medium text-text-tertiary uppercase">
                      {query ? t('search.conversations') : t('search.recentConversations')}
                    </span>
                  </div>
                  {sessionResults.map((result) => {
                    const idx = flatIndex++
                    const isActive = result.id === currentSessionId
                    const isSelected = idx === selectedIndex

                    return (
                      <div
                        key={result.id}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(result)}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition ${
                          isSelected ? 'bg-hover' : 'hover:bg-hover/50'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-text-primary truncate">
                              {highlightMatch(result.title, query)}
                            </span>
                            {isActive && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Project Results */}
              {projectResults.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-[11px] font-medium text-text-tertiary uppercase">
                      {t('search.projects')}
                    </span>
                  </div>
                  {projectResults.map((result) => {
                    const idx = flatIndex++
                    const isSelected = idx === selectedIndex

                    return (
                      <div
                        key={result.id}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(result)}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition ${
                          isSelected ? 'bg-hover' : 'hover:bg-hover/50'
                        }`}
                      >
                        <FolderOpen className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-text-primary truncate">
                            {highlightMatch(result.title, query)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Message Results */}
              {messageResults.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-[11px] font-medium text-text-tertiary uppercase">
                      {t('search.messages')}
                    </span>
                  </div>
                  {messageResults.map((result) => {
                    const idx = flatIndex++
                    const isSelected = idx === selectedIndex

                    return (
                      <div
                        key={result.id}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(result)}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition ${
                          isSelected ? 'bg-hover' : 'hover:bg-hover/50'
                        }`}
                      >
                        <FileText className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-text-primary truncate">
                            {result.title}
                          </div>
                          {result.subtitle && (
                            <div className="text-xs text-text-secondary truncate mt-0.5">
                              {highlightMatch(result.subtitle, query)}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Keyboard Hints */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-[11px] text-text-tertiary">
          <span>
            <kbd className="font-mono">↑</kbd><kbd className="font-mono">↓</kbd> {t('search.navigate')}
          </span>
          <span>
            <kbd className="font-mono">↵</kbd> {t('search.open')}
          </span>
          <span>
            <kbd className="font-mono">esc</kbd> {t('common.close')}
          </span>
        </div>
      </div>
    </div>
  )
}
