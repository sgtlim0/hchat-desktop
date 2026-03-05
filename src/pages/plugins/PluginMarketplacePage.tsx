import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { X, Puzzle, Search, Shield, Download, Settings, Trash2 } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { usePluginStore } from '@/entities/plugins/plugin.store'
import { useTranslation } from '@/shared/i18n'
import type { Plugin } from '@/shared/types'

export function PluginMarketplacePage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const {
    plugins,
    searchQuery,
    selectedPluginId,
    setSearchQuery,
    selectPlugin,
    installPlugin,
    uninstallPlugin,
    enablePlugin,
    disablePlugin,
    deletePlugin,
  } = usePluginStore(
    useShallow((s) => ({
      plugins: s.plugins,
      searchQuery: s.searchQuery,
      selectedPluginId: s.selectedPluginId,
      setSearchQuery: s.setSearchQuery,
      selectPlugin: s.selectPlugin,
      installPlugin: s.installPlugin,
      uninstallPlugin: s.uninstallPlugin,
      enablePlugin: s.enablePlugin,
      disablePlugin: s.disablePlugin,
      deletePlugin: s.deletePlugin,
    }))
  )

  const [activeTab, setActiveTab] = useState<'all' | 'installed' | 'available'>('all')

  const filteredPlugins = plugins.filter((plugin) => {
    const matchesTab =
      activeTab === 'all' ? true :
      activeTab === 'installed' ? plugin.status === 'installed' :
      activeTab === 'available' ? plugin.status === 'available' :
      false

    const matchesSearch =
      !searchQuery ||
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesTab && matchesSearch
  })

  const selectedPlugin = plugins.find((p) => p.id === selectedPluginId)

  function handleInstall(id: string) {
    installPlugin(id)
  }

  function handleUninstall(id: string) {
    uninstallPlugin(id)
  }

  function handleEnable(id: string) {
    enablePlugin(id)
  }

  function handleDisable(id: string) {
    disablePlugin(id)
  }

  function handleDelete(id: string) {
    if (confirm('플러그인을 삭제하시겠습니까?')) {
      deletePlugin(id)
      selectPlugin(null)
    }
  }

  function getStatusBadge(status: Plugin['status']) {
    if (status === 'installed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
          {t('plugins.installed')}
        </span>
      )
    }
    if (status === 'disabled') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2 py-0.5 text-xs font-medium text-gray-500">
          {t('plugins.disabled')}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
        {t('plugins.available')}
      </span>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <Puzzle className="h-6 w-6 text-text-primary" />
          <div>
            <h1 className="text-xl font-semibold text-text-primary">{t('plugins.title')}</h1>
            <p className="text-sm text-text-secondary">{t('plugins.subtitle')}</p>
          </div>
        </div>
        <button onClick={() => setView('home')} className="rounded-lg p-2 text-text-secondary hover:bg-hover">
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 overflow-hidden">
        <div className="grid h-full grid-cols-[1fr,400px]">
          <div className="flex flex-col border-r border-border">
            <div className="border-b border-border bg-card p-4">
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-background px-3 py-2">
                <Search className="h-4 w-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder={t('plugins.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === 'all'
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-background'
                  }`}
                >
                  {t('plugins.tab.all')}
                </button>
                <button
                  onClick={() => setActiveTab('installed')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === 'installed'
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-background'
                  }`}
                >
                  {t('plugins.tab.installed')}
                </button>
                <button
                  onClick={() => setActiveTab('available')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === 'available'
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-background'
                  }`}
                >
                  {t('plugins.tab.available')}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredPlugins.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <Puzzle className="h-12 w-12 text-text-secondary opacity-30" />
                  <p className="text-sm text-text-secondary">{t('plugins.noPlugins')}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredPlugins.map((plugin) => (
                  <button
                    key={plugin.id}
                    onClick={() => selectPlugin(plugin.id)}
                    className={`flex flex-col gap-3 rounded-xl border p-4 text-left transition-all ${
                      selectedPluginId === plugin.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-border/80 hover:bg-card/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{plugin.icon}</span>
                        <div>
                          <h3 className="font-medium text-text-primary">{plugin.name}</h3>
                          <p className="text-xs text-text-secondary">{plugin.author}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(plugin.status)}
                        <span className="text-xs text-text-secondary">v{plugin.version}</span>
                      </div>
                    </div>

                    <p className="text-sm text-text-secondary">{plugin.description}</p>

                    <div className="flex items-center gap-2">
                      {plugin.status === 'available' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleInstall(plugin.id)
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                        >
                          <Download className="h-4 w-4" />
                          {t('plugins.install')}
                        </button>
                      )}
                      {plugin.status === 'installed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUninstall(plugin.id)
                          }}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-hover"
                        >
                          {t('plugins.uninstall')}
                        </button>
                      )}
                      {plugin.status === 'disabled' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEnable(plugin.id)
                          }}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                        >
                          {t('plugins.enable')}
                        </button>
                      )}
                      {plugin.status === 'installed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDisable(plugin.id)
                          }}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-hover"
                        >
                          {t('plugins.disable')}
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          selectPlugin(plugin.id)
                        }}
                        className="rounded-lg p-1.5 text-text-secondary hover:bg-hover"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col bg-card">
            {selectedPlugin ? (
              <div className="flex h-full flex-col">
                <div className="border-b border-border p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{selectedPlugin.icon}</span>
                      <div>
                        <h2 className="text-lg font-semibold text-text-primary">{selectedPlugin.name}</h2>
                        <p className="text-sm text-text-secondary">{selectedPlugin.author}</p>
                      </div>
                    </div>
                    <button onClick={() => selectPlugin(null)} className="rounded-lg p-2 text-text-secondary hover:bg-hover">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedPlugin.status)}
                    <span className="text-sm text-text-secondary">
                      {t('plugins.version')} {selectedPlugin.version}
                    </span>
                    {selectedPlugin.installedAt && (
                      <span className="text-sm text-text-secondary">
                        • {new Date(selectedPlugin.installedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-2 text-sm font-medium text-text-primary">설명</h3>
                      <p className="text-sm text-text-secondary">{selectedPlugin.description}</p>
                    </div>

                    <div>
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-text-primary">
                        <Shield className="h-4 w-4" />
                        {t('plugins.permissions')}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedPlugin.permissions.map((perm) => (
                          <span
                            key={perm}
                            className="rounded-full bg-background px-2.5 py-1 text-xs text-text-secondary"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-2 text-sm font-medium text-text-primary">{t('plugins.configure')}</h3>
                      <div className="rounded-lg border border-border bg-background p-4">
                        <p className="text-sm text-text-secondary">설정 UI가 여기에 표시됩니다</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border p-4">
                  <button
                    onClick={() => handleDelete(selectedPlugin.id)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    삭제
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <div>
                  <Puzzle className="mx-auto mb-2 h-12 w-12 text-text-secondary opacity-30" />
                  <p className="text-sm text-text-secondary">플러그인을 선택하세요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
