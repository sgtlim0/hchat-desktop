import { useEffect, useState } from 'react'
import { Plus, Trash2, PlugZap, Unplug, Server, Wrench } from 'lucide-react'
import { useMcpStore } from '@/entities/mcp/mcp.store'
import { useTranslation } from '@/shared/i18n'

export function McpServersPage() {
  const { t } = useTranslation()
  const servers = useMcpStore((s) => s.servers)
  const selectedServerId = useMcpStore((s) => s.selectedServerId)
  const hydrate = useMcpStore((s) => s.hydrate)
  const addServer = useMcpStore((s) => s.addServer)
  const removeServer = useMcpStore((s) => s.removeServer)
  const connectServer = useMcpStore((s) => s.connectServer)
  const disconnectServer = useMcpStore((s) => s.disconnectServer)
  const setSelectedServerId = useMcpStore((s) => s.setSelectedServerId)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')

  useEffect(() => { hydrate() }, [hydrate])

  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) return
    await addServer(name.trim(), url.trim())
    setName(''); setUrl(''); setShowAdd(false)
  }

  const selected = servers.find((s) => s.id === selectedServerId)
  const statusColors = { disconnected: 'text-text-tertiary', connecting: 'text-amber-500 animate-pulse', connected: 'text-green-500', error: 'text-red-500' }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Server className="w-5 h-5 text-primary" />{t('mcp.title')}
        </h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">
          <Plus className="w-4 h-4" />{t('mcp.addServer')}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Server list */}
        <div className="w-72 border-r border-border overflow-y-auto">
          {servers.length === 0 && <p className="p-4 text-sm text-text-tertiary">{t('mcp.empty')}</p>}
          {servers.map((sv) => (
            <div key={sv.id} onClick={() => setSelectedServerId(sv.id)} className={`p-3 border-b border-border cursor-pointer hover:bg-surface-secondary ${sv.id === selectedServerId ? 'bg-surface-secondary' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">{sv.name}</span>
                <span className={`w-2 h-2 rounded-full ${sv.status === 'connected' ? 'bg-green-500' : sv.status === 'connecting' ? 'bg-amber-500' : 'bg-text-tertiary'}`} />
              </div>
              <p className="text-xs text-text-tertiary mt-0.5 truncate">{sv.url}</p>
              <p className={`text-xs mt-0.5 ${statusColors[sv.status]}`}>{t(`mcp.status.${sv.status}`)}</p>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-text-tertiary text-sm">{t('mcp.selectServer')}</div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-primary">{selected.name}</h2>
                <div className="flex gap-2">
                  {selected.status === 'disconnected' ? (
                    <button onClick={() => connectServer(selected.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">
                      <PlugZap className="w-4 h-4" />{t('mcp.connect')}
                    </button>
                  ) : (
                    <button onClick={() => disconnectServer(selected.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary text-text-primary rounded-lg text-sm hover:bg-surface-tertiary">
                      <Unplug className="w-4 h-4" />{t('mcp.disconnect')}
                    </button>
                  )}
                  <button onClick={() => removeServer(selected.id)} className="p-1.5 rounded-lg hover:bg-red-500/10" aria-label={t('common.delete')}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-text-secondary space-y-1">
                <p>URL: <span className="font-mono text-text-primary">{selected.url}</span></p>
                <p>{t('mcp.status.label')}: <span className={statusColors[selected.status]}>{t(`mcp.status.${selected.status}`)}</span></p>
                {selected.lastConnected && <p>{t('mcp.lastConnected')}: {new Date(selected.lastConnected).toLocaleString()}</p>}
              </div>

              {/* Tools */}
              <div>
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5 mb-3">
                  <Wrench className="w-4 h-4" />{t('mcp.tools')} ({selected.tools.length})
                </h3>
                {selected.tools.length === 0 ? (
                  <p className="text-xs text-text-tertiary">{t('mcp.noTools')}</p>
                ) : (
                  <div className="space-y-2">
                    {selected.tools.map((tool) => (
                      <div key={tool.name} className="p-3 rounded-lg bg-surface-secondary">
                        <p className="text-sm font-medium text-text-primary font-mono">{tool.name}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{tool.description}</p>
                        {Object.keys(tool.parameters).length > 0 && (
                          <div className="mt-2 space-y-1">
                            {Object.entries(tool.parameters).map(([k, v]) => (
                              <p key={k} className="text-xs text-text-tertiary">
                                <span className="font-mono text-primary">{k}</span>: {v.description}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAdd(false)}>
          <div className="bg-surface rounded-xl p-6 w-96 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-text-primary">{t('mcp.addServer')}</h3>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('mcp.serverName')} className="w-full px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border" autoFocus />
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://localhost:3001" className="w-full px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border font-mono" onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm rounded-lg bg-surface-secondary">{t('common.cancel')}</button>
              <button onClick={handleAdd} className="px-3 py-1.5 text-sm rounded-lg bg-primary text-white">{t('common.add')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
