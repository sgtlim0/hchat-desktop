import { useState, useRef, useEffect } from 'react'
import { Star, Pencil, MoreHorizontal, Trash2, Download, ChevronRight } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useProjectStore } from '@/entities/project/project.store'
import { useTranslation } from '@/shared/i18n'
import { getModelName } from '@/shared/lib/model-meta'
import { exportChat } from '@/shared/lib/export-chat'
import type { ExportFormat } from '@/shared/types'

interface ChatHeaderProps {
  sessionId: string
}

export function ChatHeader({ sessionId }: ChatHeaderProps) {
  const { t } = useTranslation()
  const sessions = useSessionStore((s) => s.sessions)
  const session = sessions.find((s) => s.id === sessionId)
  const { renameSession, toggleFavorite, deleteSession } = useSessionStore()
  const messages = useSessionStore((s) => s.messages[sessionId] ?? [])
  const projects = useProjectStore((s) => s.projects)

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(session?.title ?? '')
  const [menuOpen, setMenuOpen] = useState(false)
  const [exportSubmenuOpen, setExportSubmenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  if (!session) return null

  const project = projects.find((p) => p.id === session.projectId)

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      renameSession(session.id, editTitle.trim())
    }
    setIsEditing(false)
  }

  const handleExport = (format: ExportFormat) => {
    exportChat({ session, messages }, format)
    setMenuOpen(false)
    setExportSubmenuOpen(false)
  }

  const handleDelete = () => {
    deleteSession(session.id)
    setMenuOpen(false)
  }

  return (
    <div className="h-[52px] border-b border-border px-4 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle()
              if (e.key === 'Escape') setIsEditing(false)
            }}
            className="bg-transparent text-sm font-semibold text-text-primary outline-none border-b border-primary px-1"
            autoFocus
          />
        ) : (
          <button
            onClick={() => {
              setEditTitle(session.title)
              setIsEditing(true)
            }}
            className="flex items-center gap-1.5 hover:bg-hover rounded-lg px-2 py-1 transition"
          >
            <span className="text-sm font-semibold text-text-primary">{session.title}</span>
            <Pencil size={14} className="text-text-tertiary" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs bg-card border border-border rounded-md px-2 py-1 text-text-secondary">
          {getModelName(session.modelId)}
        </span>
        {project && (
          <span className="text-xs bg-primary/10 text-primary rounded-md px-2 py-1 font-medium">
            {project.name}
          </span>
        )}
        <button
          onClick={() => toggleFavorite(session.id)}
          aria-label={session.isFavorite ? t('chat.unfavorite') : t('chat.favorite')}
          className="p-1.5 hover:bg-hover rounded-lg transition focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
        >
          <Star
            size={16}
            className={session.isFavorite ? 'text-yellow-star fill-yellow-star' : 'text-text-tertiary'}
          />
        </button>

        {/* More Actions Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={t('chat.moreActions')}
            aria-expanded={menuOpen}
            className="p-1.5 hover:bg-hover rounded-lg transition focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          >
            <MoreHorizontal size={16} className="text-text-tertiary" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-page border border-border rounded-lg shadow-lg py-1 z-50 animate-fade-in">
              <div className="relative">
                <button
                  onMouseEnter={() => setExportSubmenuOpen(true)}
                  onMouseLeave={() => setExportSubmenuOpen(false)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-text-primary hover:bg-hover transition"
                >
                  <div className="flex items-center gap-2">
                    <Download size={14} className="text-text-secondary" />
                    {t('chat.export')}
                  </div>
                  <ChevronRight size={14} className="text-text-tertiary" />
                </button>

                {exportSubmenuOpen && (
                  <div
                    onMouseEnter={() => setExportSubmenuOpen(true)}
                    onMouseLeave={() => setExportSubmenuOpen(false)}
                    className="absolute left-full top-0 ml-1 w-40 bg-page border border-border rounded-lg shadow-lg py-1 animate-fade-in"
                  >
                    <button
                      onClick={() => handleExport('markdown')}
                      className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-hover transition"
                    >
                      {t('chat.exportMarkdown')}
                    </button>
                    <button
                      onClick={() => handleExport('html')}
                      className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-hover transition"
                    >
                      {t('chat.exportHtml')}
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-hover transition"
                    >
                      {t('chat.exportJson')}
                    </button>
                    <button
                      onClick={() => handleExport('txt')}
                      className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-hover transition"
                    >
                      {t('chat.exportTxt')}
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-border my-1" />
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-hover transition"
              >
                <Trash2 size={14} />
                {t('chat.deleteChat')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
