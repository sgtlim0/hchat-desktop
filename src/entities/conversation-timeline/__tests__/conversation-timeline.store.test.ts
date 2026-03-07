import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useConversationTimelineStore } from '../conversation-timeline.store'
import type { TimelineSegment } from '@/shared/types'

vi.mock('@/shared/lib/db', () => ({
  getTimelineSegments: vi.fn(() => Promise.resolve([])),
  putTimelineSegment: vi.fn(() => Promise.resolve()),
  deleteTimelineSegmentFromDb: vi.fn(() => Promise.resolve()),
}))

describe('ConversationTimelineStore', () => {
  beforeEach(() => {
    useConversationTimelineStore.setState({
      segments: [],
    })
  })

  it('should add a segment', () => {
    const { addSegment } = useConversationTimelineStore.getState()

    addSegment({ sessionId: 'sess-1', topic: 'Introduction', summary: 'Greetings exchanged', startIndex: 0, endIndex: 3 })

    const segments = useConversationTimelineStore.getState().segments
    expect(segments).toHaveLength(1)
    expect(segments[0].topic).toBe('Introduction')
    expect(segments[0].summary).toBe('Greetings exchanged')
    expect(segments[0].sessionId).toBe('sess-1')
    expect(segments[0].startIndex).toBe(0)
    expect(segments[0].endIndex).toBe(3)
    expect(segments[0].id).toBeDefined()
    expect(segments[0].createdAt).toBeDefined()
  })

  it('should remove a segment', () => {
    const now = new Date().toISOString()
    useConversationTimelineStore.setState({
      segments: [
        { id: 'seg-1', sessionId: 'sess-1', topic: 'A', summary: 'a', startIndex: 0, endIndex: 2, createdAt: now },
        { id: 'seg-2', sessionId: 'sess-1', topic: 'B', summary: 'b', startIndex: 3, endIndex: 5, createdAt: now },
      ],
    })

    const { removeSegment } = useConversationTimelineStore.getState()
    removeSegment('seg-1')

    const segments = useConversationTimelineStore.getState().segments
    expect(segments).toHaveLength(1)
    expect(segments[0].id).toBe('seg-2')
  })

  it('should clear all segments', () => {
    const now = new Date().toISOString()
    useConversationTimelineStore.setState({
      segments: [
        { id: 'seg-1', sessionId: 'sess-1', topic: 'A', summary: 'a', startIndex: 0, endIndex: 2, createdAt: now },
        { id: 'seg-2', sessionId: 'sess-1', topic: 'B', summary: 'b', startIndex: 3, endIndex: 5, createdAt: now },
      ],
    })

    const { clearSegments } = useConversationTimelineStore.getState()
    clearSegments()

    expect(useConversationTimelineStore.getState().segments).toHaveLength(0)
  })

  it('should load segments from DB for a session', async () => {
    const now = new Date().toISOString()
    const mockSegments: TimelineSegment[] = [
      { id: 'seg-1', sessionId: 'sess-1', topic: 'Loaded', summary: 'from db', startIndex: 0, endIndex: 4, createdAt: now },
    ]

    const { getTimelineSegments } = await import('@/shared/lib/db')
    vi.mocked(getTimelineSegments).mockResolvedValueOnce(mockSegments)

    const { loadSegments } = useConversationTimelineStore.getState()
    loadSegments('sess-1')

    await new Promise((resolve) => setTimeout(resolve, 10))

    const segments = useConversationTimelineStore.getState().segments
    expect(segments).toHaveLength(1)
    expect(segments[0].topic).toBe('Loaded')
  })

  it('should append segments in order', () => {
    const { addSegment } = useConversationTimelineStore.getState()

    addSegment({ sessionId: 'sess-1', topic: 'First', summary: 'a', startIndex: 0, endIndex: 2 })
    addSegment({ sessionId: 'sess-1', topic: 'Second', summary: 'b', startIndex: 3, endIndex: 5 })

    const segments = useConversationTimelineStore.getState().segments
    expect(segments).toHaveLength(2)
    expect(segments[0].topic).toBe('First')
    expect(segments[1].topic).toBe('Second')
  })

  it('should replace segments on load', async () => {
    const now = new Date().toISOString()
    useConversationTimelineStore.setState({
      segments: [
        { id: 'old', sessionId: 'sess-0', topic: 'Old', summary: 'stale', startIndex: 0, endIndex: 1, createdAt: now },
      ],
    })

    const mockSegments: TimelineSegment[] = [
      { id: 'new', sessionId: 'sess-1', topic: 'New', summary: 'fresh', startIndex: 0, endIndex: 3, createdAt: now },
    ]

    const { getTimelineSegments } = await import('@/shared/lib/db')
    vi.mocked(getTimelineSegments).mockResolvedValueOnce(mockSegments)

    const { loadSegments } = useConversationTimelineStore.getState()
    loadSegments('sess-1')

    await new Promise((resolve) => setTimeout(resolve, 10))

    const segments = useConversationTimelineStore.getState().segments
    expect(segments).toHaveLength(1)
    expect(segments[0].id).toBe('new')
  })
})
