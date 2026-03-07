import { create } from 'zustand'
import type { ProjectTimeline, ProjectTask, ProjectMilestone } from '@/shared/types'
import { getAllProjectTimelines, putProjectTimeline, deleteProjectTimelineFromDb } from '@/shared/lib/db'
interface ProjectTimelineState { timelines: ProjectTimeline[]; selectedId: string | null; hydrate: () => void; createTimeline: (title: string) => void; deleteTimeline: (id: string) => void; addTask: (timelineId: string, task: ProjectTask) => void; addMilestone: (timelineId: string, milestone: ProjectMilestone) => void; selectTimeline: (id: string | null) => void }
export const useProjectTimelineStore = create<ProjectTimelineState>((set) => ({
  timelines: [], selectedId: null,
  hydrate: () => { getAllProjectTimelines().then((timelines) => set({ timelines })) },
  createTimeline: (title) => { const now = new Date().toISOString(); const t: ProjectTimeline = { id: crypto.randomUUID(), title, milestones: [], tasks: [], createdAt: now, updatedAt: now }; set((s) => ({ timelines: [t, ...s.timelines], selectedId: t.id })); putProjectTimeline(t) },
  deleteTimeline: (id) => { set((s) => ({ timelines: s.timelines.filter((t) => t.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })); deleteProjectTimelineFromDb(id) },
  addTask: (timelineId, task) => { set((s) => ({ timelines: s.timelines.map((t) => { if (t.id !== timelineId) return t; const u = { ...t, tasks: [...t.tasks, task], updatedAt: new Date().toISOString() }; putProjectTimeline(u); return u }) })) },
  addMilestone: (timelineId, milestone) => { set((s) => ({ timelines: s.timelines.map((t) => { if (t.id !== timelineId) return t; const u = { ...t, milestones: [...t.milestones, milestone], updatedAt: new Date().toISOString() }; putProjectTimeline(u); return u }) })) },
  selectTimeline: (id) => set({ selectedId: id }),
}))
