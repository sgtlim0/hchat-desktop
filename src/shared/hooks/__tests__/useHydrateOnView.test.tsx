import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useHydrateOnView } from '../useHydrateOnView'
import type { ViewState } from '@/shared/types'

// Mock hydrate functions
const mockSessionHydrate = vi.fn()
const mockFolderHydrate = vi.fn()
const mockTagHydrate = vi.fn()
const mockUsageHydrate = vi.fn()
const mockPersonaHydrate = vi.fn()
const mockProjectHydrate = vi.fn()

// Mock stores
vi.mock('@/entities/session/session.store', () => ({
  useSessionStore: {
    getState: () => ({ hydrate: mockSessionHydrate }),
  },
}))

vi.mock('@/entities/folder/folder.store', () => ({
  useFolderStore: {
    getState: () => ({ hydrate: mockFolderHydrate }),
  },
}))

vi.mock('@/entities/tag/tag.store', () => ({
  useTagStore: {
    getState: () => ({ hydrate: mockTagHydrate }),
  },
}))

vi.mock('@/entities/usage/usage.store', () => ({
  useUsageStore: {
    getState: () => ({ hydrate: mockUsageHydrate }),
  },
}))

vi.mock('@/entities/persona/persona.store', () => ({
  usePersonaStore: {
    getState: () => ({ hydrate: mockPersonaHydrate }),
  },
}))

vi.mock('@/entities/project/project.store', () => ({
  useProjectStore: {
    getState: () => ({ hydrate: mockProjectHydrate }),
  },
}))

// Mock other stores with empty hydrate
const mockEmptyHydrate = vi.fn()
const storeList = [
  'memory',
  'schedule',
  'swarm',
  'channel',
  'knowledge',
  'workflow',
  'collab',
  'audit',
  'batch',
  'cache',
  'plugins/plugin',
  'theme',
  'context-manager',
  'insights',
  'dashboard',
  'workspace',
  'prompt-library',
  'code-interpreter',
  'translation-memory',
  'bookmark',
  'learning-path',
  'report-generator',
  'meeting-notes',
  'code-review',
  'visual-prompt',
  'notification',
  'data-pipeline',
  'mentoring',
  'data-connector',
  'autonomous-agent',
  'mcp',
  'auto-workflow',
  'canvas',
  'knowledge-graph',
  'data-converter',
]

// Create mocks for all other stores
storeList.forEach((storeName) => {
  const modulePath = `@/entities/${storeName}/${storeName.split('/').pop()}.store`
  const hookName = `use${storeName.split('/').pop()?.split('-').map(part =>
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join('')}Store`

  vi.doMock(modulePath, () => ({
    [hookName]: {
      getState: () => ({ hydrate: mockEmptyHydrate }),
    },
  }))
})

describe('useHydrateOnView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hydrates core stores on mount', () => {
    renderHook(() => useHydrateOnView('home' as ViewState))

    // Core stores should be hydrated immediately
    expect(mockSessionHydrate).toHaveBeenCalledTimes(1)
    expect(mockFolderHydrate).toHaveBeenCalledTimes(1)
    expect(mockTagHydrate).toHaveBeenCalledTimes(1)
  })

  it('hydrates view-specific stores when view changes to chat', () => {
    const { rerender } = renderHook(
      ({ view }) => useHydrateOnView(view),
      {
        initialProps: { view: 'home' as ViewState },
      }
    )

    // Clear core hydration calls
    vi.clearAllMocks()

    // Change to chat view
    rerender({ view: 'chat' as ViewState })

    // Chat-specific stores should be hydrated
    expect(mockUsageHydrate).toHaveBeenCalledTimes(1)
    expect(mockPersonaHydrate).toHaveBeenCalledTimes(1)
  })

  it('hydrates project store when navigating to projects view', () => {
    const { rerender } = renderHook(
      ({ view }) => useHydrateOnView(view),
      {
        initialProps: { view: 'home' as ViewState },
      }
    )

    // Clear core hydration calls
    vi.clearAllMocks()

    // Change to projects view
    rerender({ view: 'projects' as ViewState })

    // Project store should be hydrated
    expect(mockProjectHydrate).toHaveBeenCalledTimes(1)
  })

  it('does not re-hydrate stores for already visited views', () => {
    const { rerender } = renderHook(
      ({ view }) => useHydrateOnView(view),
      {
        initialProps: { view: 'home' as ViewState },
      }
    )

    vi.clearAllMocks()

    // Visit chat view
    rerender({ view: 'chat' as ViewState })
    expect(mockUsageHydrate).toHaveBeenCalledTimes(1)

    // Visit another view
    rerender({ view: 'projects' as ViewState })

    // Go back to chat view
    rerender({ view: 'chat' as ViewState })

    // Usage store should not be hydrated again
    expect(mockUsageHydrate).toHaveBeenCalledTimes(1) // Still 1, not 2
  })
})