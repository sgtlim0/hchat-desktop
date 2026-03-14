import { useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from '@hchat/shared'
import { ExtSessionList } from '@ext/components/ExtSessionList'

export function HistoryPage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="px-3 py-2.5 border-b border-[var(--border)]">
        <h1 className="text-sm font-bold text-[var(--text-primary)] mb-2">
          {t('allChats.title')}
        </h1>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('allChats.searchPlaceholder')}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
      </header>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <ExtSessionList searchQuery={searchQuery} />
      </div>
    </div>
  )
}
