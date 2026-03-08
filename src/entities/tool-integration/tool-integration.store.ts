import { create } from 'zustand'

interface AtlassianConfig {
  baseUrl: string
  email: string
  apiToken: string
  connected: boolean
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

    // 모든 필수 필드가 채워져 있는지 확인
    if (!config.baseUrl || !config.email || !config.apiToken) {
      return false
    }

    // 실제 API 호출은 다른 곳에서 수행
    // 여기서는 필드 검증만 수행
    return true
  }
}))