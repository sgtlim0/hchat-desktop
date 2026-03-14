import { Send, RefreshCw } from 'lucide-react'
import { useTranslation } from '@hchat/shared'
import { usePageContext } from '@ext/hooks/usePageContext'
import { useExtSessionStore } from '@ext/stores/session.store'
import { useExtSettingsStore } from '@ext/stores/settings.store'

export function PageContextPage() {
  const { t } = useTranslation()
  const { pageContext, isLoading, extractPage } = usePageContext()
  const createSession = useExtSessionStore((s) => s.createSession)
  const setPage = useExtSessionStore((s) => s.setPage)
  const selectedModel = useExtSettingsStore((s) => s.selectedModel)

  function handleSendToChat() {
    if (!pageContext) return
    createSession(selectedModel)
    setPage('chat')
  }

  return (
    <div className="flex flex-col h-full">
      <header className="px-3 py-2.5 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-bold text-[var(--text-primary)]">
            {t('ext.pageContext')}
          </h1>
          <button
            onClick={extractPage}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-[var(--bg-card)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-40"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? t('common.loading') : 'Extract'}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {!pageContext ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-xs text-[var(--text-tertiary)] mb-3">
              {t('ext.pageContextDesc')}
            </p>
            <button
              onClick={extractPage}
              disabled={isLoading}
              className="px-4 py-2 text-xs bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-40"
            >
              {isLoading ? t('common.loading') : t('ext.pageContext')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Page info */}
            <div className="border border-[var(--border)] rounded-lg p-2.5">
              <h3 className="text-xs font-medium text-[var(--text-primary)] mb-1">
                {pageContext.title}
              </h3>
              <p className="text-[10px] text-[var(--primary)] truncate">
                {pageContext.url}
              </p>
            </div>

            {/* Content preview */}
            <div className="border border-[var(--border)] rounded-lg p-2.5">
              <h4 className="text-[10px] font-medium text-[var(--text-secondary)] mb-1.5">
                Content Preview
              </h4>
              <p className="text-xs text-[var(--text-primary)] whitespace-pre-wrap line-clamp-[20]">
                {pageContext.text.slice(0, 2000)}
                {pageContext.text.length > 2000 && '...'}
              </p>
              <p className="text-[9px] text-[var(--text-tertiary)] mt-2">
                {pageContext.text.length.toLocaleString()} characters
              </p>
            </div>

            {/* Send to chat button */}
            <button
              onClick={handleSendToChat}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--primary)] text-white text-xs font-medium rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
            >
              <Send size={12} />
              Send to Chat
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
