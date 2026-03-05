import { useShallow } from 'zustand/react/shallow'
import { Brain, Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { useMemoryStore } from '@/entities/memory/memory.store'
import { Button } from '@/shared/ui/Button'
import { Toggle } from '@/shared/ui/Toggle'
import { useTranslation } from '@/shared/i18n'
import type { MemoryScope } from '@/shared/types'

export function MemoryPanel() {
  const { t } = useTranslation()
  const {
    scope,
    autoExtract,
    searchQuery,
    setScope,
    setAutoExtract,
    setSearchQuery,
    deleteEntry,
    filteredEntries,
  } = useMemoryStore(
    useShallow((s) => ({
      scope: s.scope,
      autoExtract: s.autoExtract,
      searchQuery: s.searchQuery,
      setScope: s.setScope,
      setAutoExtract: s.setAutoExtract,
      setSearchQuery: s.setSearchQuery,
      deleteEntry: s.deleteEntry,
      filteredEntries: s.filteredEntries,
    }))
  )

  const SCOPE_TABS: { id: MemoryScope; label: string }[] = [
    { id: 'session', label: t('memory.sessionMemory') },
    { id: 'project', label: t('memory.projectMemory') },
  ]

  const entries = filteredEntries()

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain size={18} className="text-primary" />
            </div>
            <h1 className="text-xl font-bold text-text-primary">{t('memory.title')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">{t('memory.autoExtract')}</span>
              <Toggle checked={autoExtract} onChange={setAutoExtract} />
            </div>
            <Button variant="primary" size="sm" className="gap-1.5">
              <Plus size={14} />
              {t('common.add')}
            </Button>
          </div>
        </div>
      </div>

      {/* Scope tabs + Search */}
      <div className="flex-shrink-0 px-6 py-3 space-y-3">
        <div className="flex gap-1 bg-page rounded-lg p-1">
          {SCOPE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setScope(tab.id)}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                scope === tab.id
                  ? 'bg-card text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder={t('memory.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-input text-text-primary text-sm outline-none focus:border-primary transition placeholder:text-text-tertiary"
          />
        </div>
      </div>

      {/* Memory list */}
      <div className="flex-1 overflow-y-auto px-6 py-2">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Brain size={32} className="text-primary/50" />
            </div>
            <p className="text-text-secondary text-sm font-medium">{t('memory.empty')}</p>
            <p className="text-text-tertiary text-xs mt-1 whitespace-pre-line">
              {t('memory.emptyHint')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-semibold">
                        {entry.key}
                      </span>
                      <span className="text-[10px] text-text-tertiary uppercase tracking-wider">
                        {entry.source === 'auto' ? t('memory.auto') : t('memory.manual')}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{entry.value}</p>
                    <p className="text-[11px] text-text-tertiary mt-2">
                      {new Date(entry.updatedAt).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button className="p-1.5 hover:bg-hover rounded-lg transition text-text-tertiary hover:text-text-primary">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="p-1.5 hover:bg-danger/10 rounded-lg transition text-text-tertiary hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
