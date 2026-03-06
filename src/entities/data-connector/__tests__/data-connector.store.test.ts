import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDataConnectorStore } from '../data-connector.store'

vi.mock('@/shared/lib/db', () => ({
  getAllDataConnectors: vi.fn().mockResolvedValue([]),
  putDataConnector: vi.fn().mockResolvedValue(undefined),
  deleteDataConnectorFromDb: vi.fn().mockResolvedValue(undefined),
}))

describe('DataConnectorStore', () => {
  beforeEach(() => {
    useDataConnectorStore.setState({ connectors: [], selectedConnectorId: null })
  })

  it('should have empty initial state', () => {
    const s = useDataConnectorStore.getState()
    expect(s.connectors).toEqual([])
    expect(s.selectedConnectorId).toBeNull()
  })

  it('should add a connector', async () => {
    await useDataConnectorStore.getState().addConnector('github', 'My GitHub', { token: 'gh-xxx' })
    const connectors = useDataConnectorStore.getState().connectors
    expect(connectors).toHaveLength(1)
    expect(connectors[0].type).toBe('github')
    expect(connectors[0].name).toBe('My GitHub')
    expect(connectors[0].status).toBe('disconnected')
  })

  it('should remove a connector', async () => {
    await useDataConnectorStore.getState().addConnector('notion', 'Notion', {})
    const id = useDataConnectorStore.getState().connectors[0].id
    await useDataConnectorStore.getState().removeConnector(id)
    expect(useDataConnectorStore.getState().connectors).toHaveLength(0)
  })

  it('should clear selectedConnectorId when removed', async () => {
    await useDataConnectorStore.getState().addConnector('github', 'GH', {})
    const id = useDataConnectorStore.getState().connectors[0].id
    useDataConnectorStore.getState().setSelectedConnectorId(id)
    await useDataConnectorStore.getState().removeConnector(id)
    expect(useDataConnectorStore.getState().selectedConnectorId).toBeNull()
  })

  it('should update status', async () => {
    await useDataConnectorStore.getState().addConnector('github', 'GH', {})
    const id = useDataConnectorStore.getState().connectors[0].id
    await useDataConnectorStore.getState().updateStatus(id, 'connected')
    expect(useDataConnectorStore.getState().connectors[0].status).toBe('connected')
  })

  it('should update config', async () => {
    await useDataConnectorStore.getState().addConnector('notion', 'Notion', { token: 'old' })
    const id = useDataConnectorStore.getState().connectors[0].id
    await useDataConnectorStore.getState().updateConfig(id, { token: 'new' })
    expect(useDataConnectorStore.getState().connectors[0].config.token).toBe('new')
  })

  it('should sync connector', async () => {
    await useDataConnectorStore.getState().addConnector('google_sheets', 'Sheets', {})
    const id = useDataConnectorStore.getState().connectors[0].id
    await useDataConnectorStore.getState().syncConnector(id)
    expect(useDataConnectorStore.getState().connectors[0].status).toBe('connected')
    expect(useDataConnectorStore.getState().connectors[0].lastSynced).toBeTruthy()
  })

  it('should hydrate from db', async () => {
    const { getAllDataConnectors } = await import('@/shared/lib/db')
    vi.mocked(getAllDataConnectors).mockResolvedValue([
      { id: '1', type: 'github', name: 'GH', status: 'connected', config: {}, createdAt: '' },
    ])
    await useDataConnectorStore.getState().hydrate()
    expect(useDataConnectorStore.getState().connectors).toHaveLength(1)
  })
})
