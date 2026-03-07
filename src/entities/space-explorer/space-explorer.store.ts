import { create } from 'zustand'
import type { SpaceExploration, CelestialBody, SpaceQuiz } from '@/shared/types'
import { getAllSpaceExplorations, putSpaceExploration, deleteSpaceExplorationFromDb } from '@/shared/lib/db'
interface SpaceState { explorations: SpaceExploration[]; selectedId: string | null; hydrate: () => void; createExploration: (title: string) => void; deleteExploration: (id: string) => void; addBody: (expId: string, body: CelestialBody) => void; addQuiz: (expId: string, quiz: SpaceQuiz) => void; answerQuiz: (expId: string, quizId: string, answer: number) => void; selectExploration: (id: string | null) => void }
export const useSpaceExplorerStore = create<SpaceState>((set) => ({
  explorations: [], selectedId: null,
  hydrate: () => { getAllSpaceExplorations().then((explorations) => set({ explorations })) },
  createExploration: (title) => { const e: SpaceExploration = { id: crypto.randomUUID(), title, bodies: [], quizzes: [], score: 0, createdAt: new Date().toISOString() }; set((s) => ({ explorations: [e, ...s.explorations], selectedId: e.id })); putSpaceExploration(e) },
  deleteExploration: (id) => { set((s) => ({ explorations: s.explorations.filter((e) => e.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })); deleteSpaceExplorationFromDb(id) },
  addBody: (expId, body) => { set((s) => ({ explorations: s.explorations.map((e) => e.id === expId ? { ...e, bodies: [...e.bodies, body] } : e) })) },
  addQuiz: (expId, quiz) => { set((s) => ({ explorations: s.explorations.map((e) => e.id === expId ? { ...e, quizzes: [...e.quizzes, quiz] } : e) })) },
  answerQuiz: (expId, quizId, answer) => { set((s) => ({ explorations: s.explorations.map((e) => { if (e.id !== expId) return e; const quizzes = e.quizzes.map((q) => q.id === quizId ? { ...q, userAnswer: answer } : q); const score = quizzes.filter((q) => q.userAnswer === q.correctIndex).length; return { ...e, quizzes, score } }) })) },
  selectExploration: (id) => set({ selectedId: id }),
}))
