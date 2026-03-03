import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useArtifactStore } from '../artifact.store'

// Mock db functions
vi.mock('@/shared/lib/db', () => ({
  getArtifactsBySession: vi.fn().mockResolvedValue([]),
  putArtifact: vi.fn().mockResolvedValue(undefined),
  deleteArtifactFromDb: vi.fn().mockResolvedValue(undefined),
}))

describe('useArtifactStore', () => {
  beforeEach(() => {
    useArtifactStore.setState({
      artifacts: {},
      activeArtifactId: null,
      panelOpen: false,
      viewMode: 'preview',
    })
  })

  describe('createArtifact', () => {
    it('creates an artifact and adds it to the session list', () => {
      const store = useArtifactStore.getState()
      const artifact = store.createArtifact({
        sessionId: 'session-1',
        messageId: 'msg-1',
        title: 'fetchData',
        language: 'typescript',
        type: 'code',
        content: 'const x = 1',
      })

      expect(artifact.id).toMatch(/^artifact-/)
      expect(artifact.sessionId).toBe('session-1')
      expect(artifact.versions).toHaveLength(1)
      expect(artifact.versions[0].content).toBe('const x = 1')
      expect(artifact.currentVersionIndex).toBe(0)

      const state = useArtifactStore.getState()
      expect(state.artifacts['session-1']).toHaveLength(1)
    })

    it('appends to existing session artifacts', () => {
      const store = useArtifactStore.getState()
      store.createArtifact({
        sessionId: 'session-1',
        messageId: 'msg-1',
        title: 'first',
        language: 'javascript',
        type: 'code',
        content: 'a',
      })
      store.createArtifact({
        sessionId: 'session-1',
        messageId: 'msg-2',
        title: 'second',
        language: 'html',
        type: 'html',
        content: '<div></div>',
      })

      const state = useArtifactStore.getState()
      expect(state.artifacts['session-1']).toHaveLength(2)
    })
  })

  describe('addVersion', () => {
    it('adds a new version to an artifact', () => {
      const store = useArtifactStore.getState()
      const artifact = store.createArtifact({
        sessionId: 's1',
        messageId: 'm1',
        title: 'test',
        language: 'js',
        type: 'code',
        content: 'v1',
      })

      store.addVersion(artifact.id, 'v2')

      const state = useArtifactStore.getState()
      const updated = state.artifacts['s1'][0]
      expect(updated.versions).toHaveLength(2)
      expect(updated.versions[1].content).toBe('v2')
      expect(updated.currentVersionIndex).toBe(1)
    })
  })

  describe('openArtifact / closePanel', () => {
    it('opens the panel with the specified artifact', () => {
      const store = useArtifactStore.getState()
      const artifact = store.createArtifact({
        sessionId: 's1',
        messageId: 'm1',
        title: 'test',
        language: 'js',
        type: 'code',
        content: 'x',
      })

      store.openArtifact(artifact.id)
      const state = useArtifactStore.getState()
      expect(state.panelOpen).toBe(true)
      expect(state.activeArtifactId).toBe(artifact.id)
    })

    it('closes the panel', () => {
      const store = useArtifactStore.getState()
      store.openArtifact('some-id')
      store.closePanel()

      const state = useArtifactStore.getState()
      expect(state.panelOpen).toBe(false)
      expect(state.activeArtifactId).toBeNull()
    })
  })

  describe('deleteArtifact', () => {
    it('removes the artifact and closes panel if active', () => {
      const store = useArtifactStore.getState()
      const artifact = store.createArtifact({
        sessionId: 's1',
        messageId: 'm1',
        title: 'test',
        language: 'js',
        type: 'code',
        content: 'x',
      })
      store.openArtifact(artifact.id)

      store.deleteArtifact(artifact.id)
      const state = useArtifactStore.getState()
      expect(state.artifacts['s1']).toHaveLength(0)
      expect(state.panelOpen).toBe(false)
      expect(state.activeArtifactId).toBeNull()
    })
  })

  describe('setCurrentVersion', () => {
    it('changes the current version index', () => {
      const store = useArtifactStore.getState()
      const artifact = store.createArtifact({
        sessionId: 's1',
        messageId: 'm1',
        title: 'test',
        language: 'js',
        type: 'code',
        content: 'v1',
      })
      store.addVersion(artifact.id, 'v2')
      store.addVersion(artifact.id, 'v3')

      store.setCurrentVersion(artifact.id, 0)
      const state = useArtifactStore.getState()
      expect(state.artifacts['s1'][0].currentVersionIndex).toBe(0)
    })

    it('ignores out-of-bounds index', () => {
      const store = useArtifactStore.getState()
      const artifact = store.createArtifact({
        sessionId: 's1',
        messageId: 'm1',
        title: 'test',
        language: 'js',
        type: 'code',
        content: 'v1',
      })

      store.setCurrentVersion(artifact.id, 5)
      const state = useArtifactStore.getState()
      expect(state.artifacts['s1'][0].currentVersionIndex).toBe(0)
    })
  })

  describe('viewMode', () => {
    it('toggles between preview and code', () => {
      const store = useArtifactStore.getState()
      expect(store.viewMode).toBe('preview')

      store.setViewMode('code')
      expect(useArtifactStore.getState().viewMode).toBe('code')

      store.setViewMode('preview')
      expect(useArtifactStore.getState().viewMode).toBe('preview')
    })
  })

  describe('panelWidth', () => {
    it('clamps width to valid range', () => {
      const store = useArtifactStore.getState()
      store.setPanelWidth(100)
      expect(useArtifactStore.getState().panelWidth).toBe(320)

      store.setPanelWidth(2000)
      expect(useArtifactStore.getState().panelWidth).toBe(960)

      store.setPanelWidth(500)
      expect(useArtifactStore.getState().panelWidth).toBe(500)
    })
  })

  describe('getActiveArtifact', () => {
    it('returns null when no active artifact', () => {
      const store = useArtifactStore.getState()
      expect(store.getActiveArtifact()).toBeNull()
    })

    it('returns the active artifact', () => {
      const store = useArtifactStore.getState()
      const artifact = store.createArtifact({
        sessionId: 's1',
        messageId: 'm1',
        title: 'test',
        language: 'js',
        type: 'code',
        content: 'x',
      })
      store.openArtifact(artifact.id)
      expect(store.getActiveArtifact()?.id).toBe(artifact.id)
    })
  })
})
