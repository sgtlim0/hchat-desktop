import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWorkspaceStore } from '../workspace.store'

// Mock the db module
vi.mock('@/shared/lib/db', () => ({
  getAllWorkspaces: vi.fn(() => Promise.resolve([])),
  putWorkspace: vi.fn(() => Promise.resolve()),
  deleteWorkspaceFromDb: vi.fn(() => Promise.resolve()),
}))

describe('WorkspaceStore', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      workspaces: [],
      selectedWorkspaceId: null,
    })
  })

  it('should hydrate and load workspaces from db', async () => {
    const { hydrate } = useWorkspaceStore.getState()

    await hydrate()

    const { workspaces } = useWorkspaceStore.getState()
    expect(workspaces).toEqual([])
  })

  it('should create a workspace with name and description', () => {
    const { createWorkspace } = useWorkspaceStore.getState()

    createWorkspace('Team Alpha', 'Engineering team workspace')

    const { workspaces } = useWorkspaceStore.getState()
    expect(workspaces).toHaveLength(1)
    expect(workspaces[0].name).toBe('Team Alpha')
    expect(workspaces[0].description).toBe('Engineering team workspace')
    expect(workspaces[0].members).toEqual([])
    expect(workspaces[0].sharedPromptIds).toEqual([])
    expect(workspaces[0].sharedKnowledgeIds).toEqual([])
    expect(workspaces[0].activities).toEqual([])
  })

  it('should delete a workspace', () => {
    const { createWorkspace, deleteWorkspace } = useWorkspaceStore.getState()

    createWorkspace('Workspace 1', 'First workspace')
    createWorkspace('Workspace 2', 'Second workspace')

    const workspaceId = useWorkspaceStore.getState().workspaces[0].id

    deleteWorkspace(workspaceId)

    const { workspaces } = useWorkspaceStore.getState()
    expect(workspaces).toHaveLength(1)
    expect(workspaces[0].name).toBe('Workspace 1')
  })

  it('should select a workspace', () => {
    const { createWorkspace, selectWorkspace } = useWorkspaceStore.getState()

    createWorkspace('My Workspace', 'Test workspace')
    const workspaceId = useWorkspaceStore.getState().workspaces[0].id

    selectWorkspace(workspaceId)

    const { selectedWorkspaceId } = useWorkspaceStore.getState()
    expect(selectedWorkspaceId).toBe(workspaceId)
  })

  it('should add a member to workspace', () => {
    const { createWorkspace, addMember } = useWorkspaceStore.getState()

    createWorkspace('Team Workspace', 'Collaborative workspace')
    const workspaceId = useWorkspaceStore.getState().workspaces[0].id

    addMember(workspaceId, 'John Doe', 'john@example.com', 'editor')

    const { workspaces } = useWorkspaceStore.getState()
    expect(workspaces[0].members).toHaveLength(1)
    expect(workspaces[0].members[0].name).toBe('John Doe')
    expect(workspaces[0].members[0].email).toBe('john@example.com')
    expect(workspaces[0].members[0].role).toBe('editor')
  })

  it('should remove a member from workspace', () => {
    const { createWorkspace, addMember, removeMember } = useWorkspaceStore.getState()

    createWorkspace('Team Workspace', 'Collaborative workspace')
    const workspaceId = useWorkspaceStore.getState().workspaces[0].id

    addMember(workspaceId, 'John Doe', 'john@example.com', 'editor')
    addMember(workspaceId, 'Jane Smith', 'jane@example.com', 'admin')

    const memberId = useWorkspaceStore.getState().workspaces[0].members[0].id

    removeMember(workspaceId, memberId)

    const { workspaces } = useWorkspaceStore.getState()
    expect(workspaces[0].members).toHaveLength(1)
    expect(workspaces[0].members[0].name).toBe('Jane Smith')
  })

  it('should update member role', () => {
    const { createWorkspace, addMember, updateMemberRole } = useWorkspaceStore.getState()

    createWorkspace('Team Workspace', 'Collaborative workspace')
    const workspaceId = useWorkspaceStore.getState().workspaces[0].id

    addMember(workspaceId, 'John Doe', 'john@example.com', 'editor')
    const memberId = useWorkspaceStore.getState().workspaces[0].members[0].id

    updateMemberRole(workspaceId, memberId, 'admin')

    const { workspaces } = useWorkspaceStore.getState()
    expect(workspaces[0].members[0].role).toBe('admin')
  })

  it('should share a prompt', () => {
    const { createWorkspace, sharePrompt } = useWorkspaceStore.getState()

    createWorkspace('Team Workspace', 'Collaborative workspace')
    const workspaceId = useWorkspaceStore.getState().workspaces[0].id

    sharePrompt(workspaceId, 'prompt-123')

    const { workspaces } = useWorkspaceStore.getState()
    expect(workspaces[0].sharedPromptIds).toContain('prompt-123')
  })

  it('should unshare a prompt', () => {
    const { createWorkspace, sharePrompt, unsharePrompt } = useWorkspaceStore.getState()

    createWorkspace('Team Workspace', 'Collaborative workspace')
    const workspaceId = useWorkspaceStore.getState().workspaces[0].id

    sharePrompt(workspaceId, 'prompt-123')
    sharePrompt(workspaceId, 'prompt-456')

    unsharePrompt(workspaceId, 'prompt-123')

    const { workspaces } = useWorkspaceStore.getState()
    expect(workspaces[0].sharedPromptIds).not.toContain('prompt-123')
    expect(workspaces[0].sharedPromptIds).toContain('prompt-456')
  })

  it('should share knowledge', () => {
    const { createWorkspace, shareKnowledge } = useWorkspaceStore.getState()

    createWorkspace('Team Workspace', 'Collaborative workspace')
    const workspaceId = useWorkspaceStore.getState().workspaces[0].id

    shareKnowledge(workspaceId, 'knowledge-789')

    const { workspaces } = useWorkspaceStore.getState()
    expect(workspaces[0].sharedKnowledgeIds).toContain('knowledge-789')
  })

  it('should unshare knowledge', () => {
    const { createWorkspace, shareKnowledge, unshareKnowledge } = useWorkspaceStore.getState()

    createWorkspace('Team Workspace', 'Collaborative workspace')
    const workspaceId = useWorkspaceStore.getState().workspaces[0].id

    shareKnowledge(workspaceId, 'knowledge-789')
    shareKnowledge(workspaceId, 'knowledge-101')

    unshareKnowledge(workspaceId, 'knowledge-789')

    const { workspaces } = useWorkspaceStore.getState()
    expect(workspaces[0].sharedKnowledgeIds).not.toContain('knowledge-789')
    expect(workspaces[0].sharedKnowledgeIds).toContain('knowledge-101')
  })

  it('should add activity to workspace', () => {
    const { createWorkspace, addActivity } = useWorkspaceStore.getState()

    createWorkspace('Team Workspace', 'Collaborative workspace')
    const workspaceId = useWorkspaceStore.getState().workspaces[0].id

    addActivity(workspaceId, 'member-123', 'John Doe', 'created_session', 'Created new chat session')

    const { workspaces } = useWorkspaceStore.getState()
    expect(workspaces[0].activities).toHaveLength(1)
    expect(workspaces[0].activities[0].memberId).toBe('member-123')
    expect(workspaces[0].activities[0].memberName).toBe('John Doe')
    expect(workspaces[0].activities[0].action).toBe('created_session')
    expect(workspaces[0].activities[0].details).toBe('Created new chat session')
  })

  it('should limit activities to 50 entries', () => {
    const { createWorkspace, addActivity } = useWorkspaceStore.getState()

    createWorkspace('Team Workspace', 'Collaborative workspace')
    const workspaceId = useWorkspaceStore.getState().workspaces[0].id

    // Add 60 activities
    for (let i = 0; i < 60; i++) {
      addActivity(workspaceId, 'member-123', 'John Doe', 'action', `Activity ${i}`)
    }

    const { workspaces } = useWorkspaceStore.getState()
    expect(workspaces[0].activities).toHaveLength(50)
    // Most recent should be first
    expect(workspaces[0].activities[0].details).toBe('Activity 59')
  })

  it('should reset selectedWorkspaceId when deleting selected workspace', () => {
    const { createWorkspace, selectWorkspace, deleteWorkspace } = useWorkspaceStore.getState()

    createWorkspace('Workspace 1', 'First workspace')
    const workspaceId = useWorkspaceStore.getState().workspaces[0].id

    selectWorkspace(workspaceId)

    deleteWorkspace(workspaceId)

    const { selectedWorkspaceId } = useWorkspaceStore.getState()
    expect(selectedWorkspaceId).toBeNull()
  })
})
