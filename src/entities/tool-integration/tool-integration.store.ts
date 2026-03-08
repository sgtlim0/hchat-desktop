import { create } from 'zustand'
import { verifyAtlassian } from '@/shared/lib/api/atlassian-client'
import { mapToAtlassianCreds } from '@/shared/lib/api/atlassian-creds-mapper'

interface AtlassianConfig {
  baseUrl: string
  email: string
  apiToken: string
  connected: boolean
  displayName?: string
  accountId?: string
}

interface ActiveTools {
  confluence: boolean
  jira: boolean
}

interface ToolIntegrationState {
  confluence: AtlassianConfig
  jira: AtlassianConfig
  activeToolsBySession: Record<string, ActiveTools>

  updateConfluence: (updates: Partial<AtlassianConfig>) => void
  updateJira: (updates: Partial<AtlassianConfig>) => void
  setActiveTools: (sessionId: string, tools: Partial<ActiveTools>) => void
  getActiveTools: (sessionId: string) => ActiveTools
  isConfluenceConfigured: () => boolean
  isJiraConfigured: () => boolean
  shareCredentials: () => void
  clearConfig: () => void
  testConnection: (type: 'confluence' | 'jira') => Promise<boolean>
}

const getDefaultConfig = (): AtlassianConfig => ({
  baseUrl: '',
  email: '',
  apiToken: '',
  connected: false
})

const getDefaultActiveTools = (): ActiveTools => ({
  confluence: false,
  jira: false
})

export const useToolIntegrationStore = create<ToolIntegrationState>((set, get) => ({
  confluence: getDefaultConfig(),
  jira: getDefaultConfig(),
  activeToolsBySession: {},

  updateConfluence: (updates) => {
    set((state) => ({
      confluence: {
        ...state.confluence,
        ...updates
      }
    }))
  },

  updateJira: (updates) => {
    set((state) => ({
      jira: {
        ...state.jira,
        ...updates
      }
    }))
  },

  setActiveTools: (sessionId, tools) => {
    set((state) => ({
      activeToolsBySession: {
        ...state.activeToolsBySession,
        [sessionId]: {
          ...state.activeToolsBySession[sessionId] || getDefaultActiveTools(),
          ...tools
        }
      }
    }))
  },

  getActiveTools: (sessionId) => {
    const state = get()
    return state.activeToolsBySession[sessionId] || getDefaultActiveTools()
  },

  isConfluenceConfigured: () => {
    const state = get()
    return state.confluence.connected
  },

  isJiraConfigured: () => {
    const state = get()
    return state.jira.connected
  },

  shareCredentials: () => {
    const state = get()
    set({
      jira: {
        baseUrl: state.confluence.baseUrl,
        email: state.confluence.email,
        apiToken: state.confluence.apiToken,
        connected: false // 연결 상태는 복사하지 않음
      }
    })
  },

  clearConfig: () => {
    set({
      confluence: getDefaultConfig(),
      jira: getDefaultConfig(),
      activeToolsBySession: {}
    })
  },

  testConnection: async (type) => {
    const state = get()
    const config = type === 'confluence' ? state.confluence : state.jira

    if (!config.baseUrl || !config.email || !config.apiToken) {
      return false
    }

    try {
      const creds = mapToAtlassianCreds(config)
      const result = await verifyAtlassian(creds)
      const updateFn = type === 'confluence' ? 'updateConfluence' : 'updateJira'
      get()[updateFn]({
        connected: result.valid,
        displayName: result.display_name,
        accountId: result.account_id,
      })
      return result.valid
    } catch {
      const updateFn = type === 'confluence' ? 'updateConfluence' : 'updateJira'
      get()[updateFn]({ connected: false, displayName: undefined, accountId: undefined })
      return false
    }
  }
}))