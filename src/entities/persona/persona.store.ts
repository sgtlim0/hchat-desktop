import { create } from 'zustand'
import type { Persona } from '@/shared/types'
import { getAllPersonas, putPersona, deletePersonaFromDb } from '@/shared/lib/db'
import { DEFAULT_PERSONAS } from '@/shared/constants'

interface PersonaState {
  personas: Persona[]
  activePersonaId: string | null
  hydrated: boolean

  hydrate: () => Promise<void>
  addPersona: (persona: Persona) => void
  updatePersona: (id: string, updates: Partial<Persona>) => void
  deletePersona: (id: string) => void
  setActivePersona: (id: string | null) => void
  getActivePersona: () => Persona | undefined
}

export const usePersonaStore = create<PersonaState>((set, get) => ({
  personas: [],
  activePersonaId: null,
  hydrated: false,

  hydrate: async () => {
    try {
      let personas = await getAllPersonas()

      // Seed default personas if none exist
      if (personas.length === 0) {
        for (const preset of DEFAULT_PERSONAS) {
          await putPersona(preset)
        }
        personas = DEFAULT_PERSONAS
      }

      set({ personas, hydrated: true })
    } catch (error) {
      console.error('Failed to hydrate persona store:', error)
      set({ personas: DEFAULT_PERSONAS, hydrated: true })
    }
  },

  addPersona: (persona) => {
    set((state) => ({ personas: [...state.personas, persona] }))
    putPersona(persona).catch(console.error)
  },

  updatePersona: (id, updates) => {
    set((state) => ({
      personas: state.personas.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p,
      ),
    }))
    const updated = get().personas.find((p) => p.id === id)
    if (updated) putPersona(updated).catch(console.error)
  },

  deletePersona: (id) => {
    const persona = get().personas.find((p) => p.id === id)
    if (persona?.isDefault) return // Prevent deleting default personas

    set((state) => ({
      personas: state.personas.filter((p) => p.id !== id),
      activePersonaId: state.activePersonaId === id ? null : state.activePersonaId,
    }))
    deletePersonaFromDb(id).catch(console.error)
  },

  setActivePersona: (id) => {
    set({ activePersonaId: id })
  },

  getActivePersona: () => {
    const { personas, activePersonaId } = get()
    return personas.find((p) => p.id === activePersonaId)
  },
}))
