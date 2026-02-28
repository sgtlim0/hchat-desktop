import { create } from 'zustand'
import type { Project } from '@/shared/types'
import { mockProjects } from '@/shared/lib/mock-data'

interface ProjectState {
  projects: Project[]
  selectedProjectId: string | null

  selectProject: (id: string | null) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  createProject: (name: string, description: string) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: mockProjects,
  selectedProjectId: null,

  selectProject: (id) => set({ selectedProjectId: id }),

  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    })),

  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
    })),

  createProject: (name, description) => {
    const id = `project-${Date.now()}`
    const newProject: Project = {
      id,
      name,
      description,
      instructions: '',
      memories: [],
      sessionIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set((state) => ({
      projects: [newProject, ...state.projects],
      selectedProjectId: id,
    }))
  },
}))
