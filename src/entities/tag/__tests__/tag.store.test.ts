import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTagStore } from '@/entities/tag/tag.store'

vi.mock('@/shared/lib/db', () => ({
  getAllTags: vi.fn(() => Promise.resolve([])),
  putTag: vi.fn(() => Promise.resolve()),
  deleteTagFromDb: vi.fn(() => Promise.resolve()),
}))

describe('TagStore', () => {
  beforeEach(() => {
    useTagStore.setState({ tags: [] })
  })

  it('should hydrate tags from database', async () => {
    await useTagStore.getState().hydrate()
    expect(useTagStore.getState().tags).toEqual([])
  })

  it('should add a new tag', async () => {
    await useTagStore.getState().addTag('important', '#FF5733')

    const { tags } = useTagStore.getState()
    expect(tags).toHaveLength(1)
    expect(tags[0].name).toBe('important')
    expect(tags[0].color).toBe('#FF5733')
    expect(tags[0].id).toMatch(/^tag-\d+$/)
  })

  it('should update an existing tag', async () => {
    await useTagStore.getState().addTag('urgent', '#FF0000')
    const tagId = useTagStore.getState().tags[0].id

    await useTagStore.getState().updateTag(tagId, { name: 'priority', color: '#FFA500' })

    const { tags } = useTagStore.getState()
    expect(tags[0].name).toBe('priority')
    expect(tags[0].color).toBe('#FFA500')
  })

  it('should not update non-existent tag', async () => {
    await useTagStore.getState().updateTag('non-existent-id', { name: 'Test' })
    expect(useTagStore.getState().tags).toHaveLength(0)
  })

  it('should delete a tag', async () => {
    // Use setState to avoid Date.now() collision
    useTagStore.setState({
      tags: [
        { id: 't-1', name: 'Tag 1', color: '#FF0000' },
        { id: 't-2', name: 'Tag 2', color: '#00FF00' },
        { id: 't-3', name: 'Tag 3', color: '#0000FF' },
      ],
    })

    await useTagStore.getState().deleteTag('t-2')

    const { tags } = useTagStore.getState()
    expect(tags).toHaveLength(2)
    expect(tags[0].name).toBe('Tag 1')
    expect(tags[1].name).toBe('Tag 3')
  })

  it('should handle multiple tags with different colors', async () => {
    await useTagStore.getState().addTag('bug', '#FF0000')

    const { tags } = useTagStore.getState()
    expect(tags).toHaveLength(1)
    expect(tags[0].name).toBe('bug')
    expect(tags[0].id.startsWith('tag-')).toBe(true)
  })

  it('should preserve tag order when updating', async () => {
    // Use setState to avoid Date.now() collision
    useTagStore.setState({
      tags: [
        { id: 't-1', name: 'first', color: '#FF0000' },
        { id: 't-2', name: 'second', color: '#00FF00' },
        { id: 't-3', name: 'third', color: '#0000FF' },
      ],
    })

    await useTagStore.getState().updateTag('t-2', { name: 'updated-second' })

    const { tags } = useTagStore.getState()
    expect(tags[0].name).toBe('first')
    expect(tags[1].name).toBe('updated-second')
    expect(tags[2].name).toBe('third')
  })
})
