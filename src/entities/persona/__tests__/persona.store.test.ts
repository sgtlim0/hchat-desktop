import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePersonaStore } from '../persona.store'
import type { Persona } from '@/shared/types'

vi.mock('@/shared/lib/db', () => ({
  getAllPersonas: vi.fn().mockResolvedValue([]),
  putPersona: vi.fn().mockResolvedValue(undefined),
  deletePersonaFromDb: vi.fn().mockResolvedValue(undefined),
}))

function makePersona(overrides: Partial<Persona> = {}): Persona {
  return {
    id: `persona-${Date.now()}`,
    name: 'Test Persona',
    description: 'A test persona',
    systemPrompt: 'You are a test assistant.',
    icon: '🧪',
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function resetStore() {
  usePersonaStore.setState({ personas: [], activePersonaId: null, hydrated: false })
}

describe('usePersonaStore', () => {
  beforeEach(() => {
    resetStore()
  })

  it('starts with empty personas', () => {
    const { personas, activePersonaId } = usePersonaStore.getState()
    expect(personas).toEqual([])
    expect(activePersonaId).toBeNull()
  })

  it('addPersona appends persona', () => {
    const p1 = makePersona({ id: 'p1' })
    usePersonaStore.getState().addPersona(p1)

    expect(usePersonaStore.getState().personas).toHaveLength(1)
    expect(usePersonaStore.getState().personas[0].id).toBe('p1')
  })

  it('updatePersona modifies persona and sets updatedAt', () => {
    const persona = makePersona({ id: 'p1', name: 'Original' })
    usePersonaStore.getState().addPersona(persona)

    usePersonaStore.getState().updatePersona('p1', { name: 'Updated' })

    const updated = usePersonaStore.getState().personas.find((p) => p.id === 'p1')
    expect(updated?.name).toBe('Updated')
  })

  it('deletePersona removes non-default persona', () => {
    usePersonaStore.getState().addPersona(makePersona({ id: 'p1', isDefault: false }))

    usePersonaStore.getState().deletePersona('p1')
    expect(usePersonaStore.getState().personas).toHaveLength(0)
  })

  it('deletePersona does NOT remove default persona', () => {
    usePersonaStore.getState().addPersona(makePersona({ id: 'p1', isDefault: true }))

    usePersonaStore.getState().deletePersona('p1')
    expect(usePersonaStore.getState().personas).toHaveLength(1)
  })

  it('deletePersona clears activePersonaId if deleted persona was active', () => {
    usePersonaStore.getState().addPersona(makePersona({ id: 'p1' }))
    usePersonaStore.getState().setActivePersona('p1')
    expect(usePersonaStore.getState().activePersonaId).toBe('p1')

    usePersonaStore.getState().deletePersona('p1')
    expect(usePersonaStore.getState().activePersonaId).toBeNull()
  })

  it('setActivePersona updates activePersonaId', () => {
    usePersonaStore.getState().setActivePersona('p1')
    expect(usePersonaStore.getState().activePersonaId).toBe('p1')

    usePersonaStore.getState().setActivePersona(null)
    expect(usePersonaStore.getState().activePersonaId).toBeNull()
  })

  it('getActivePersona returns correct persona', () => {
    const persona = makePersona({ id: 'p1' })
    usePersonaStore.getState().addPersona(persona)
    usePersonaStore.getState().setActivePersona('p1')

    expect(usePersonaStore.getState().getActivePersona()?.id).toBe('p1')
  })

  it('getActivePersona returns undefined when no active persona', () => {
    expect(usePersonaStore.getState().getActivePersona()).toBeUndefined()
  })
})
