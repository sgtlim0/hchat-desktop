import { create } from 'zustand'
import type { TimelineSegment } from '@/shared/types'
import { getTimelineSegments, putTimelineSegment, deleteTimelineSegmentFromDb } from '@/shared/lib/db'

interface ConversationTimelineState {
  segments: TimelineSegment[]

  loadSegments: (sessionId: string) => void
  addSegment: (segment: Omit<TimelineSegment, 'id' | 'createdAt'>) => void
  removeSegment: (id: string) => void
  clearSegments: () => void
}

export const useConversationTimelineStore = create<ConversationTimelineState>((set) => ({
  segments: [],

  loadSegments: (sessionId) => {
    getTimelineSegments(sessionId)
      .then((segments) => {
        set({ segments })
      })
      .catch(console.error)
  },

  addSegment: (partial) => {
    const segment: TimelineSegment = {
      id: crypto.randomUUID(),
      sessionId: partial.sessionId,
      topic: partial.topic,
      summary: partial.summary,
      startIndex: partial.startIndex,
      endIndex: partial.endIndex,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      segments: [...state.segments, segment],
    }))

    putTimelineSegment(segment).catch(console.error)
  },

  removeSegment: (id) => {
    set((state) => ({
      segments: state.segments.filter((s) => s.id !== id),
    }))

    deleteTimelineSegmentFromDb(id).catch(console.error)
  },

  clearSegments: () => {
    set({ segments: [] })
  },
}))
