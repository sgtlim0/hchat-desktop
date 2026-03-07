import { create } from 'zustand'
import type { OrchestraSession, OrchestraAgent, OrchestraRole } from '@/shared/types'
import { getAllOrchestraSessions, putOrchestraSession, deleteOrchestraSessionFromDb } from '@/shared/lib/db'
interface OrchestraState { sessions: OrchestraSession[]; selectedId: string | null; hydrate: () => void; createSession: (title: string, goal: string) => void; deleteSession: (id: string) => void; addAgent: (sessionId: string, name: string, role: OrchestraRole, modelId: string) => void; startOrchestra: (id: string) => void; setAgentOutput: (sessionId: string, agentId: string, output: string) => void; completeOrchestra: (id: string, finalOutput: string) => void; selectSession: (id: string | null) => void }
export const useOrchestraStore = create<OrchestraState>((set) => ({
  sessions: [], selectedId: null,
  hydrate: () => { getAllOrchestraSessions().then((sessions) => set({ sessions })) },
  createSession: (title, goal) => { const s: OrchestraSession = { id: crypto.randomUUID(), title, goal, agents: [], finalOutput: '', status: 'setup', createdAt: new Date().toISOString() }; set((st) => ({ sessions: [s, ...st.sessions], selectedId: s.id })); putOrchestraSession(s) },
  deleteSession: (id) => { set((s) => ({ sessions: s.sessions.filter((ss) => ss.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })); deleteOrchestraSessionFromDb(id) },
  addAgent: (sessionId, name, role, modelId) => { const agent: OrchestraAgent = { id: crypto.randomUUID(), name, role, modelId, output: '', status: 'idle' }; set((s) => ({ sessions: s.sessions.map((ss) => ss.id === sessionId ? { ...ss, agents: [...ss.agents, agent] } : ss) })) },
  startOrchestra: (id) => { set((s) => ({ sessions: s.sessions.map((ss) => ss.id === id ? { ...ss, status: 'running', agents: ss.agents.map((a) => ({ ...a, status: 'running' })) } : ss) })) },
  setAgentOutput: (sessionId, agentId, output) => { set((s) => ({ sessions: s.sessions.map((ss) => ss.id === sessionId ? { ...ss, agents: ss.agents.map((a) => a.id === agentId ? { ...a, output, status: 'done' } : a) } : ss) })) },
  completeOrchestra: (id, finalOutput) => { set((s) => ({ sessions: s.sessions.map((ss) => ss.id === id ? { ...ss, status: 'completed', finalOutput } : ss) })) },
  selectSession: (id) => set({ selectedId: id }),
}))
