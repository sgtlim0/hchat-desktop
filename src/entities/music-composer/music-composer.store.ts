import { create } from 'zustand'
import type { MusicComposition, MusicChord } from '@/shared/types'
import { getAllMusicCompositions, putMusicComposition, deleteMusicCompositionFromDb } from '@/shared/lib/db'
interface MusicComposerState { compositions: MusicComposition[]; selectedId: string | null; hydrate: () => void; createComposition: (title: string, genre: string, tempo: number) => void; deleteComposition: (id: string) => void; addChord: (compId: string, chord: MusicChord) => void; removeChord: (compId: string, chordId: string) => void; selectComposition: (id: string | null) => void }
export const useMusicComposerStore = create<MusicComposerState>((set) => ({
  compositions: [], selectedId: null,
  hydrate: () => { getAllMusicCompositions().then((compositions) => set({ compositions })) },
  createComposition: (title, genre, tempo) => { const c: MusicComposition = { id: crypto.randomUUID(), title, genre, tempo, chords: [], createdAt: new Date().toISOString() }; set((s) => ({ compositions: [c, ...s.compositions], selectedId: c.id })); putMusicComposition(c) },
  deleteComposition: (id) => { set((s) => ({ compositions: s.compositions.filter((c) => c.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })); deleteMusicCompositionFromDb(id) },
  addChord: (compId, chord) => { set((s) => ({ compositions: s.compositions.map((c) => c.id === compId ? { ...c, chords: [...c.chords, chord] } : c) })) },
  removeChord: (compId, chordId) => { set((s) => ({ compositions: s.compositions.map((c) => c.id === compId ? { ...c, chords: c.chords.filter((ch) => ch.id !== chordId) } : c) })) },
  selectComposition: (id) => set({ selectedId: id }),
}))
