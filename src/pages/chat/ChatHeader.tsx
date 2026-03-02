import { useState, useRef, useEffect } from 'react'
import { Star, Pencil, MoreHorizontal, Trash2, Download } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useProjectStore } from '@/entities/project/project.store'
import { getModelName } from '@/shared/lib/model-meta'

interface ChatHeaderProps {
  sessionId: string
}

export function ChatHeader({ sessionId }: ChatHeaderProps) {
  const sessions = useSessionStore((s) => s.sessions)
  const session = sessions.find((s) => s.id === sessionId)
  const { renameSession, toggleFavorite, deleteSession } = useSessionStore()
  const messages = useSessionStore((s) => s.messages[sessionId] ?? [])
  const projects = useProjectStore((s) => s.projects)

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(session?.title ?? '')
  const [menuOpen, setMenuOpen] = useState(false)
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

  const handleExport = () => {
    const content = messages
      .map((m) => {
        const role = m.role === 'user' ? 'User' : 'Assistant'
        const text = m.segments
          .filter((s) => s.type === 'text')
          .map((s) => s.content)
          .join('\n')
        return `## ${role}\n\n${text}`
      })
      .join('\n\n---\n\n')

    const blob = new Blob([`# ${session.title}\n\n${content}`], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${session.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.md`
    a.click()
    URL.revokeObjectURL(url)
    setMenuOpen(false)
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
          className="p-1.5 hover:bg-hover rounded-lg transition"
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
            className="p-1.5 hover:bg-hover rounded-lg transition"
          >
            <MoreHorizontal size={16} className="text-text-tertiary" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-page border border-border rounded-lg shadow-lg py-1 z-50 animate-fade-in">
              <button
                onClick={handleExport}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-hover transition"
              >
                <Download size={14} className="text-text-secondary" />
                마크다운 내보내기
              </button>
              <div className="border-t border-border my-1" />
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-hover transition"
              >
                <Trash2 size={14} />
                대화 삭제
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
