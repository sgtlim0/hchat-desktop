import { useEffect, useState } from 'react'
import { Plus, Trash2, RefreshCw, Link2, FileSpreadsheet, BookOpen, Github } from 'lucide-react'
import { useDataConnectorStore } from '@/entities/data-connector/data-connector.store'
import { useTranslation } from '@/shared/i18n'
import type { ConnectorType } from '@/shared/types'

const CONNECTOR_ICONS: Record<ConnectorType, typeof Github> = {
  google_sheets: FileSpreadsheet, notion: BookOpen, github: Github,
}

const CONNECTOR_LABELS: Record<ConnectorType, string> = {
  google_sheets: 'Google Sheets', notion: 'Notion', github: 'GitHub',
}

export function DataConnectorsPage() {
  const { t } = useTranslation()
  const connectors = useDataConnectorStore((s) => s.connectors)
  const selectedConnectorId = useDataConnectorStore((s) => s.selectedConnectorId)
  const hydrate = useDataConnectorStore((s) => s.hydrate)
  const addConnector = useDataConnectorStore((s) => s.addConnector)
  const removeConnector = useDataConnectorStore((s) => s.removeConnector)
  const syncConnector = useDataConnectorStore((s) => s.syncConnector)
  const setSelectedConnectorId = useDataConnectorStore((s) => s.setSelectedConnectorId)
  const [showAdd, setShowAdd] = useState(false)
  const [newType, setNewType] = useState<ConnectorType>('github')
  const [newName, setNewName] = useState('')

  useEffect(() => { hydrate() }, [hydrate])

  const handleAdd = async () => {
    if (!newName.trim()) return
    await addConnector(newType, newName.trim(), {})
    setNewName(''); setShowAdd(false)
  }

  const types: ConnectorType[] = ['google_sheets', 'notion', 'github']

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />{t('dataConnector.title')}
        </h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm">
          <Plus className="w-4 h-4" />{t('dataConnector.add')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {connectors.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-text-tertiary text-sm">{t('dataConnector.empty')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectors.map((c) => {
              const Icon = CONNECTOR_ICONS[c.type]
              return (
                <div key={c.id} className={`p-4 rounded-xl border ${c.id === selectedConnectorId ? 'border-primary bg-primary/5' : 'border-border bg-surface'} cursor-pointer hover:shadow-md transition-shadow`} onClick={() => setSelectedConnectorId(c.id)}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-text-secondary" />
                      <span className="font-medium text-text-primary text-sm">{c.name}</span>
                    </div>
                    <span className={`w-2.5 h-2.5 rounded-full ${c.status === 'connected' ? 'bg-green-500' : c.status === 'error' ? 'bg-red-500' : 'bg-text-tertiary'}`} />
                  </div>
                  <p className="text-xs text-text-tertiary mb-3">{CONNECTOR_LABELS[c.type]}</p>
                  {c.lastSynced && <p className="text-[10px] text-text-tertiary">{t('dataConnector.lastSync')}: {new Date(c.lastSynced).toLocaleString()}</p>}
                  <div className="flex gap-1.5 mt-3">
                    <button onClick={(e) => { e.stopPropagation(); syncConnector(c.id) }} className="flex items-center gap-1 px-2 py-1 text-xs bg-surface-secondary rounded hover:bg-surface-tertiary">
                      <RefreshCw className="w-3 h-3" />{t('dataConnector.sync')}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); removeConnector(c.id) }} className="p-1 rounded hover:bg-red-500/10" aria-label={t('common.delete')}>
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowAdd(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowAdd(false) }}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        >
          <div className="bg-surface rounded-xl p-6 w-96 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-text-primary">{t('dataConnector.add')}</h3>
            <select value={newType} onChange={(e) => setNewType(e.target.value as ConnectorType)} className="w-full text-sm rounded-lg bg-surface-secondary border border-border px-3 py-2">
              {types.map((tp) => <option key={tp} value={tp}>{CONNECTOR_LABELS[tp]}</option>)}
            </select>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('dataConnector.name')} className="w-full px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border" onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
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
