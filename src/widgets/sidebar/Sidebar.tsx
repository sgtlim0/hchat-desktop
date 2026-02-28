import { useState } from 'react'
import { MessageSquare, Folder, Star, Search, Plus } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { SidebarItem } from '@/shared/ui/SidebarItem'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { SessionContextMenu } from './SessionContextMenu'
import { MAX_RECENT_SESSIONS } from '@/shared/constants'

export function Sidebar() {
  const sessions = useSessionStore((s) => s.sessions)
  const currentSessionId = useSessionStore((s) => s.currentSessionId)
  const selectSession = useSessionStore((s) => s.selectSession)
  const createSession = useSessionStore((s) => s.createSession)
  const setView = useSessionStore((s) => s.setView)
  const setSearchOpen = useSessionStore((s) => s.setSearchOpen)

  const [contextMenu, setContextMenu] = useState<{
    sessionId: string
    x: number
    y: number
  } | null>(null)

  const favoriteSessions = sessions.filter((s) => s.isFavorite)
  const recentSessions = sessions
    .filter((s) => !s.isFavorite)
    .slice(0, MAX_RECENT_SESSIONS)

  function handleContextMenu(e: React.MouseEvent, sessionId: string) {
    e.preventDefault()
    setContextMenu({ sessionId, x: e.clientX, y: e.clientY })
  }

  function handleNewChat() {
    createSession()
  }

  return (
    <div className="w-sidebar bg-sidebar border-r border-border flex flex-col h-full">
      {/* Fixed top section */}
      <div className="p-3 space-y-2 flex-shrink-0">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border-input hover:bg-hover transition text-[13px] text-text-secondary"
        >
          <Search size={16} />
          <span>검색 (⌘K)</span>
        </button>

        <Button
          variant="primary"
          size="md"
          onClick={handleNewChat}
          className="w-full gap-2"
        >
          <Plus size={16} />
          새 채팅
        </Button>

        <div className="flex items-center gap-2 pt-2">
          <Avatar initials="H" size="sm" />
          <span className="font-semibold text-sm text-primary">H Chat</span>
        </div>
      </div>

      {/* Scrollable middle section */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {/* Projects section */}
        <div>
          <button
            onClick={() => setView('projects')}
            className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-text-tertiary uppercase tracking-wide hover:text-text-secondary transition w-full"
          >
            <Folder size={14} />
            프로젝트
          </button>
        </div>

        {/* Favorites section */}
        {favoriteSessions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-text-tertiary uppercase tracking-wide">
              <Star size={14} />
              즐겨찾기
            </div>
            <div className="mt-1 space-y-0.5">
              {favoriteSessions.map((session) => (
                <div
                  key={session.id}
                  onContextMenu={(e) => handleContextMenu(e, session.id)}
                  className="relative"
                >
                  <SidebarItem
                    icon={MessageSquare}
                    label={session.title}
                    active={currentSessionId === session.id}
                    onClick={() => selectSession(session.id)}
                  />
                  {session.isStreaming && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-success animate-pulse-dot" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent chats section */}
        {recentSessions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-text-tertiary uppercase tracking-wide">
              <MessageSquare size={14} />
              최근 대화
            </div>
            <div className="mt-1 space-y-0.5">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  onContextMenu={(e) => handleContextMenu(e, session.id)}
                  className="relative"
                >
                  <SidebarItem
                    icon={MessageSquare}
                    label={session.title}
                    active={currentSessionId === session.id}
                    onClick={() => selectSession(session.id)}
                  />
                  {session.isStreaming && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-success animate-pulse-dot" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom section */}
      <div className="p-3 border-t border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Avatar initials="DC" size="sm" />
          <span className="text-sm text-text-primary">현대오토에버 사용자</span>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <SessionContextMenu
          sessionId={contextMenu.sessionId}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
