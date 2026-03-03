import { create } from 'zustand'
import type { Artifact, ArtifactType } from '@/shared/types'
import { getArtifactsBySession, putArtifact, deleteArtifactFromDb } from '@/shared/lib/db'

type ViewMode = 'preview' | 'code'

interface ArtifactState {
  artifacts: Record<string, Artifact[]>  // sessionId → artifacts
  activeArtifactId: string | null
  panelOpen: boolean
  panelWidth: number
  viewMode: ViewMode

  hydrate: (sessionId: string) => Promise<void>
  createArtifact: (params: {
    sessionId: string
    messageId: string
    title: string
    language: string
    type: ArtifactType
    content: string
  }) => Artifact
  addVersion: (artifactId: string, content: string) => void
  openArtifact: (artifactId: string) => void
  closePanel: () => void
  setPanelWidth: (width: number) => void
  setViewMode: (mode: ViewMode) => void
  deleteArtifact: (artifactId: string) => void
  setCurrentVersion: (artifactId: string, index: number) => void
  getActiveArtifact: () => Artifact | null
}

const PANEL_WIDTH_KEY = 'hchat-artifact-panel-width'
const DEFAULT_PANEL_WIDTH = 480

function loadPanelWidth(): number {
  try {
    const saved = localStorage.getItem(PANEL_WIDTH_KEY)
    if (saved) {
      const width = Number(saved)
      if (width >= 320 && width <= 960) return width
    }
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_PANEL_WIDTH
}

function savePanelWidth(width: number): void {
  try {
    localStorage.setItem(PANEL_WIDTH_KEY, String(width))
  } catch {
    // localStorage unavailable
  }
}

export const useArtifactStore = create<ArtifactState>((set, get) => ({
  artifacts: {},
  activeArtifactId: null,
  panelOpen: false,
  panelWidth: loadPanelWidth(),
  viewMode: 'preview',

  hydrate: async (sessionId: string) => {
    const existing = get().artifacts[sessionId]
    if (existing) return
    try {
      const artifacts = await getArtifactsBySession(sessionId)
      set((state) => ({
        artifacts: { ...state.artifacts, [sessionId]: artifacts },
      }))
    } catch (error) {
      console.error('Failed to hydrate artifacts:', error)
    }
  },

  createArtifact: (params) => {
    const now = new Date().toISOString()
    const versionId = `ver-${Date.now()}`
    const artifact: Artifact = {
      id: `artifact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sessionId: params.sessionId,
      messageId: params.messageId,
      title: params.title,
      language: params.language,
      type: params.type,
      versions: [{ id: versionId, content: params.content, createdAt: now }],
      currentVersionIndex: 0,
      createdAt: now,
      updatedAt: now,
    }

    set((state) => {
      const sessionArtifacts = state.artifacts[params.sessionId] ?? []
      return {
        artifacts: {
          ...state.artifacts,
          [params.sessionId]: [...sessionArtifacts, artifact],
        },
      }
    })

    putArtifact(artifact).catch(console.error)
    return artifact
  },

  addVersion: (artifactId: string, content: string) => {
    const now = new Date().toISOString()
    const versionId = `ver-${Date.now()}`

    set((state) => {
      const newArtifacts = { ...state.artifacts }
      for (const sessionId of Object.keys(newArtifacts)) {
        const list = newArtifacts[sessionId]
        const idx = list.findIndex((a) => a.id === artifactId)
        if (idx !== -1) {
          const artifact = list[idx]
          const updated: Artifact = {
            ...artifact,
            versions: [...artifact.versions, { id: versionId, content, createdAt: now }],
            currentVersionIndex: artifact.versions.length,
            updatedAt: now,
          }
          newArtifacts[sessionId] = list.map((a, i) => (i === idx ? updated : a))
          putArtifact(updated).catch(console.error)
          break
        }
      }
      return { artifacts: newArtifacts }
    })
  },

  openArtifact: (artifactId: string) => {
    set({ activeArtifactId: artifactId, panelOpen: true, viewMode: 'preview' })
  },

  closePanel: () => {
    set({ panelOpen: false, activeArtifactId: null })
  },

  setPanelWidth: (width: number) => {
    const clamped = Math.max(320, Math.min(960, width))
    savePanelWidth(clamped)
    set({ panelWidth: clamped })
  },

  setViewMode: (mode: ViewMode) => {
    set({ viewMode: mode })
  },

  deleteArtifact: (artifactId: string) => {
    set((state) => {
      const newArtifacts = { ...state.artifacts }
      for (const sessionId of Object.keys(newArtifacts)) {
        const list = newArtifacts[sessionId]
        const filtered = list.filter((a) => a.id !== artifactId)
        if (filtered.length !== list.length) {
          newArtifacts[sessionId] = filtered
          break
        }
      }
      const newActive = state.activeArtifactId === artifactId ? null : state.activeArtifactId
      const newPanelOpen = newActive ? state.panelOpen : false
      return { artifacts: newArtifacts, activeArtifactId: newActive, panelOpen: newPanelOpen }
    })
    deleteArtifactFromDb(artifactId).catch(console.error)
  },

  setCurrentVersion: (artifactId: string, index: number) => {
    set((state) => {
      const newArtifacts = { ...state.artifacts }
      for (const sessionId of Object.keys(newArtifacts)) {
        const list = newArtifacts[sessionId]
        const idx = list.findIndex((a) => a.id === artifactId)
        if (idx !== -1) {
          const artifact = list[idx]
          if (index >= 0 && index < artifact.versions.length) {
            const updated: Artifact = { ...artifact, currentVersionIndex: index, updatedAt: new Date().toISOString() }
            newArtifacts[sessionId] = list.map((a, i) => (i === idx ? updated : a))
            putArtifact(updated).catch(console.error)
          }
          break
        }
      }
      return { artifacts: newArtifacts }
    })
  },

  getActiveArtifact: () => {
    const state = get()
    if (!state.activeArtifactId) return null
    for (const list of Object.values(state.artifacts)) {
      const found = list.find((a) => a.id === state.activeArtifactId)
      if (found) return found
    }
    return null
  },
}))
