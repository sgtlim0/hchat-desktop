import { create } from 'zustand'
import type { MovieScript, MovieCharacter, MovieScene } from '@/shared/types'
import { getAllMovieScripts, putMovieScript, deleteMovieScriptFromDb } from '@/shared/lib/db'
interface MovieScriptState { scripts: MovieScript[]; selectedId: string | null; hydrate: () => void; createScript: (title: string, genre: string) => void; deleteScript: (id: string) => void; addCharacter: (scriptId: string, char: MovieCharacter) => void; addScene: (scriptId: string, scene: MovieScene) => void; removeScene: (scriptId: string, sceneId: string) => void; selectScript: (id: string | null) => void }
export const useMovieScriptStore = create<MovieScriptState>((set) => ({
  scripts: [], selectedId: null,
  hydrate: () => { getAllMovieScripts().then((scripts) => set({ scripts })) },
  createScript: (title, genre) => { const now = new Date().toISOString(); const s: MovieScript = { id: crypto.randomUUID(), title, genre, characters: [], scenes: [], createdAt: now, updatedAt: now }; set((st) => ({ scripts: [s, ...st.scripts], selectedId: s.id })); putMovieScript(s) },
  deleteScript: (id) => { set((s) => ({ scripts: s.scripts.filter((sc) => sc.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })); deleteMovieScriptFromDb(id) },
  addCharacter: (scriptId, char) => { set((s) => ({ scripts: s.scripts.map((sc) => sc.id === scriptId ? { ...sc, characters: [...sc.characters, char] } : sc) })) },
  addScene: (scriptId, scene) => { set((s) => ({ scripts: s.scripts.map((sc) => sc.id === scriptId ? { ...sc, scenes: [...sc.scenes, scene] } : sc) })) },
  removeScene: (scriptId, sceneId) => { set((s) => ({ scripts: s.scripts.map((sc) => sc.id === scriptId ? { ...sc, scenes: sc.scenes.filter((s) => s.id !== sceneId) } : sc) })) },
  selectScript: (id) => set({ selectedId: id }),
}))
