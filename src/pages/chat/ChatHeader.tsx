import { useState, useRef, useEffect } from 'react'
import { Star, Pencil, MoreHorizontal, Trash2, Download, ChevronRight, Sparkles } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useProjectStore } from '@/entities/project/project.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useTranslation } from '@/shared/i18n'
import { getModelName } from '@/shared/lib/model-meta'
import { exportChat } from '@/shared/lib/export-chat'
import { createStream, getProviderConfig } from '@/shared/lib/providers/factory'
import { TagSelector } from './TagSelector'
import type { ExportFormat } from '@/shared/types'

interface ChatHeaderProps {
  sessionId: string
}

export function ChatHeader({ sessionId }: ChatHeaderProps) {
  const { t } = useTranslation()
  const sessions = useSessionStore((s) => s.sessions)
  const session = sessions.find((s) => s.id === sessionId)
  const { renameSession, toggleFavorite, deleteSession, setSummary } = useSessionStore()
  const messages = useSessionStore((s) => s.messages[sessionId] ?? [])
  const projects = useProjectStore((s) => s.projects)
  const credentials = useSettingsStore((s) => s.credentials)
  const openaiApiKey = useSettingsStore((s) => s.openaiApiKey)
  const geminiApiKey = useSettingsStore((s) => s.geminiApiKey)
  const selectedModel = useSettingsStore((s) => s.selectedModel)

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(session?.title ?? '')
  const [menuOpen, setMenuOpen] = useState(false)
  const [exportSubmenuOpen, setExportSubmenuOpen] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false)
      }
    }
    if (menuOpen || exportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen, exportMenuOpen])

  if (!session) return null

  const project = projects.find((p) => p.id === session.projectId)

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      renameSession(session.id, editTitle.trim())
    }
    setIsEditing(false)
  }

  const handleExport = async (format: ExportFormat) => {
    await exportChat({ session, messages }, format)
    setMenuOpen(false)
    setExportSubmenuOpen(false)
    setExportMenuOpen(false)
  }

  const handleDelete = () => {
    deleteSession(session.id)
    setMenuOpen(false)
  }

  const handleSummarize = async () => {
    if (isSummarizing) return
    setIsSummarizing(true)

    try {
      const textSegments = messages
        .flatMap((m) => m.segments.filter((s) => s.type === 'text' && s.content))
        .map((s) => s.content)
        .join('\n\n')

      if (!textSegments.trim()) {
        setIsSummarizing(false)
        return
      }

      const config = getProviderConfig(selectedModel, {
        credentials,
        openaiApiKey,
        geminiApiKey,
      })

      const summaryPrompt = `Summarize this conversation in 1-2 concise sentences:\n\n${textSegments}`

      const stream = createStream(config, {
        modelId: selectedModel,
        messages: [{ role: 'user', content: summaryPrompt }],
        system: 'You are a summarization assistant. Provide only the summary, no additional text.',
      })

      let summaryText = ''
      for await (const event of stream) {
        if (event.type === 'text' && event.content) {
          summaryText += event.content
        }
      }

      if (summaryText.trim()) {
        setSummary(sessionId, summaryText.trim())
      }
    } catch (error) {
      console.error('Failed to generate summary:', error)
    } finally {
      setIsSummarizing(false)
    }
  }

  return (
    <div className="border-b border-border px-4 py-2 flex flex-col gap-2 flex-shrink-0">
      {/* Title row */}
      <div className="flex items-center justify-between">
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
          {/* Summarize button */}
          <button
            onClick={handleSummarize}
            disabled={isSummarizing}
            aria-label={isSummarizing ? t('chat.summarizing') : t('chat.summarize')}
            title={session.summary || (isSummarizing ? t('chat.summarizing') : t('chat.summarize'))}
            className="p-1.5 hover:bg-hover rounded-lg transition focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles
              size={16}
              className={`${isSummarizing ? 'animate-pulse text-primary' : 'text-text-tertiary'}`}
            />
          </button>
          {/* Direct export button */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen((prev) => !prev)}
              aria-label={t('chat.export')}
              className="p-1.5 hover:bg-hover rounded-lg transition focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
            >
              <Download size={16} className="text-text-tertiary" />
            </button>
            {exportMenuOpen && (
              <div
                ref={exportMenuRef}
                className="absolute right-0 top-full mt-1 w-40 bg-page border border-border rounded-lg shadow-lg py-1 z-50 animate-fade-in"
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
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-hover transition"
                >
                  {t('chat.exportPdf')}
                </button>
              </div>
            )}
          </div>

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
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-hover transition"
                    >
                      {t('chat.exportPdf')}
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

      {/* Tags row */}
      <TagSelector sessionId={sessionId} />
    </div>
  )
}
