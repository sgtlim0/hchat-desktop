import { create } from 'zustand'
import type { Workspace, WorkspaceMember, WorkspaceRole, WorkspaceActivity } from '@/shared/types'
import { getAllWorkspaces, putWorkspace, deleteWorkspaceFromDb } from '@/shared/lib/db'

interface WorkspaceState {
  workspaces: Workspace[]
  selectedWorkspaceId: string | null

  hydrate: () => void
  createWorkspace: (name: string, description: string) => void
  deleteWorkspace: (id: string) => void
  selectWorkspace: (id: string | null) => void
  addMember: (workspaceId: string, name: string, email: string, role: WorkspaceRole) => void
  removeMember: (workspaceId: string, memberId: string) => void
  updateMemberRole: (workspaceId: string, memberId: string, role: WorkspaceRole) => void
  sharePrompt: (workspaceId: string, promptId: string) => void
  unsharePrompt: (workspaceId: string, promptId: string) => void
  shareKnowledge: (workspaceId: string, knowledgeId: string) => void
  unshareKnowledge: (workspaceId: string, knowledgeId: string) => void
  addActivity: (workspaceId: string, memberId: string, memberName: string, action: string, details: string) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  selectedWorkspaceId: null,

  hydrate: () => {
    getAllWorkspaces()
      .then((workspaces) => set({ workspaces }))
      .catch(console.error)
  },

  createWorkspace: (name, description) => {
    const workspace: Workspace = {
      id: crypto.randomUUID(),
      name,
      description,
      avatar: '',
      members: [],
      sharedPromptIds: [],
      sharedKnowledgeIds: [],
      activities: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    set((state) => ({
      workspaces: [workspace, ...state.workspaces],
    }))

    putWorkspace(workspace).catch(console.error)
  },

  deleteWorkspace: (id) => {
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== id),
      selectedWorkspaceId: state.selectedWorkspaceId === id ? null : state.selectedWorkspaceId,
    }))

    deleteWorkspaceFromDb(id).catch(console.error)
  },

  selectWorkspace: (id) => {
    set({ selectedWorkspaceId: id })
  },

  addMember: (workspaceId, name, email, role) => {
    const member: WorkspaceMember = {
      id: crypto.randomUUID(),
      name,
      email,
      role,
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    }

    set((state) => ({
      workspaces: state.workspaces.map((w) => {
        if (w.id !== workspaceId) return w

        const updatedWorkspace = {
          ...w,
          members: [...w.members, member],
          updatedAt: new Date().toISOString(),
        }

        putWorkspace(updatedWorkspace).catch(console.error)
        return updatedWorkspace
      }),
    }))
  },

  removeMember: (workspaceId, memberId) => {
    set((state) => ({
      workspaces: state.workspaces.map((w) => {
        if (w.id !== workspaceId) return w

        const updatedWorkspace = {
          ...w,
          members: w.members.filter((m) => m.id !== memberId),
          updatedAt: new Date().toISOString(),
        }

        putWorkspace(updatedWorkspace).catch(console.error)
        return updatedWorkspace
      }),
    }))
  },

  updateMemberRole: (workspaceId, memberId, role) => {
    set((state) => ({
      workspaces: state.workspaces.map((w) => {
        if (w.id !== workspaceId) return w

        const updatedWorkspace = {
          ...w,
          members: w.members.map((m) =>
            m.id === memberId ? { ...m, role } : m
          ),
          updatedAt: new Date().toISOString(),
        }

        putWorkspace(updatedWorkspace).catch(console.error)
        return updatedWorkspace
      }),
    }))
  },

  sharePrompt: (workspaceId, promptId) => {
    set((state) => ({
      workspaces: state.workspaces.map((w) => {
        if (w.id !== workspaceId) return w

        const updatedWorkspace = {
          ...w,
          sharedPromptIds: [...w.sharedPromptIds, promptId],
          updatedAt: new Date().toISOString(),
        }

        putWorkspace(updatedWorkspace).catch(console.error)
        return updatedWorkspace
      }),
    }))
  },

  unsharePrompt: (workspaceId, promptId) => {
    set((state) => ({
      workspaces: state.workspaces.map((w) => {
        if (w.id !== workspaceId) return w

        const updatedWorkspace = {
          ...w,
          sharedPromptIds: w.sharedPromptIds.filter((id) => id !== promptId),
          updatedAt: new Date().toISOString(),
        }

        putWorkspace(updatedWorkspace).catch(console.error)
        return updatedWorkspace
      }),
    }))
  },

  shareKnowledge: (workspaceId, knowledgeId) => {
    set((state) => ({
      workspaces: state.workspaces.map((w) => {
        if (w.id !== workspaceId) return w

        const updatedWorkspace = {
          ...w,
          sharedKnowledgeIds: [...w.sharedKnowledgeIds, knowledgeId],
          updatedAt: new Date().toISOString(),
        }

        putWorkspace(updatedWorkspace).catch(console.error)
        return updatedWorkspace
      }),
    }))
  },

  unshareKnowledge: (workspaceId, knowledgeId) => {
    set((state) => ({
      workspaces: state.workspaces.map((w) => {
        if (w.id !== workspaceId) return w

        const updatedWorkspace = {
          ...w,
          sharedKnowledgeIds: w.sharedKnowledgeIds.filter((id) => id !== knowledgeId),
          updatedAt: new Date().toISOString(),
        }

        putWorkspace(updatedWorkspace).catch(console.error)
        return updatedWorkspace
      }),
    }))
  },

  addActivity: (workspaceId, memberId, memberName, action, details) => {
    const activity: WorkspaceActivity = {
      id: crypto.randomUUID(),
      memberId,
      memberName,
      action,
      details,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      workspaces: state.workspaces.map((w) => {
        if (w.id !== workspaceId) return w

        const updatedWorkspace = {
          ...w,
          activities: [activity, ...w.activities].slice(0, 50),
          updatedAt: new Date().toISOString(),
        }

        putWorkspace(updatedWorkspace).catch(console.error)
        return updatedWorkspace
      }),
    }))
  },
}))
