import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFolderStore } from '@/entities/folder/folder.store'

vi.mock('@/shared/lib/db', () => ({
  getAllFolders: vi.fn(() => Promise.resolve([])),
  putFolder: vi.fn(() => Promise.resolve()),
  deleteFolderFromDb: vi.fn(() => Promise.resolve()),
}))

describe('FolderStore', () => {
  beforeEach(() => {
    useFolderStore.setState({
      folders: [],
      selectedFolderId: null,
    })
  })

  it('should hydrate folders from database', async () => {
    await useFolderStore.getState().hydrate()
    expect(useFolderStore.getState().folders).toEqual([])
  })

  it('should add a new folder', async () => {
    await useFolderStore.getState().addFolder('My Projects', '#3B82F6')

    const { folders } = useFolderStore.getState()
    expect(folders).toHaveLength(1)
    expect(folders[0].name).toBe('My Projects')
    expect(folders[0].color).toBe('#3B82F6')
    expect(folders[0].id).toMatch(/^folder-\d+$/)
  })

  it('should update an existing folder', async () => {
    await useFolderStore.getState().addFolder('Old Name', '#FF0000')
    const folderId = useFolderStore.getState().folders[0].id

    await useFolderStore.getState().updateFolder(folderId, { name: 'New Name', color: '#00FF00' })

    const { folders } = useFolderStore.getState()
    expect(folders[0].name).toBe('New Name')
    expect(folders[0].color).toBe('#00FF00')
  })

  it('should not update non-existent folder', async () => {
    await useFolderStore.getState().updateFolder('non-existent-id', { name: 'Test' })
    expect(useFolderStore.getState().folders).toHaveLength(0)
  })

  it('should delete a folder and clear selection if it was selected', async () => {
    // Use setState directly to avoid Date.now() collision
    useFolderStore.setState({
      folders: [
        { id: 'f-1', name: 'Folder 1', color: '#FF0000', createdAt: '2026-01-01' },
        { id: 'f-2', name: 'Folder 2', color: '#00FF00', createdAt: '2026-01-02' },
      ],
      selectedFolderId: 'f-1',
    })

    await useFolderStore.getState().deleteFolder('f-1')

    const { folders, selectedFolderId } = useFolderStore.getState()
    expect(folders).toHaveLength(1)
    expect(folders[0].name).toBe('Folder 2')
    expect(selectedFolderId).toBeNull()
  })

  it('should select and deselect folders', async () => {
    await useFolderStore.getState().addFolder('Test Folder', '#FF0000')
    const folderId = useFolderStore.getState().folders[0].id

    useFolderStore.getState().selectFolder(folderId)
    expect(useFolderStore.getState().selectedFolderId).toBe(folderId)

    useFolderStore.getState().selectFolder(null)
    expect(useFolderStore.getState().selectedFolderId).toBeNull()
  })

  it('should maintain selectedFolderId when deleting non-selected folder', async () => {
    useFolderStore.setState({
      folders: [
        { id: 'f-1', name: 'Folder 1', color: '#FF0000', createdAt: '2026-01-01' },
        { id: 'f-2', name: 'Folder 2', color: '#00FF00', createdAt: '2026-01-02' },
      ],
      selectedFolderId: 'f-1',
    })

    await useFolderStore.getState().deleteFolder('f-2')

    const { selectedFolderId, folders } = useFolderStore.getState()
    expect(selectedFolderId).toBe('f-1')
    expect(folders).toHaveLength(1)
    expect(folders[0].id).toBe('f-1')
  })
})
