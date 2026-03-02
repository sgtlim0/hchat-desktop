import { create } from 'zustand'
import type { Project } from '@/shared/types'
import {
  getAllProjects,
  putProject,
  deleteProjectFromDb,
} from '@/shared/lib/db'

interface ProjectState {
  projects: Project[]
  selectedProjectId: string | null
  hydrated: boolean

  hydrate: () => Promise<void>
  selectProject: (id: string | null) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  createProject: (name: string, description: string) => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  selectedProjectId: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const projects = await getAllProjects()
      set({ projects, hydrated: true })
    } catch (error) {
      console.error('Failed to hydrate projects from IndexedDB:', error)
      set({ hydrated: true })
    }
  },

  selectProject: (id) => set({ selectedProjectId: id }),

  updateProject: (id, updates) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    }))
    const project = get().projects.find((p) => p.id === id)
    if (project) putProject(project).catch(console.error)
  },

  deleteProject: (id) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
    }))
    deleteProjectFromDb(id).catch(console.error)
  },

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
    putProject(newProject).catch(console.error)
  },
}))
