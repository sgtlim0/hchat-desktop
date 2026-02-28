import { useState, useEffect, useRef } from 'react'
import { Search, Check } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { getRelativeTime } from '@/shared/lib/time'

export function SearchModal() {
  const { searchOpen, setSearchOpen, sessions, currentSessionId, selectSession } = useSessionStore()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(query.toLowerCase())
  )

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, filteredSessions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && filteredSessions.length > 0) {
      e.preventDefault()
      selectSession(filteredSessions[selectedIndex].id)
      setSearchOpen(false)
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

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text

    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-yellow-200/30">
          {part}
        </span>
      ) : (
        part
      )
    )
  }

  if (!searchOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-[120px]"
      onClick={handleBackdropClick}
    >
      <div className="bg-page rounded-xl w-[640px] shadow-2xl border border-border">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-text-tertiary" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="세션 검색..."
            className="flex-1 bg-transparent text-text-primary text-sm outline-none placeholder:text-text-tertiary"
          />
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <kbd className="px-2 py-0.5 bg-hover border border-border rounded text-[10px] font-medium">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {filteredSessions.length === 0 ? (
            <div className="py-12 text-center text-text-secondary text-sm">
              검색 결과가 없습니다
            </div>
          ) : (
            filteredSessions.map((session, index) => {
              const isActive = session.id === currentSessionId
              const isSelected = index === selectedIndex

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    selectSession(session.id)
                    setSearchOpen(false)
                  }}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition border-b border-border last:border-0 ${
                    isSelected ? 'bg-hover' : 'hover:bg-hover/50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-sm text-text-primary truncate">
                        {highlightMatch(session.title, query)}
                      </div>
                      {isActive && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                    </div>
                    {session.lastMessage && (
                      <div className="text-xs text-text-secondary truncate mt-0.5">
                        {highlightMatch(session.lastMessage, query)}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-text-tertiary flex-shrink-0">
                    {getRelativeTime(session.updatedAt)}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
