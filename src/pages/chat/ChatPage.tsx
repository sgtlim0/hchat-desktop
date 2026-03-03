import { useEffect } from 'react'
import { useSessionStore } from '@/entities/session/session.store'
import { useArtifactStore } from '@/entities/artifact/artifact.store'
import { useTranslation } from '@/shared/i18n'
import { ChatHeader } from './ChatHeader'
import { MessageList } from '@/widgets/message-list/MessageList'
import { PromptInput } from '@/widgets/prompt-input/PromptInput'
import { ArtifactPanel } from '@/widgets/artifact-panel/ArtifactPanel'
import { ResizeHandle } from '@/widgets/artifact-panel/ResizeHandle'

export function ChatPage() {
  const { t } = useTranslation()
  const currentSessionId = useSessionStore((s) => s.currentSessionId)
  const panelOpen = useArtifactStore((s) => s.panelOpen)
  const panelWidth = useArtifactStore((s) => s.panelWidth)
  const setPanelWidth = useArtifactStore((s) => s.setPanelWidth)
  const hydrate = useArtifactStore((s) => s.hydrate)

  // Hydrate artifacts when session changes
  useEffect(() => {
    if (currentSessionId) {
      hydrate(currentSessionId)
    }
  }, [currentSessionId, hydrate])

  if (!currentSessionId) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">
        {t('chat.selectOrStart')}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-row h-full overflow-hidden">
      {/* Chat column */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        <ChatHeader sessionId={currentSessionId} />
        <MessageList sessionId={currentSessionId} />
        <div className="px-4 pb-4">
          <PromptInput />
        </div>
      </div>

      {/* Artifact panel */}
      {panelOpen && (
        <>
          <ResizeHandle onResize={setPanelWidth} panelWidth={panelWidth} />
          <div
            className="flex-shrink-0 h-full hidden md:block"
            style={{ width: panelWidth }}
          >
            <ArtifactPanel sessionId={currentSessionId} />
          </div>
          {/* Mobile overlay */}
          <div className="md:hidden fixed inset-0 z-50">
            <ArtifactPanel sessionId={currentSessionId} />
          </div>
        </>
      )}
    </div>
  )
}
