import { create } from 'zustand'
import type { GameScenario, StoryNode } from '@/shared/types'
import { getAllGameScenarios, putGameScenario, deleteGameScenarioFromDb } from '@/shared/lib/db'
interface GameScenarioState { scenarios: GameScenario[]; selectedId: string | null; hydrate: () => void; createScenario: (title: string, genre: string) => void; deleteScenario: (id: string) => void; addNode: (scenarioId: string, node: StoryNode) => void; makeChoice: (scenarioId: string, nextNodeId: string) => void; selectScenario: (id: string | null) => void }
export const useGameScenarioStore = create<GameScenarioState>((set) => ({
  scenarios: [], selectedId: null,
  hydrate: () => { getAllGameScenarios().then((scenarios) => set({ scenarios })) },
  createScenario: (title, genre) => { const root: StoryNode = { id: 'root', text: 'The adventure begins...', choices: [], isEnding: false }; const s: GameScenario = { id: crypto.randomUUID(), title, genre, nodes: [root], currentNodeId: 'root', createdAt: new Date().toISOString() }; set((st) => ({ scenarios: [s, ...st.scenarios], selectedId: s.id })); putGameScenario(s) },
  deleteScenario: (id) => { set((s) => ({ scenarios: s.scenarios.filter((sc) => sc.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })); deleteGameScenarioFromDb(id) },
  addNode: (scenarioId, node) => { set((s) => ({ scenarios: s.scenarios.map((sc) => sc.id === scenarioId ? { ...sc, nodes: [...sc.nodes, node] } : sc) })) },
  makeChoice: (scenarioId, nextNodeId) => { set((s) => ({ scenarios: s.scenarios.map((sc) => sc.id === scenarioId ? { ...sc, currentNodeId: nextNodeId } : sc) })) },
  selectScenario: (id) => set({ selectedId: id }),
}))
