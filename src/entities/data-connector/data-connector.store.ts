import { create } from 'zustand'
import type { DataConnector, ConnectorType, ConnectorStatus } from '@/shared/types'
import { getAllDataConnectors, putDataConnector, deleteDataConnectorFromDb } from '@/shared/lib/db'

interface DataConnectorState {
  connectors: DataConnector[]
  selectedConnectorId: string | null

  hydrate: () => Promise<void>
  addConnector: (type: ConnectorType, name: string, config: Record<string, string>) => Promise<void>
  removeConnector: (id: string) => Promise<void>
  updateStatus: (id: string, status: ConnectorStatus) => Promise<void>
  updateConfig: (id: string, config: Record<string, string>) => Promise<void>
  syncConnector: (id: string) => Promise<void>
  setSelectedConnectorId: (id: string | null) => void
}

export const useDataConnectorStore = create<DataConnectorState>()((set, get) => ({
  connectors: [],
  selectedConnectorId: null,

  hydrate: async () => {
    const connectors = await getAllDataConnectors()
    set({ connectors })
  },

  addConnector: async (type, name, config) => {
    const connector: DataConnector = {
      id: crypto.randomUUID(), type, name, status: 'disconnected',
      config, createdAt: new Date().toISOString(),
    }
    await putDataConnector(connector)
    set((s) => ({ connectors: [...s.connectors, connector] }))
  },

  removeConnector: async (id) => {
    await deleteDataConnectorFromDb(id)
    set((s) => ({
      connectors: s.connectors.filter((c) => c.id !== id),
      selectedConnectorId: s.selectedConnectorId === id ? null : s.selectedConnectorId,
    }))
  },

  updateStatus: async (id, status) => {
    const connector = get().connectors.find((c) => c.id === id)
    if (!connector) return
    const updated = { ...connector, status }
    await putDataConnector(updated)
    set((s) => ({ connectors: s.connectors.map((c) => (c.id === id ? updated : c)) }))
  },

  updateConfig: async (id, config) => {
    const connector = get().connectors.find((c) => c.id === id)
    if (!connector) return
    const updated = { ...connector, config }
    await putDataConnector(updated)
    set((s) => ({ connectors: s.connectors.map((c) => (c.id === id ? updated : c)) }))
  },

  syncConnector: async (id) => {
    await get().updateStatus(id, 'connected')
    const connector = get().connectors.find((c) => c.id === id)
    if (!connector) return
    const updated = { ...connector, status: 'connected' as const, lastSynced: new Date().toISOString() }
    await putDataConnector(updated)
    set((s) => ({ connectors: s.connectors.map((c) => (c.id === id ? updated : c)) }))
  },

  setSelectedConnectorId: (selectedConnectorId) => set({ selectedConnectorId }),
}))
