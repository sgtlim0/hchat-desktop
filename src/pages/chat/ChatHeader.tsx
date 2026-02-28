import { useState } from 'react'
import { Star, Pencil } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useProjectStore } from '@/entities/project/project.store'
import { getModelName } from '@/shared/lib/model-meta'

interface ChatHeaderProps {
  sessionId: string
}

export function ChatHeader({ sessionId }: ChatHeaderProps) {
  const sessions = useSessionStore((s) => s.sessions)
  const session = sessions.find((s) => s.id === sessionId)
  const { renameSession, toggleFavorite } = useSessionStore()
  const projects = useProjectStore((s) => s.projects)

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(session?.title ?? '')

  if (!session) return null

  const project = projects.find((p) => p.id === session.projectId)

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      renameSession(session.id, editTitle.trim())
    }
    setIsEditing(false)
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
      </div>
    </div>
  )
}
