import { useState, useRef, useEffect } from 'react'
import { Tag as TagIcon, X, Plus } from 'lucide-react'
import { useTagStore } from '@/entities/tag/tag.store'
import { useSessionStore } from '@/entities/session/session.store'
import { useTranslation } from '@/shared/i18n'

const TAG_COLORS = ['#3478FE', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899']

interface TagSelectorProps {
  sessionId: string
}

export function TagSelector({ sessionId }: TagSelectorProps) {
  const { t } = useTranslation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [creatingTag, setCreatingTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const tags = useTagStore((s) => s.tags)
  const addTag = useTagStore((s) => s.addTag)
  const sessions = useSessionStore((s) => s.sessions)
  const session = sessions.find((s) => s.id === sessionId)
  const updateSession = useSessionStore((s) => s.updateSession)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setCreatingTag(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  if (!session) return null

  const selectedTags = session.tags || []

  function toggleTag(tagId: string) {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId]
    updateSession(sessionId, { tags: newTags })
  }

  function handleCreateTag() {
    if (newTagName.trim()) {
      const randomColor = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]
      addTag(newTagName.trim(), randomColor)
      setNewTagName('')
      setCreatingTag(false)
    }
  }

  const selectedTagObjects = tags.filter((tag) => selectedTags.includes(tag.id))

  return (
    <div className="relative">
      {/* Selected tags display */}
      <div className="flex items-center gap-1.5">
        {selectedTagObjects.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
          >
            <span>{tag.name}</span>
            <button
              onClick={() => toggleTag(tag.id)}
              className="hover:opacity-70 transition"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="p-1.5 hover:bg-hover rounded-lg transition focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          aria-label={t('tag.add')}
          title={t('tag.add')}
        >
          <TagIcon size={16} className="text-text-tertiary" />
        </button>
      </div>

      {/* Dropdown */}
      {dropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full mt-1 w-56 bg-page border border-border rounded-lg shadow-lg py-1 z-50 animate-fade-in"
        >
          <div className="px-3 py-2 text-xs font-semibold text-text-tertiary uppercase tracking-wide">
            {t('tag.selectTags')}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {tags.length === 0 ? (
              <div className="px-3 py-2 text-sm text-text-tertiary">
                {t('tag.noTags')}
              </div>
            ) : (
              tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-hover transition cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                    className="w-4 h-4 rounded border-border-input"
                  />
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm text-text-primary">{tag.name}</span>
                </label>
              ))
            )}
          </div>
          <div className="border-t border-border mt-1" />
          {creatingTag ? (
            <div className="px-3 py-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onBlur={handleCreateTag}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateTag()
                  if (e.key === 'Escape') {
                    setCreatingTag(false)
                    setNewTagName('')
                  }
                }}
                placeholder={t('tag.namePlaceholder')}
                className="w-full bg-transparent text-sm text-text-primary outline-none border-b border-primary py-1"
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => setCreatingTag(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-hover transition"
            >
              <Plus size={14} />
              {t('tag.create')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
