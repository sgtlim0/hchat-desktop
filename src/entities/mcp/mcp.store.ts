import { create } from 'zustand'
import type { McpServer, McpServerStatus, McpTool } from '@/shared/types'
import { getAllMcpServers, putMcpServer, deleteMcpServerFromDb } from '@/shared/lib/db'

interface McpState {
  servers: McpServer[]
  selectedServerId: string | null

  hydrate: () => Promise<void>
  addServer: (name: string, url: string) => Promise<void>
  removeServer: (id: string) => Promise<void>
  updateStatus: (id: string, status: McpServerStatus) => Promise<void>
  setTools: (id: string, tools: McpTool[]) => Promise<void>
  connectServer: (id: string) => Promise<void>
  disconnectServer: (id: string) => Promise<void>
  setSelectedServerId: (id: string | null) => void
}

export const useMcpStore = create<McpState>()((set, get) => ({
  servers: [],
  selectedServerId: null,

  hydrate: async () => {
    const servers = await getAllMcpServers()
    set({ servers })
  },

  addServer: async (name, url) => {
    const server: McpServer = {
      id: crypto.randomUUID(), name, url, status: 'disconnected',
      tools: [], createdAt: new Date().toISOString(),
    }
    await putMcpServer(server)
    set((s) => ({ servers: [...s.servers, server] }))
  },

  removeServer: async (id) => {
    await deleteMcpServerFromDb(id)
    set((s) => ({
      servers: s.servers.filter((sv) => sv.id !== id),
      selectedServerId: s.selectedServerId === id ? null : s.selectedServerId,
    }))
  },

  updateStatus: async (id, status) => {
    const server = get().servers.find((s) => s.id === id)
    if (!server) return
    const updated = { ...server, status, lastConnected: status === 'connected' ? new Date().toISOString() : server.lastConnected }
    await putMcpServer(updated)
    set((s) => ({ servers: s.servers.map((sv) => (sv.id === id ? updated : sv)) }))
  },

  setTools: async (id, tools) => {
    const server = get().servers.find((s) => s.id === id)
    if (!server) return
    const updated = { ...server, tools }
    await putMcpServer(updated)
    set((s) => ({ servers: s.servers.map((sv) => (sv.id === id ? updated : sv)) }))
  },

  connectServer: async (id) => {
    await get().updateStatus(id, 'connecting')
    // Simulate connection — real MCP would use WebSocket/SSE
    setTimeout(async () => {
      const demoTools: McpTool[] = [
        { name: 'read_file', description: 'Read file contents', parameters: { path: { type: 'string', description: 'File path' } } },
        { name: 'list_dir', description: 'List directory', parameters: { path: { type: 'string', description: 'Directory path' } } },
      ]
      await get().updateStatus(id, 'connected')
      await get().setTools(id, demoTools)
    }, 500)
  },

  disconnectServer: async (id) => {
    await get().updateStatus(id, 'disconnected')
    await get().setTools(id, [])
  },

  setSelectedServerId: (selectedServerId) => set({ selectedServerId }),
}))
