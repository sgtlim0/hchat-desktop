import { create } from 'zustand'
import type { DataStory, StoryChapter } from '@/shared/types'
import {
  getAllDataStories,
  putDataStory,
  deleteDataStoryFromDb,
} from '@/shared/lib/db'

interface DataStoryState {
  stories: DataStory[]
  selectedStoryId: string | null

  hydrate: () => void
  createStory: (title: string, sourceData: string) => void
  deleteStory: (id: string) => void
  addChapter: (storyId: string, chapter: StoryChapter) => void
  updateChapter: (storyId: string, chapterId: string, updates: Partial<Pick<StoryChapter, 'title' | 'narrative' | 'chartType' | 'data' | 'insight' | 'order'>>) => void
  removeChapter: (storyId: string, chapterId: string) => void
  selectStory: (id: string | null) => void
}

export const useDataStoryStore = create<DataStoryState>((set) => ({
  stories: [],
  selectedStoryId: null,

  hydrate: () => {
    getAllDataStories()
      .then((stories) => {
        set({ stories })
      })
      .catch(console.error)
  },

  createStory: (title, sourceData) => {
    const now = new Date().toISOString()
    const story: DataStory = {
      id: crypto.randomUUID(),
      title,
      chapters: [],
      sourceData,
      generatedHtml: '',
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({
      stories: [story, ...state.stories],
    }))

    putDataStory(story).catch(console.error)
  },

  deleteStory: (id) => {
    set((state) => ({
      stories: state.stories.filter((s) => s.id !== id),
      selectedStoryId: state.selectedStoryId === id ? null : state.selectedStoryId,
    }))

    deleteDataStoryFromDb(id).catch(console.error)
  },

  addChapter: (storyId, chapter) => {
    set((state) => ({
      stories: state.stories.map((s) => {
        if (s.id !== storyId) return s
        const updated = {
          ...s,
          chapters: [...s.chapters, chapter],
          updatedAt: new Date().toISOString(),
        }
        putDataStory(updated).catch(console.error)
        return updated
      }),
    }))
  },

  updateChapter: (storyId, chapterId, updates) => {
    set((state) => ({
      stories: state.stories.map((s) => {
        if (s.id !== storyId) return s
        const updated = {
          ...s,
          chapters: s.chapters.map((ch) => {
            if (ch.id !== chapterId) return ch
            return { ...ch, ...updates }
          }),
          updatedAt: new Date().toISOString(),
        }
        putDataStory(updated).catch(console.error)
        return updated
      }),
    }))
  },

  removeChapter: (storyId, chapterId) => {
    set((state) => ({
      stories: state.stories.map((s) => {
        if (s.id !== storyId) return s
        const updated = {
          ...s,
          chapters: s.chapters.filter((ch) => ch.id !== chapterId),
          updatedAt: new Date().toISOString(),
        }
        putDataStory(updated).catch(console.error)
        return updated
      }),
    }))
  },

  selectStory: (id) => {
    set({ selectedStoryId: id })
  },
}))
