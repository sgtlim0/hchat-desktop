import { useSessionStore } from '@/entities/session/session.store'
import { useTranslation } from '@/shared/i18n'
import { ChatHeader } from './ChatHeader'
import { MessageList } from '@/widgets/message-list/MessageList'
import { PromptInput } from '@/widgets/prompt-input/PromptInput'

export function ChatPage() {
  const { t } = useTranslation()
  const currentSessionId = useSessionStore((s) => s.currentSessionId)

  if (!currentSessionId) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">
        {t('chat.selectOrStart')}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatHeader sessionId={currentSessionId} />
      <MessageList sessionId={currentSessionId} />
      <div className="px-4 pb-4">
        <PromptInput />
      </div>
    </div>
  )
}
