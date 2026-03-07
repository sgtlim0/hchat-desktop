import { create } from 'zustand'
import type { TranslationPair, GlossaryTerm } from '@/shared/types'
import {
  getAllTranslationPairs, putTranslationPair, deleteTranslationPairFromDb,
  getAllGlossaryTerms, putGlossaryTerm, deleteGlossaryTermFromDb,
} from '@/shared/lib/db'

interface TranslationMemoryState {
  pairs: TranslationPair[]
  glossary: GlossaryTerm[]

  hydrate: () => Promise<void>
  addPair: (source: string, target: string, sourceLang: string, targetLang: string, domain: string) => Promise<void>
  removePair: (id: string) => Promise<void>
  addGlossaryTerm: (term: string, translation: string, domain: string) => Promise<void>
  removeGlossaryTerm: (id: string) => Promise<void>
  searchPairs: (query: string) => TranslationPair[]
}

export const useTranslationMemoryStore = create<TranslationMemoryState>()((set, get) => ({
  pairs: [],
  glossary: [],

  hydrate: async () => {
    const [pairs, glossary] = await Promise.all([
      getAllTranslationPairs(),
      getAllGlossaryTerms(),
    ])
    set({ pairs, glossary })
  },

  addPair: async (source, target, sourceLang, targetLang, domain) => {
    const pair: TranslationPair = {
      id: crypto.randomUUID(), source, target,
      sourceLang, targetLang, domain,
      usageCount: 0, createdAt: new Date().toISOString(),
    }
    await putTranslationPair(pair)
    set((s) => ({ pairs: [pair, ...s.pairs] }))
  },

  removePair: async (id) => {
    await deleteTranslationPairFromDb(id)
    set((s) => ({ pairs: s.pairs.filter((p) => p.id !== id) }))
  },

  addGlossaryTerm: async (term, translation, domain) => {
    const entry: GlossaryTerm = {
      id: crypto.randomUUID(), term, translation, domain,
    }
    await putGlossaryTerm(entry)
    set((s) => ({ glossary: [entry, ...s.glossary] }))
  },

  removeGlossaryTerm: async (id) => {
    await deleteGlossaryTermFromDb(id)
    set((s) => ({ glossary: s.glossary.filter((g) => g.id !== id) }))
  },

  searchPairs: (query) => {
    const q = query.toLowerCase()
    return get().pairs.filter(
      (p) => p.source.toLowerCase().includes(q) || p.target.toLowerCase().includes(q),
    )
  },
}))
