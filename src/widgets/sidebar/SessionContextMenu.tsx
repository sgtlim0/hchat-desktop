import { useEffect, useRef } from 'react'
import { Pencil, Star, Trash2 } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useTranslation } from '@/shared/i18n'

interface SessionContextMenuProps {
  sessionId: string
  x: number
  y: number
  onClose: () => void
}

export function SessionContextMenu({
  sessionId,
  x,
  y,
  onClose,
}: SessionContextMenuProps) {
  const { t } = useTranslation()
  const menuRef = useRef<HTMLDivElement>(null)
  const sessions = useSessionStore((s) => s.sessions)
  const toggleFavorite = useSessionStore((s) => s.toggleFavorite)
  const deleteSession = useSessionStore((s) => s.deleteSession)
  const renameSession = useSessionStore((s) => s.renameSession)

  const session = sessions.find((s) => s.id === sessionId)
  const isFavorite = session?.isFavorite ?? false

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  function handleRename() {
    const newTitle = prompt(t('sidebar.renamePrompt'), session?.title ?? '')
    if (newTitle && newTitle.trim()) {
      renameSession(sessionId, newTitle.trim())
    }
    onClose()
  }

  function handleToggleFavorite() {
    toggleFavorite(sessionId)
    onClose()
  }

  function handleDelete() {
    if (confirm(t('sidebar.deleteConfirm'))) {
      deleteSession(sessionId)
    }
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="fixed bg-card border border-border rounded-lg shadow-lg py-1 min-w-[180px] z-50 animate-fade-in"
      style={{ left: x, top: y }}
    >
      <button
        onClick={handleRename}
        className="w-full px-3 py-2 text-sm text-left hover:bg-hover flex items-center gap-2"
      >
        <Pencil size={14} className="text-text-secondary" />
        {t('sidebar.rename')}
      </button>
      <button
        onClick={handleToggleFavorite}
        className="w-full px-3 py-2 text-sm text-left hover:bg-hover flex items-center gap-2"
      >
        <Star
          size={14}
          className={isFavorite ? 'text-yellow-star fill-yellow-star' : 'text-text-secondary'}
        />
        {isFavorite ? t('sidebar.removeFavorite') : t('sidebar.addFavorite')}
      </button>
      <button
        onClick={handleDelete}
        className="w-full px-3 py-2 text-sm text-left hover:bg-hover flex items-center gap-2 text-danger"
      >
        <Trash2 size={14} />
        {t('common.delete')}
      </button>
    </div>
  )
}
