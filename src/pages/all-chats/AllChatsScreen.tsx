import { useState, useMemo } from 'react'
import { MessageSquare, Star, Search } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { getRelativeTime, getDateGroup } from '@/shared/lib/time'

type FilterType = 'all' | 'favorites' | 'projects'

export function AllChatsScreen() {
  const { sessions, selectSession } = useSessionStore()
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSessions = useMemo(() => {
    let result = sessions

    // Apply filter
    if (filter === 'favorites') {
      result = result.filter((s) => s.isFavorite)
    } else if (filter === 'projects') {
      result = result.filter((s) => s.projectId)
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
      const group = getDateGroup(session.updatedAt)
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(session)
    })

    return groups
  }, [filteredSessions])

  const groupOrder = ['오늘', '어제', '이번 주', '이번 달', '이전']

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">전체 채팅</h1>
        <div className="relative w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="세션 검색..."
            className="w-full bg-input border border-border-input rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-primary text-white'
              : 'border border-border text-text-secondary hover:bg-hover'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setFilter('favorites')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'favorites'
              ? 'bg-primary text-white'
              : 'border border-border text-text-secondary hover:bg-hover'
          }`}
        >
          즐겨찾기
        </button>
        <button
          onClick={() => setFilter('projects')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'projects'
              ? 'bg-primary text-white'
              : 'border border-border text-text-secondary hover:bg-hover'
          }`}
        >
          프로젝트별
        </button>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <p className="text-text-secondary text-sm">
            {searchQuery ? '검색 결과가 없습니다' : '세션이 없습니다'}
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
                      onClick={() => selectSession(session.id)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-hover cursor-pointer transition"
                    >
                      <MessageSquare className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-text-primary truncate">
                          {session.title}
                        </div>
                        {session.lastMessage && (
                          <div className="text-text-secondary text-xs truncate mt-0.5">
                            {session.lastMessage}
                          </div>
                        )}
                      </div>
                      {session.isFavorite && (
                        <Star className="w-4 h-4 text-yellow-star fill-yellow-star flex-shrink-0" />
                      )}
                      <div className="text-text-tertiary text-xs flex-shrink-0">
                        {getRelativeTime(session.updatedAt)}
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
