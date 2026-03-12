import { create } from 'zustand'
import type { Persona } from '@hchat/shared'
import { DEFAULT_PERSONAS } from '@hchat/shared'

interface ExtPersonaState {
  personas: Persona[]
  selectedPersonaId: string | null

  selectPersona: (id: string | null) => void
  getSelectedPersona: () => Persona | undefined
}

export const useExtPersonaStore = create<ExtPersonaState>((set, get) => ({
  personas: DEFAULT_PERSONAS,
  selectedPersonaId: null,

  selectPersona: (id) => set({ selectedPersonaId: id }),

  getSelectedPersona: () => {
    const { personas, selectedPersonaId } = get()
    if (!selectedPersonaId) return undefined
    return personas.find(p => p.id === selectedPersonaId)
  },
}))
