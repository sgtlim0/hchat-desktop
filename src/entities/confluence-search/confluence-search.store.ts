import { create } from 'zustand'
import type { ConfluencePageVM } from '@/shared/types/atlassian'
import { createPageVM } from '@/shared/types/atlassian'
import { searchConfluence, summarizePage } from '@/shared/lib/api/atlassian-client'
import { mapToAtlassianCreds, createDefaultBedrockCreds } from '@/shared/lib/api/atlassian-creds-mapper'
import { useToolIntegrationStore } from '@/entities/tool-integration/tool-integration.store'

interface ConfluenceSearchState {
  pages: ConfluencePageVM[]
  aiOverview: string | null
  total: number
  loading: boolean
  error: string | null

  search: (query: string, spaceKeys?: string[], pageIds?: string[]) => Promise<void>
  summarize: (pageId: string) => Promise<void>
  clearResults: () => void
}

export const useConfluenceSearchStore = create<ConfluenceSearchState>((set) => ({
  pages: [],
  aiOverview: null,
  total: 0,
  loading: false,
  error: null,

  search: async (query, spaceKeys = [], pageIds = []) => {
    const { confluence } = useToolIntegrationStore.getState()
    const atlassian = mapToAtlassianCreds(confluence)
    const bedrock = createDefaultBedrockCreds()

    set({ loading: true, error: null, pages: [], aiOverview: null, total: 0 })

    try {
      const res = await searchConfluence({
        atlassian,
        bedrock,
        query,
        space_keys: spaceKeys,
        page_ids: pageIds,
      })
      set({
        pages: res.results.map(createPageVM),
        aiOverview: res.ai_overview,
        total: res.total,
      })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  summarize: async (pageId) => {
    const { confluence } = useToolIntegrationStore.getState()
    const atlassian = mapToAtlassianCreds(confluence)
    const bedrock = createDefaultBedrockCreds()

    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId ? { ...p, is_summarizing: true } : p
      ),
    }))

    try {
      const res = await summarizePage({ atlassian, bedrock, page_id: pageId })
      set((state) => ({
        pages: state.pages.map((p) =>
          p.id === pageId
            ? { ...p, is_summarizing: false, ai_summary: res.summary }
            : p
        ),
      }))
    } catch (error) {
      set((state) => ({
        pages: state.pages.map((p) =>
          p.id === pageId ? { ...p, is_summarizing: false } : p
        ),
        error: (error as Error).message,
      }))
    }
  },

  clearResults: () => {
    set({ pages: [], aiOverview: null, total: 0, error: null })
  },
}))
