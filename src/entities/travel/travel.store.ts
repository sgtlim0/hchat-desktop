import { create } from 'zustand'
import type { TravelPlan, TravelDay } from '@/shared/types'
import { getAllTravelPlans, putTravelPlan, deleteTravelPlanFromDb } from '@/shared/lib/db'
interface TravelState { plans: TravelPlan[]; selectedPlanId: string | null; hydrate: () => void; createPlan: (title: string, destination: string, startDate: string, endDate: string, budget: number) => void; deletePlan: (id: string) => void; addDay: (planId: string, day: TravelDay) => void; selectPlan: (id: string | null) => void }
export const useTravelStore = create<TravelState>((set) => ({
  plans: [], selectedPlanId: null,
  hydrate: () => { getAllTravelPlans().then((plans) => set({ plans })) },
  createPlan: (title, destination, startDate, endDate, budget) => { const now = new Date().toISOString(); const plan: TravelPlan = { id: crypto.randomUUID(), title, destination, startDate, endDate, budget, days: [], createdAt: now, updatedAt: now }; set((s) => ({ plans: [plan, ...s.plans] })); putTravelPlan(plan) },
  deletePlan: (id) => { set((s) => ({ plans: s.plans.filter((p) => p.id !== id), selectedPlanId: s.selectedPlanId === id ? null : s.selectedPlanId })); deleteTravelPlanFromDb(id) },
  addDay: (planId, day) => { set((s) => ({ plans: s.plans.map((p) => { if (p.id !== planId) return p; const u = { ...p, days: [...p.days, day], updatedAt: new Date().toISOString() }; putTravelPlan(u); return u }) })) },
  selectPlan: (id) => set({ selectedPlanId: id }),
}))
