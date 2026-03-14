import { useExtSessionStore } from '@ext/stores/session.store'
import { useExtSettingsStore } from '@ext/stores/settings.store'
import { ExtChatHeader } from '@ext/components/ExtChatHeader'
import { ExtMessageList } from '@ext/components/ExtMessageList'
import { ExtPromptInput } from '@ext/components/ExtPromptInput'

export function ChatPage() {
  const currentSessionId = useExtSessionStore((s) => s.currentSessionId)
  const createSession = useExtSessionStore((s) => s.createSession)
  const selectedModel = useExtSettingsStore((s) => s.selectedModel)

  // Auto-create session if none exists
  const sessionId = currentSessionId ?? (() => {
    const id = createSession(selectedModel)
    return id
  })()

  return (
    <div className="flex flex-col h-full">
      <ExtChatHeader />
      <ExtMessageList sessionId={sessionId} />
      <ExtPromptInput />
    </div>
  )
}
