import { useState, useEffect } from 'react'
import { MessageSquare, Folder, Star, Search, Plus, Brain, Network, CalendarClock, Users, Settings, BookOpen, Swords, ChevronDown, ChevronRight, X, Wand2, Image, Bot } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useFolderStore } from '@/entities/folder/folder.store'
import { SidebarItem } from '@/shared/ui/SidebarItem'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { SessionContextMenu } from './SessionContextMenu'
import { MAX_RECENT_SESSIONS } from '@/shared/constants'
import { useTranslation } from '@/shared/i18n'

const FOLDER_COLORS = ['#3478FE', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899']

export function Sidebar() {
  const { t } = useTranslation()
  const sessions = useSessionStore((s) => s.sessions)
  const currentSessionId = useSessionStore((s) => s.currentSessionId)
  const selectSession = useSessionStore((s) => s.selectSession)
  const createSession = useSessionStore((s) => s.createSession)
  const setView = useSessionStore((s) => s.setView)
  const setSearchOpen = useSessionStore((s) => s.setSearchOpen)
  const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen)
  const sidebarOpen = useSettingsStore((s) => s.sidebarOpen)
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar)
  const [isMobile, setIsMobile] = useState(false)

  const folders = useFolderStore((s) => s.folders)
  const selectedFolderId = useFolderStore((s) => s.selectedFolderId)
  const selectFolder = useFolderStore((s) => s.selectFolder)
  const addFolder = useFolderStore((s) => s.addFolder)

  const [contextMenu, setContextMenu] = useState<{
    sessionId: string
    x: number
    y: number
  } | null>(null)
  const [foldersExpanded, setFoldersExpanded] = useState(true)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const filteredSessions = selectedFolderId
    ? sessions.filter((s) => s.folderId === selectedFolderId)
    : sessions

  const favoriteSessions = filteredSessions.filter((s) => s.isFavorite)
  const recentSessions = filteredSessions
    .filter((s) => !s.isFavorite)
    .slice(0, MAX_RECENT_SESSIONS)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  function handleContextMenu(e: React.MouseEvent, sessionId: string) {
    e.preventDefault()
    setContextMenu({ sessionId, x: e.clientX, y: e.clientY })
  }

  function handleNewChat() {
    createSession()
  }

  function handleCreateFolder() {
    if (newFolderName.trim()) {
      const randomColor = FOLDER_COLORS[Math.floor(Math.random() * FOLDER_COLORS.length)]
      addFolder(newFolderName.trim(), randomColor)
      setNewFolderName('')
      setCreatingFolder(false)
    }
  }

  function getSessionCountForFolder(folderId: string) {
    return sessions.filter((s) => s.folderId === folderId).length
  }

  function handleSessionSelect(sessionId: string) {
    selectSession(sessionId)
    if (isMobile) {
      toggleSidebar()
    }
  }

  function handleViewChange(view: string) {
    setView(view as any)
    if (isMobile) {
      toggleSidebar()
    }
  }

  function handleBackdropClick() {
    if (isMobile) {
      toggleSidebar()
    }
  }

  if (!sidebarOpen) return null

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 animate-fade-backdrop md:hidden"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          w-sidebar bg-sidebar border-r border-border flex flex-col h-full
          ${isMobile ? 'fixed left-0 top-0 z-50 animate-slide-left' : ''}
        `}
      >
      {/* Fixed top section */}
      <div className="p-3 space-y-2 flex-shrink-0">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border-input hover:bg-hover transition text-[13px] text-text-secondary"
        >
          <Search size={16} />
          <span>{t('sidebar.search')}</span>
        </button>

        <Button
          variant="primary"
          size="md"
          onClick={handleNewChat}
          className="w-full gap-2"
        >
          <Plus size={16} />
          {t('sidebar.newChat')}
        </Button>

        <div className="flex items-center gap-2 pt-2">
          <Avatar initials="H" size="sm" />
          <span className="font-semibold text-sm text-primary">H Chat</span>
        </div>
      </div>

      {/* Scrollable middle section */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {/* Folders section */}
        <div>
          <button
            onClick={() => setFoldersExpanded((prev) => !prev)}
            className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-text-tertiary uppercase tracking-wide hover:text-text-secondary transition"
          >
            <div className="flex items-center gap-2">
              {foldersExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {t('folder.title')}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setCreatingFolder(true)
              }}
              className="p-1 hover:bg-hover rounded transition"
              title={t('folder.create')}
            >
              <Plus size={12} />
            </button>
          </button>
          {foldersExpanded && (
            <div className="mt-1 space-y-0.5">
              <button
                onClick={() => selectFolder(null)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg transition text-[13px] ${
                  selectedFolderId === null
                    ? 'bg-hover text-text-primary'
                    : 'text-text-secondary hover:bg-hover/50'
                }`}
              >
                <span>{t('folder.all')}</span>
                <span className="text-xs text-text-tertiary">{sessions.length}</span>
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => selectFolder(folder.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg transition text-[13px] ${
                    selectedFolderId === folder.id
                      ? 'bg-hover text-text-primary'
                      : 'text-text-secondary hover:bg-hover/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: folder.color }}
                    />
                    <span>{folder.name}</span>
                  </div>
                  <span className="text-xs text-text-tertiary">
                    {getSessionCountForFolder(folder.id)}
                  </span>
                </button>
              ))}
              {creatingFolder && (
                <div className="flex items-center gap-1 px-3 py-1.5">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onBlur={handleCreateFolder}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateFolder()
                      if (e.key === 'Escape') {
                        setCreatingFolder(false)
                        setNewFolderName('')
                      }
                    }}
                    placeholder={t('folder.namePlaceholder')}
                    className="flex-1 bg-transparent text-[13px] text-text-primary outline-none border-b border-primary"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setCreatingFolder(false)
                      setNewFolderName('')
                    }}
                    className="p-1 hover:bg-hover rounded transition"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Projects section */}
        <div>
          <button
            onClick={() => handleViewChange('projects')}
            className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-text-tertiary uppercase tracking-wide hover:text-text-secondary transition w-full"
          >
            <Folder size={14} />
            {t('sidebar.projects')}
          </button>
        </div>

        {/* Tools section */}
        <div>
          <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-text-tertiary uppercase tracking-wide">
            {t('sidebar.tools')}
          </div>
          <div className="mt-1 space-y-0.5">
            <SidebarItem
              icon={Users}
              label={t('sidebar.groupChat')}
              onClick={() => handleViewChange('groupChat')}
            />
            <SidebarItem
              icon={Brain}
              label={t('sidebar.memory')}
              onClick={() => handleViewChange('memory')}
            />
            <SidebarItem
              icon={Network}
              label={t('sidebar.agentSwarm')}
              onClick={() => handleViewChange('agentSwarm')}
            />
            <SidebarItem
              icon={CalendarClock}
              label={t('sidebar.scheduler')}
              onClick={() => handleViewChange('schedule')}
            />
            <SidebarItem
              icon={BookOpen}
              label={t('sidebar.promptLibrary')}
              onClick={() => handleViewChange('promptLibrary')}
            />
            <SidebarItem
              icon={Swords}
              label={t('sidebar.debate')}
              onClick={() => handleViewChange('debate')}
            />
            <SidebarItem
              icon={Wand2}
              label={t('sidebar.aiTools')}
              onClick={() => handleViewChange('aiTools')}
            />
            <SidebarItem
              icon={Image}
              label={t('sidebar.imageGen')}
              onClick={() => handleViewChange('imageGen')}
            />
            <SidebarItem
              icon={Bot}
              label={t('sidebar.agent')}
              onClick={() => handleViewChange('agent')}
            />
          </div>
        </div>

        {/* Favorites section */}
        {favoriteSessions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-text-tertiary uppercase tracking-wide">
              <Star size={14} />
              {t('sidebar.favorites')}
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
                    onClick={() => handleSessionSelect(session.id)}
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
              {t('sidebar.recentChats')}
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
                    onClick={() => handleSessionSelect(session.id)}
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
      <div className="p-3 border-t border-border flex-shrink-0 space-y-2">
        <SidebarItem
          icon={Settings}
          label={t('settings.title')}
          onClick={() => setSettingsOpen(true)}
        />
        <div className="flex items-center gap-2">
          <Avatar initials="DC" size="sm" />
          <span className="text-sm text-text-primary">{t('sidebar.user')}</span>
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
    </>
  )
}
