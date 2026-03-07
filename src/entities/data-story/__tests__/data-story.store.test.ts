import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDataStoryStore } from '../data-story.store'
import type { DataStory, StoryChapter } from '@/shared/types'

vi.mock('@/shared/lib/db', () => ({
  getAllDataStories: vi.fn(() => Promise.resolve([])),
  putDataStory: vi.fn(() => Promise.resolve()),
  deleteDataStoryFromDb: vi.fn(() => Promise.resolve()),
}))

const makeChapter = (overrides: Partial<StoryChapter> = {}): StoryChapter => ({
  id: 'ch-1',
  title: 'Revenue Growth',
  narrative: 'Revenue grew by 20%',
  chartType: 'bar',
  data: [{ month: 1, revenue: 100 }, { month: 2, revenue: 120 }],
  insight: 'Steady growth trend',
  order: 0,
  ...overrides,
})

const makeStory = (overrides: Partial<DataStory> = {}): DataStory => ({
  id: 'ds-1',
  title: 'Q1 Report',
  chapters: [],
  sourceData: '{"revenue": [100, 120]}',
  generatedHtml: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

describe('DataStoryStore', () => {
  beforeEach(() => {
    useDataStoryStore.setState({
      stories: [],
      selectedStoryId: null,
    })
  })

  it('should create a story', () => {
    useDataStoryStore.getState().createStory('Q1 Report', '{"data": [1,2,3]}')

    const stories = useDataStoryStore.getState().stories
    expect(stories).toHaveLength(1)
    expect(stories[0].title).toBe('Q1 Report')
    expect(stories[0].sourceData).toBe('{"data": [1,2,3]}')
    expect(stories[0].chapters).toEqual([])
    expect(stories[0].generatedHtml).toBe('')
  })

  it('should delete a story and clear selection', () => {
    useDataStoryStore.setState({
      stories: [makeStory({ id: 'ds-1' }), makeStory({ id: 'ds-2' })],
      selectedStoryId: 'ds-1',
    })

    useDataStoryStore.getState().deleteStory('ds-1')

    const state = useDataStoryStore.getState()
    expect(state.stories).toHaveLength(1)
    expect(state.selectedStoryId).toBeNull()
  })

  it('should add a chapter to a story', () => {
    useDataStoryStore.setState({ stories: [makeStory({ id: 'ds-1' })] })

    const chapter = makeChapter({ id: 'ch-1' })
    useDataStoryStore.getState().addChapter('ds-1', chapter)

    const story = useDataStoryStore.getState().stories[0]
    expect(story.chapters).toHaveLength(1)
    expect(story.chapters[0].title).toBe('Revenue Growth')
  })

  it('should update a chapter', () => {
    useDataStoryStore.setState({
      stories: [makeStory({ id: 'ds-1', chapters: [makeChapter({ id: 'ch-1' })] })],
    })

    useDataStoryStore.getState().updateChapter('ds-1', 'ch-1', {
      title: 'Updated Title',
      chartType: 'line',
    })

    const chapter = useDataStoryStore.getState().stories[0].chapters[0]
    expect(chapter.title).toBe('Updated Title')
    expect(chapter.chartType).toBe('line')
    expect(chapter.narrative).toBe('Revenue grew by 20%')
  })

  it('should remove a chapter', () => {
    useDataStoryStore.setState({
      stories: [makeStory({
        id: 'ds-1',
        chapters: [makeChapter({ id: 'ch-1' }), makeChapter({ id: 'ch-2', title: 'Ch2' })],
      })],
    })

    useDataStoryStore.getState().removeChapter('ds-1', 'ch-1')

    const story = useDataStoryStore.getState().stories[0]
    expect(story.chapters).toHaveLength(1)
    expect(story.chapters[0].id).toBe('ch-2')
  })

  it('should select and deselect a story', () => {
    useDataStoryStore.getState().selectStory('ds-1')
    expect(useDataStoryStore.getState().selectedStoryId).toBe('ds-1')

    useDataStoryStore.getState().selectStory(null)
    expect(useDataStoryStore.getState().selectedStoryId).toBeNull()
  })

  it('should hydrate from db', async () => {
    const { getAllDataStories } = await import('@/shared/lib/db')
    vi.mocked(getAllDataStories).mockResolvedValueOnce([makeStory({ id: 'ds-db-1' })])

    useDataStoryStore.getState().hydrate()
    await vi.waitFor(() => {
      expect(useDataStoryStore.getState().stories).toHaveLength(1)
      expect(useDataStoryStore.getState().stories[0].id).toBe('ds-db-1')
    })
  })
})
