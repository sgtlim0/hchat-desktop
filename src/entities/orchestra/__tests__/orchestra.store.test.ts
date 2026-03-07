import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useOrchestraStore } from '../orchestra.store'
vi.mock('@/shared/lib/db', () => ({ getAllOrchestraSessions: vi.fn().mockResolvedValue([]), putOrchestraSession: vi.fn(), deleteOrchestraSessionFromDb: vi.fn() }))
describe('OrchestraStore', () => {
  beforeEach(() => { useOrchestraStore.setState({ sessions: [], selectedId: null }) })
  it('should create session', () => { useOrchestraStore.getState().createSession('Report', 'Write a report'); expect(useOrchestraStore.getState().sessions[0].status).toBe('setup') })
  it('should add agent', () => { useOrchestraStore.getState().createSession('T', 'G'); const id = useOrchestraStore.getState().sessions[0].id; useOrchestraStore.getState().addAgent(id, 'R1', 'researcher', 'claude'); expect(useOrchestraStore.getState().sessions[0].agents).toHaveLength(1) })
  it('should start orchestra', () => { useOrchestraStore.getState().createSession('T', 'G'); const id = useOrchestraStore.getState().sessions[0].id; useOrchestraStore.getState().addAgent(id, 'R1', 'writer', 'gpt'); useOrchestraStore.getState().startOrchestra(id); expect(useOrchestraStore.getState().sessions[0].status).toBe('running') })
  it('should complete', () => { useOrchestraStore.getState().createSession('T', 'G'); const id = useOrchestraStore.getState().sessions[0].id; useOrchestraStore.getState().completeOrchestra(id, 'Final result'); expect(useOrchestraStore.getState().sessions[0].finalOutput).toBe('Final result') })
  it('should delete', () => { useOrchestraStore.getState().createSession('T', 'G'); useOrchestraStore.getState().deleteSession(useOrchestraStore.getState().sessions[0].id); expect(useOrchestraStore.getState().sessions).toHaveLength(0) })
})
