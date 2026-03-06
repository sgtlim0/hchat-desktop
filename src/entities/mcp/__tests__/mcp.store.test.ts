import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMcpStore } from '../mcp.store'

vi.mock('@/shared/lib/db', () => ({
  getAllMcpServers: vi.fn().mockResolvedValue([]),
  putMcpServer: vi.fn().mockResolvedValue(undefined),
  deleteMcpServerFromDb: vi.fn().mockResolvedValue(undefined),
}))

describe('McpStore', () => {
  beforeEach(() => {
    useMcpStore.setState({ servers: [], selectedServerId: null })
  })

  it('should have empty initial state', () => {
    const s = useMcpStore.getState()
    expect(s.servers).toEqual([])
    expect(s.selectedServerId).toBeNull()
  })

  it('should add a server', async () => {
    await useMcpStore.getState().addServer('Test MCP', 'http://localhost:3001')
    const servers = useMcpStore.getState().servers
    expect(servers).toHaveLength(1)
    expect(servers[0].name).toBe('Test MCP')
    expect(servers[0].status).toBe('disconnected')
    expect(servers[0].tools).toEqual([])
  })

  it('should remove a server', async () => {
    await useMcpStore.getState().addServer('Test', 'http://localhost:3001')
    const id = useMcpStore.getState().servers[0].id
    await useMcpStore.getState().removeServer(id)
    expect(useMcpStore.getState().servers).toHaveLength(0)
  })

  it('should clear selectedServerId when removed', async () => {
    await useMcpStore.getState().addServer('Test', 'http://localhost:3001')
    const id = useMcpStore.getState().servers[0].id
    useMcpStore.getState().setSelectedServerId(id)
    await useMcpStore.getState().removeServer(id)
    expect(useMcpStore.getState().selectedServerId).toBeNull()
  })

  it('should update server status', async () => {
    await useMcpStore.getState().addServer('Test', 'http://localhost:3001')
    const id = useMcpStore.getState().servers[0].id
    await useMcpStore.getState().updateStatus(id, 'connected')
    expect(useMcpStore.getState().servers[0].status).toBe('connected')
    expect(useMcpStore.getState().servers[0].lastConnected).toBeTruthy()
  })

  it('should set tools on a server', async () => {
    await useMcpStore.getState().addServer('Test', 'http://localhost:3001')
    const id = useMcpStore.getState().servers[0].id
    const tools = [{ name: 'read_file', description: 'Read file', parameters: {} }]
    await useMcpStore.getState().setTools(id, tools)
    expect(useMcpStore.getState().servers[0].tools).toHaveLength(1)
    expect(useMcpStore.getState().servers[0].tools[0].name).toBe('read_file')
  })

  it('should connect server (simulate)', async () => {
    vi.useFakeTimers()
    await useMcpStore.getState().addServer('Test', 'http://localhost:3001')
    const id = useMcpStore.getState().servers[0].id
    await useMcpStore.getState().connectServer(id)
    expect(useMcpStore.getState().servers[0].status).toBe('connecting')
    await vi.advanceTimersByTimeAsync(600)
    expect(useMcpStore.getState().servers[0].status).toBe('connected')
    expect(useMcpStore.getState().servers[0].tools.length).toBeGreaterThan(0)
    vi.useRealTimers()
  })

  it('should disconnect server', async () => {
    await useMcpStore.getState().addServer('Test', 'http://localhost:3001')
    const id = useMcpStore.getState().servers[0].id
    await useMcpStore.getState().updateStatus(id, 'connected')
    await useMcpStore.getState().disconnectServer(id)
    expect(useMcpStore.getState().servers[0].status).toBe('disconnected')
    expect(useMcpStore.getState().servers[0].tools).toEqual([])
  })

  it('should hydrate from db', async () => {
    const { getAllMcpServers } = await import('@/shared/lib/db')
    vi.mocked(getAllMcpServers).mockResolvedValue([
      { id: '1', name: 'Server', url: 'http://localhost', status: 'disconnected', tools: [], createdAt: '' },
    ])
    await useMcpStore.getState().hydrate()
    expect(useMcpStore.getState().servers).toHaveLength(1)
  })
})
