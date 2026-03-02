import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProjectStore } from '../project.store'

// Mock the db module
vi.mock('@/shared/lib/db', () => ({
  getAllProjects: vi.fn().mockResolvedValue([]),
  putProject: vi.fn().mockResolvedValue(undefined),
  deleteProjectFromDb: vi.fn().mockResolvedValue(undefined),
}))

describe('useProjectStore', () => {
  beforeEach(() => {
    useProjectStore.setState({
      projects: [],
      selectedProjectId: null,
      hydrated: false,
    })
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has empty projects', () => {
      expect(useProjectStore.getState().projects).toEqual([])
    })

    it('has no selected project', () => {
      expect(useProjectStore.getState().selectedProjectId).toBeNull()
    })

    it('is not hydrated', () => {
      expect(useProjectStore.getState().hydrated).toBe(false)
    })
  })

  describe('hydrate', () => {
    it('loads projects from IndexedDB', async () => {
      const { getAllProjects } = await import('@/shared/lib/db')
      const mockProjects = [
        {
          id: 'proj-1',
          name: 'Project 1',
          description: 'Test project',
          instructions: '',
          memories: [],
          sessionIds: [],
          createdAt: '2026-03-01T00:00:00Z',
          updatedAt: '2026-03-01T00:00:00Z',
        },
      ]
      vi.mocked(getAllProjects).mockResolvedValue(mockProjects)

      await useProjectStore.getState().hydrate()

      expect(useProjectStore.getState().projects).toEqual(mockProjects)
      expect(useProjectStore.getState().hydrated).toBe(true)
    })

    it('sets hydrated true even on error', async () => {
      const { getAllProjects } = await import('@/shared/lib/db')
      vi.mocked(getAllProjects).mockRejectedValue(new Error('DB error'))

      await useProjectStore.getState().hydrate()

      expect(useProjectStore.getState().projects).toEqual([])
      expect(useProjectStore.getState().hydrated).toBe(true)
    })
  })

  describe('createProject', () => {
    it('creates a new project', () => {
      useProjectStore.getState().createProject('My Project', 'Description')

      const { projects, selectedProjectId } = useProjectStore.getState()
      expect(projects).toHaveLength(1)
      expect(projects[0].name).toBe('My Project')
      expect(projects[0].description).toBe('Description')
      expect(projects[0].instructions).toBe('')
      expect(projects[0].memories).toEqual([])
      expect(projects[0].sessionIds).toEqual([])
      expect(selectedProjectId).toBe(projects[0].id)
    })

    it('generates ID with timestamp format', () => {
      useProjectStore.getState().createProject('Project 1', 'Desc 1')

      const { projects } = useProjectStore.getState()
      expect(projects[0].id).toMatch(/^project-\d+$/)
    })

    it('sets createdAt and updatedAt', () => {
      useProjectStore.getState().createProject('Project', 'Description')

      const project = useProjectStore.getState().projects[0]
      expect(project.createdAt).toBeDefined()
      expect(project.updatedAt).toBe(project.createdAt)
    })

    it('adds new project to the beginning of list', () => {
      useProjectStore.getState().createProject('Project 1', 'Desc 1')
      useProjectStore.getState().createProject('Project 2', 'Desc 2')

      const { projects } = useProjectStore.getState()
      expect(projects[0].name).toBe('Project 2')
      expect(projects[1].name).toBe('Project 1')
    })

    it('calls putProject with new project', async () => {
      const { putProject } = await import('@/shared/lib/db')

      useProjectStore.getState().createProject('Project', 'Description')

      // Wait for async DB call
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(putProject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Project',
          description: 'Description',
        })
      )
    })
  })

  describe('selectProject', () => {
    it('selects a project by id', () => {
      useProjectStore.getState().createProject('Project', 'Description')
      const projectId = useProjectStore.getState().projects[0].id

      useProjectStore.getState().selectProject(projectId)
      expect(useProjectStore.getState().selectedProjectId).toBe(projectId)
    })

    it('allows deselecting by passing null', () => {
      useProjectStore.getState().createProject('Project', 'Description')
      const projectId = useProjectStore.getState().projects[0].id

      useProjectStore.getState().selectProject(projectId)
      useProjectStore.getState().selectProject(null)
      expect(useProjectStore.getState().selectedProjectId).toBeNull()
    })
  })

  describe('updateProject', () => {
    it('updates project fields', () => {
      useProjectStore.getState().createProject('Project', 'Description')
      const projectId = useProjectStore.getState().projects[0].id

      useProjectStore.getState().updateProject(projectId, {
        name: 'Updated Name',
        description: 'Updated Description',
      })

      const updated = useProjectStore.getState().projects[0]
      expect(updated.name).toBe('Updated Name')
      expect(updated.description).toBe('Updated Description')
    })

    it('updates updatedAt timestamp', async () => {
      useProjectStore.getState().createProject('Project', 'Description')
      const projectId = useProjectStore.getState().projects[0].id
      const originalUpdatedAt = useProjectStore.getState().projects[0].updatedAt

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10))
      useProjectStore.getState().updateProject(projectId, { name: 'New Name' })

      const updated = useProjectStore.getState().projects[0]
      expect(updated.updatedAt).not.toBe(originalUpdatedAt)
    })

    it('does not update other projects', async () => {
      useProjectStore.getState().createProject('Project 1', 'Desc 1')

      // Wait to ensure different timestamp for ID generation
      await new Promise((resolve) => setTimeout(resolve, 2))

      useProjectStore.getState().createProject('Project 2', 'Desc 2')

      // Project 2 is at index 0 (most recent), Project 1 is at index 1
      const project2Id = useProjectStore.getState().projects[0].id

      useProjectStore.getState().updateProject(project2Id, { name: 'Updated' })

      expect(useProjectStore.getState().projects[0].name).toBe('Updated')
      expect(useProjectStore.getState().projects[1].name).toBe('Project 1')
    })

    it('preserves unchanged fields', () => {
      useProjectStore.getState().createProject('Project', 'Description')
      const projectId = useProjectStore.getState().projects[0].id
      const original = useProjectStore.getState().projects[0]

      useProjectStore.getState().updateProject(projectId, { name: 'New Name' })

      const updated = useProjectStore.getState().projects[0]
      expect(updated.description).toBe(original.description)
      expect(updated.instructions).toBe(original.instructions)
      expect(updated.memories).toEqual(original.memories)
      expect(updated.sessionIds).toEqual(original.sessionIds)
      expect(updated.createdAt).toBe(original.createdAt)
    })

    it('calls putProject with updated project', async () => {
      const { putProject } = await import('@/shared/lib/db')

      useProjectStore.getState().createProject('Project', 'Description')
      const projectId = useProjectStore.getState().projects[0].id

      vi.clearAllMocks()

      useProjectStore.getState().updateProject(projectId, { name: 'Updated' })

      // Wait for async DB call
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(putProject).toHaveBeenCalledWith(
        expect.objectContaining({
          id: projectId,
          name: 'Updated',
        })
      )
    })
  })

  describe('deleteProject', () => {
    it('removes project from list', async () => {
      useProjectStore.getState().createProject('Project 1', 'Desc 1')
      const project1Id = useProjectStore.getState().projects[0].id

      // Wait to ensure different timestamp for ID generation
      await new Promise((resolve) => setTimeout(resolve, 2))

      useProjectStore.getState().createProject('Project 2', 'Desc 2')
      const project2Id = useProjectStore.getState().projects[0].id

      useProjectStore.getState().deleteProject(project2Id)

      expect(useProjectStore.getState().projects).toHaveLength(1)
      expect(useProjectStore.getState().projects[0].id).toBe(project1Id)
    })

    it('deselects project if it was selected', () => {
      useProjectStore.getState().createProject('Project', 'Description')
      const projectId = useProjectStore.getState().projects[0].id

      useProjectStore.getState().selectProject(projectId)
      expect(useProjectStore.getState().selectedProjectId).toBe(projectId)

      useProjectStore.getState().deleteProject(projectId)
      expect(useProjectStore.getState().selectedProjectId).toBeNull()
    })

    it('does not deselect if different project deleted', async () => {
      useProjectStore.getState().createProject('Project 1', 'Desc 1')
      const project1Id = useProjectStore.getState().projects[0].id

      // Wait to ensure different timestamp for ID generation
      await new Promise((resolve) => setTimeout(resolve, 2))

      useProjectStore.getState().createProject('Project 2', 'Desc 2')
      const project2Id = useProjectStore.getState().projects[0].id

      useProjectStore.getState().selectProject(project1Id)
      useProjectStore.getState().deleteProject(project2Id)

      expect(useProjectStore.getState().selectedProjectId).toBe(project1Id)
    })

    it('calls deleteProjectFromDb', async () => {
      const { deleteProjectFromDb } = await import('@/shared/lib/db')

      useProjectStore.getState().createProject('Project', 'Description')
      const projectId = useProjectStore.getState().projects[0].id

      vi.clearAllMocks()

      useProjectStore.getState().deleteProject(projectId)

      // Wait for async DB call
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(deleteProjectFromDb).toHaveBeenCalledWith(projectId)
    })
  })
})
