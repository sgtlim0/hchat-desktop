import { create } from 'zustand'
import type { DreamScenario, DreamChoice } from '@/shared/types'
import { getAllDreamScenarios, putDreamScenario, deleteDreamScenarioFromDb } from '@/shared/lib/db'
interface DreamSimState { scenarios: DreamScenario[]; selectedId: string | null; hydrate: () => void; createScenario: (title: string, premise: string) => void; deleteScenario: (id: string) => void; addChoice: (scenarioId: string, choice: DreamChoice) => void; selectChoice: (scenarioId: string, choiceId: string) => void; selectScenario: (id: string | null) => void }
export const useDreamSimStore = create<DreamSimState>((set) => ({
  scenarios: [], selectedId: null,
  hydrate: () => { getAllDreamScenarios().then((scenarios) => set({ scenarios })) },
  createScenario: (title, premise) => { const s: DreamScenario = { id: crypto.randomUUID(), title, premise, choices: [], createdAt: new Date().toISOString() }; set((st) => ({ scenarios: [s, ...st.scenarios], selectedId: s.id })); putDreamScenario(s) },
  deleteScenario: (id) => { set((s) => ({ scenarios: s.scenarios.filter((sc) => sc.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })); deleteDreamScenarioFromDb(id) },
  addChoice: (scenarioId, choice) => { set((s) => ({ scenarios: s.scenarios.map((sc) => sc.id === scenarioId ? { ...sc, choices: [...sc.choices, choice] } : sc) })) },
  selectChoice: (scenarioId, choiceId) => { set((s) => ({ scenarios: s.scenarios.map((sc) => { if (sc.id !== scenarioId) return sc; const choice = sc.choices.find((c) => c.id === choiceId); return { ...sc, selectedChoiceId: choiceId, result: choice?.outcome ?? '' } }) })) },
  selectScenario: (id) => set({ selectedId: id }),
}))
