import { useShallow } from 'zustand/react/shallow'
import { Layers, X } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useContextManagerStore } from '@/entities/context-manager/context-manager.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'

const TEMPLATES = ['coding', 'writing', 'analysis', 'general'] as const

export function ContextManagerPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const {
    pinnedMessages,
    selectedTemplate,
    autoCompression,
    tokenUsage,
    unpinMessage,
    setTemplate,
    toggleAutoCompression,
  } = useContextManagerStore(
    useShallow((s) => ({
      pinnedMessages: s.pinnedMessages,
      selectedTemplate: s.selectedTemplate,
      autoCompression: s.autoCompression,
      tokenUsage: s.tokenUsage,
      unpinMessage: s.unpinMessage,
      setTemplate: s.setTemplate,
      toggleAutoCompression: s.toggleAutoCompression,
    }))
  )

  const usagePercent = (tokenUsage.used / tokenUsage.max) * 100

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('home')}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-hover transition text-text-tertiary hover:text-text-primary"
          >
            <X size={18} />
          </button>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{t('contextManager.title')}</h1>
            <p className="text-xs text-text-tertiary">{t('contextManager.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Token Usage */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">{t('contextManager.tokenUsage')}</h2>
            <span className="text-xs text-text-tertiary">
              {t('contextManager.tokensUsed', {
                used: tokenUsage.used.toLocaleString(),
                max: tokenUsage.max.toLocaleString(),
              })}
            </span>
          </div>
          <div className="h-2 bg-page rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                usagePercent > 80 ? 'bg-danger' : usagePercent > 50 ? 'bg-yellow-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Auto Compression */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-text-primary mb-1">
                {t('contextManager.compression')}
              </h2>
              <p className="text-xs text-text-tertiary">{t('contextManager.compressionDesc')}</p>
            </div>
            <button
              onClick={toggleAutoCompression}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition focus:outline-none ${
                autoCompression ? 'bg-primary' : 'bg-input'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                  autoCompression ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Context Templates */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">{t('contextManager.templates')}</h2>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map((template) => (
              <button
                key={template}
                onClick={() => setTemplate(selectedTemplate === template ? null : template)}
                className={`px-4 py-3 rounded-lg border transition text-sm font-medium ${
                  selectedTemplate === template
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-page text-text-secondary hover:text-text-primary hover:border-primary/30'
                }`}
              >
                {t(`contextManager.template.${template}` as keyof typeof import('@/shared/i18n/ko').default)}
              </button>
            ))}
          </div>
          {selectedTemplate && (
            <Button
              variant="primary"
              size="sm"
              className="w-full mt-3"
              onClick={() => {
                // Template application logic would go here
                alert(`Applied template: ${selectedTemplate}`)
              }}
            >
              {t('contextManager.applyTemplate')}
            </Button>
          )}
        </div>

        {/* Pinned Messages */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">
            {t('contextManager.pinnedMessages')}
          </h2>
          {pinnedMessages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-text-tertiary">{t('contextManager.noPins')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pinnedMessages.map((pin) => (
                <div
                  key={pin.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-lg bg-page border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary mb-1">{pin.label}</p>
                    <p className="text-xs text-text-tertiary">
                      {new Date(pin.createdAt).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => unpinMessage(pin.id)}
                    className="p-1.5 hover:bg-danger/10 rounded-lg transition text-text-tertiary hover:text-danger flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
