import { create } from 'zustand'
import type { Simulation, SimParam } from '@/shared/types'
import { getAllSimulations, putSimulation, deleteSimulationFromDb } from '@/shared/lib/db'
interface SimState { simulations: Simulation[]; selectedId: string | null; hydrate: () => void; createSim: (title: string, type: Simulation['type']) => void; deleteSim: (id: string) => void; addParam: (simId: string, param: SimParam) => void; setParamValue: (simId: string, paramId: string, value: number) => void; runTick: (simId: string) => void; toggleRunning: (id: string) => void; selectSim: (id: string | null) => void }
export const useSimulationStore = create<SimState>((set) => ({
  simulations: [], selectedId: null,
  hydrate: () => { getAllSimulations().then((simulations) => set({ simulations })) },
  createSim: (title, type) => { const s: Simulation = { id: crypto.randomUUID(), title, type, params: [], results: [], isRunning: false, createdAt: new Date().toISOString() }; set((st) => ({ simulations: [s, ...st.simulations], selectedId: s.id })); putSimulation(s) },
  deleteSim: (id) => { set((s) => ({ simulations: s.simulations.filter((sim) => sim.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })); deleteSimulationFromDb(id) },
  addParam: (simId, param) => { set((s) => ({ simulations: s.simulations.map((sim) => sim.id === simId ? { ...sim, params: [...sim.params, param] } : sim) })) },
  setParamValue: (simId, paramId, value) => { set((s) => ({ simulations: s.simulations.map((sim) => sim.id === simId ? { ...sim, params: sim.params.map((p) => p.id === paramId ? { ...p, value } : p) } : sim) })) },
  runTick: (simId) => { set((s) => ({ simulations: s.simulations.map((sim) => { if (sim.id !== simId) return sim; const vals: Record<string, number> = {}; sim.params.forEach((p) => { vals[p.name] = p.value * (0.9 + Math.random() * 0.2) }); return { ...sim, results: [...sim.results, { tick: sim.results.length + 1, values: vals }] } }) })) },
  toggleRunning: (id) => { set((s) => ({ simulations: s.simulations.map((sim) => sim.id === id ? { ...sim, isRunning: !sim.isRunning } : sim) })) },
  selectSim: (id) => set({ selectedId: id }),
}))
