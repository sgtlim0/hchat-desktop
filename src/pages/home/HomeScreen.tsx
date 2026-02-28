import { PromptInput } from '@/widgets/prompt-input/PromptInput'
import { QuickActionChip } from '@/shared/ui/QuickActionChip'
import { QUICK_ACTIONS } from '@/shared/constants'
import { Pencil, FileText, Languages, Lightbulb, SearchCode } from 'lucide-react'

const iconMap = {
  pencil: Pencil,
  'file-text': FileText,
  languages: Languages,
  lightbulb: Lightbulb,
  'search-code': SearchCode,
}

export function HomeScreen() {
  function handleSend(_message: string) {
    // Message handling is done in PromptInput
  }

  function handleQuickAction(_actionId: string) {
    // TODO: Handle quick action click
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-3xl space-y-8">
        {/* Heading with icon */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-text-primary">
            무엇을 도와드릴까요?
          </h1>
        </div>

        {/* Prompt input */}
        <div>
          <PromptInput
            onSend={handleSend}
            placeholder="메시지를 입력하세요..."
          />
        </div>

        {/* Quick actions */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {QUICK_ACTIONS.map((action) => {
            const Icon = iconMap[action.icon as keyof typeof iconMap]
            return (
              <QuickActionChip
                key={action.id}
                icon={Icon}
                label={action.label}
                onClick={() => handleQuickAction(action.id)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
