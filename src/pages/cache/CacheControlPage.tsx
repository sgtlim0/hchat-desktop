import { useShallow } from 'zustand/react/shallow'
import { X, HardDrive, Search, Trash2 } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useCacheStore } from '@/entities/cache/cache.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'
import { Toggle } from '@/shared/ui/Toggle'

export function CacheControlPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const {
    entries,
    isEnabled,
    ttlDays,
    searchQuery,
    toggleEnabled,
    setTtlDays,
    setSearchQuery,
    deleteEntry,
    clearAll,
    getTotalSaved,
    getFilteredEntries,
  } = useCacheStore(
    useShallow((s) => ({
      entries: s.entries,
      isEnabled: s.isEnabled,
      ttlDays: s.ttlDays,
      searchQuery: s.searchQuery,
      toggleEnabled: s.toggleEnabled,
      setTtlDays: s.setTtlDays,
      setSearchQuery: s.setSearchQuery,
      deleteEntry: s.deleteEntry,
      clearAll: s.clearAll,
      getTotalSaved: s.getTotalSaved,
      getFilteredEntries: s.getFilteredEntries,
    }))
  )

  const totalSaved = getTotalSaved()
  const filteredEntries = getFilteredEntries()

  function handleClearAll() {
    if (confirm(t('cache.clearConfirm'))) {
      clearAll()
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b dark:border-zinc-700">
        <button
          onClick={() => setView('home')}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          aria-label={t('common.close')}
        >
          <X className="w-5 h-5" />
        </button>
        <HardDrive className="w-5 h-5" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{t('cache.title')}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('cache.subtitle')}</p>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        {/* Stats Bar */}
        <div className="p-4 border-b dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">{t('cache.entries')}</div>
              <div className="text-2xl font-bold">{entries.length}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">{t('cache.tokensSaved')}</div>
              <div className="text-2xl font-bold">{totalSaved.tokens.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">{t('cache.totalSaved')}</div>
              <div className="text-2xl font-bold">${totalSaved.cost.toFixed(4)}</div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="p-4 space-y-4 border-b dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{t('cache.enabled')}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">{t('cache.enabledDesc')}</div>
            </div>
            <Toggle checked={isEnabled} onChange={toggleEnabled} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('cache.ttl')}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={ttlDays}
                onChange={(e) => setTtlDays(Number(e.target.value))}
                min={1}
                max={90}
                className="w-20 px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
              />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {t('cache.ttlDays').replace('{days}', String(ttlDays))}
              </span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b dark:border-zinc-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('cache.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
            />
          </div>
        </div>

        {/* Entries List */}
        <div className="p-4">
          {filteredEntries.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-center">
              <div>
                <HardDrive className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
                <p className="text-zinc-500 dark:text-zinc-400">{t('cache.noEntries')}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="border dark:border-zinc-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-2 mb-2">{entry.promptPreview}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                          {entry.modelId}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                          {t('cache.hitCount').replace('{count}', String(entry.hitCount))}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <div className="flex gap-3">
                      <span>{t('cache.tokensSaved')}: {entry.tokensSaved.toLocaleString()}</span>
                      <span>${entry.costSaved.toFixed(6)}</span>
                    </div>
                    <span>
                      {t('cache.expires')}: {new Date(entry.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      {entries.length > 0 && (
        <div className="p-4 border-t dark:border-zinc-700 flex justify-end">
          <Button onClick={handleClearAll} className="bg-red-600 hover:bg-red-700 text-white">
            {t('cache.clearAll')}
          </Button>
        </div>
      )}
    </div>
  )
}
