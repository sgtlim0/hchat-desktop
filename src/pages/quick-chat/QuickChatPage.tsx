import { useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { Avatar } from '@/shared/ui/Avatar'
import { useTranslation } from '@/shared/i18n'

export function QuickChatPage() {
  const { t } = useTranslation()
  const [input, setInput] = useState('')

  const handleSubmit = () => {
    if (input.trim()) {
      // TODO: Send message and switch to main window
      console.log('Quick chat message:', input)
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="h-full flex items-center justify-center p-6 bg-black/5">
      <div className="max-w-[480px] w-full mx-auto bg-page rounded-2xl shadow-2xl border border-border p-5">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar initials="H" size="sm" />
          <div>
            <h1 className="text-lg font-bold text-text-primary">{t('quickChat.title')}</h1>
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-input border border-border-input rounded-xl flex items-center gap-3 px-4 py-3 mb-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('quickChat.placeholder')}
            className="flex-1 bg-transparent text-text-primary text-sm outline-none placeholder:text-text-tertiary"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-hover border border-border rounded text-xs font-medium text-text-secondary">
              Sonnet
            </span>
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Hint */}
        <div className="text-center">
          <p className="text-xs text-text-tertiary">
            <kbd className="px-1.5 py-0.5 bg-hover border border-border rounded text-[10px] font-medium">
              Enter
            </kbd>{' '}
            {t('quickChat.hint')}{' '}
            <kbd className="px-1.5 py-0.5 bg-hover border border-border rounded text-[10px] font-medium">
              Esc
            </kbd>{' '}
            닫기
          </p>
        </div>
      </div>
    </div>
  )
}
