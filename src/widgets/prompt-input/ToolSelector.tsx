import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { Wrench, Settings } from 'lucide-react'
import { useToolIntegrationStore } from '@/entities/tool-integration/tool-integration.store'
import { useTranslation } from '@/shared/i18n'
import { useSessionStore } from '@/entities/session/session.store'

export const ToolSelector = memo(function ToolSelector({ sessionId }: { sessionId: string }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const setView = useSessionStore((s) => s.setView)

  const isConfluenceConfigured = useToolIntegrationStore((s) => s.isConfluenceConfigured())
  const isJiraConfigured = useToolIntegrationStore((s) => s.isJiraConfigured())
  const activeTools = useToolIntegrationStore((s) => s.getActiveTools(sessionId))
  const setActiveTools = useToolIntegrationStore((s) => s.setActiveTools)

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev)
  }, [])

  const handleConfluenceToggle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setActiveTools(sessionId, {
        ...activeTools,
        confluence: e.target.checked,
      })
    },
    [sessionId, activeTools, setActiveTools]
  )

  const handleJiraToggle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setActiveTools(sessionId, {
        ...activeTools,
        jira: e.target.checked,
      })
    },
    [sessionId, activeTools, setActiveTools]
  )

  const handleSettingsClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setView('settings')
      setOpen(false)
    },
    [setView]
  )

  // Handle click outside
  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Count active tools for button indicator
  const activeCount = [activeTools.confluence, activeTools.jira].filter(Boolean).length

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
        aria-label="Tools"
        title={t('toolIntegration.title')}
      >
        <Wrench className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 z-50"
        >
          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-3">
            {t('toolIntegration.title')}
          </h3>

          {/* Confluence Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="confluence-toggle"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                {t('toolIntegration.confluence')}
              </label>
              {isConfluenceConfigured ? (
                <input
                  id="confluence-toggle"
                  type="checkbox"
                  role="switch"
                  checked={activeTools.confluence}
                  onChange={handleConfluenceToggle}
                  aria-label="Confluence"
                  className="w-10 h-5 bg-gray-300 rounded-full relative cursor-pointer appearance-none transition-colors checked:bg-blue-500 dark:bg-gray-600 dark:checked:bg-blue-600"
                />
              ) : (
                <span className="text-xs text-orange-500 dark:text-orange-400">
                  {t('toolIntegration.notConfigured')}
                </span>
              )}
            </div>
            {!isConfluenceConfigured && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('toolIntegration.notConfigured.confluence')}
              </p>
            )}
          </div>

          {/* Jira Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="jira-toggle" className="text-sm text-gray-700 dark:text-gray-300">
                {t('toolIntegration.jira')}
              </label>
              {isJiraConfigured ? (
                <input
                  id="jira-toggle"
                  type="checkbox"
                  role="switch"
                  checked={activeTools.jira}
                  onChange={handleJiraToggle}
                  aria-label="Jira"
                  className="w-10 h-5 bg-gray-300 rounded-full relative cursor-pointer appearance-none transition-colors checked:bg-blue-500 dark:bg-gray-600 dark:checked:bg-blue-600"
                />
              ) : (
                <span className="text-xs text-orange-500 dark:text-orange-400">
                  {t('toolIntegration.notConfigured')}
                </span>
              )}
            </div>
            {!isJiraConfigured && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('toolIntegration.notConfigured.jira')}
              </p>
            )}
          </div>

          {/* Settings Link */}
          {(!isConfluenceConfigured || !isJiraConfigured) && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <a
                href="#"
                onClick={handleSettingsClick}
                className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                role="link"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
                {t('toolIntegration.goToSettings')}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
