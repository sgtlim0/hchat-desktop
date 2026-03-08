import { create } from 'zustand'
import type { JiraTicketVM } from '@/shared/types/atlassian'
import { createTicketVM } from '@/shared/types/atlassian'
import { searchJira, analyzeTicket } from '@/shared/lib/api/atlassian-client'
import { mapToAtlassianCreds, createDefaultBedrockCreds } from '@/shared/lib/api/atlassian-creds-mapper'
import { useToolIntegrationStore } from '@/entities/tool-integration/tool-integration.store'

interface JiraSearchState {
  tickets: JiraTicketVM[]
  aiOverview: string | null
  total: number
  loading: boolean
  error: string | null

  search: (query: string, projectKeys?: string[], ticketIds?: string[]) => Promise<void>
  analyze: (issueKey: string) => Promise<void>
  clearResults: () => void
}

export const useJiraSearchStore = create<JiraSearchState>((set) => ({
  tickets: [],
  aiOverview: null,
  total: 0,
  loading: false,
  error: null,

  search: async (query, projectKeys = [], ticketIds = []) => {
    const { confluence } = useToolIntegrationStore.getState()
    const atlassian = mapToAtlassianCreds(confluence)
    const bedrock = createDefaultBedrockCreds()

    set({ loading: true, error: null, tickets: [], aiOverview: null, total: 0 })

    try {
      const res = await searchJira({
        atlassian,
        bedrock,
        query,
        project_keys: projectKeys,
        ticket_ids: ticketIds,
      })
      set({
        tickets: res.results.map(createTicketVM),
        aiOverview: res.ai_overview,
        total: res.total,
      })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  analyze: async (issueKey) => {
    const { confluence } = useToolIntegrationStore.getState()
    const atlassian = mapToAtlassianCreds(confluence)
    const bedrock = createDefaultBedrockCreds()

    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.key === issueKey ? { ...t, is_analyzing: true } : t
      ),
    }))

    try {
      const res = await analyzeTicket({ atlassian, bedrock, issue_key: issueKey })
      set((state) => ({
        tickets: state.tickets.map((t) =>
          t.key === issueKey
            ? { ...t, is_analyzing: false, ai_analysis: res.ai_analysis, total_comments: res.total_comments }
            : t
        ),
      }))
    } catch (error) {
      set((state) => ({
        tickets: state.tickets.map((t) =>
          t.key === issueKey ? { ...t, is_analyzing: false } : t
        ),
        error: (error as Error).message,
      }))
    }
  },

  clearResults: () => {
    set({ tickets: [], aiOverview: null, total: 0, error: null })
  },
}))
