import { create } from 'zustand'
import type { SlackConfig, TelegramConfig } from '@/shared/types'
import { getChannelConfig, putChannelConfig } from '@/shared/lib/db'

interface ChannelState {
  slack: SlackConfig
  telegram: TelegramConfig
  testStatus: 'idle' | 'testing' | 'success' | 'error'
  testError: string

  hydrate: () => Promise<void>
  updateSlack: (updates: Partial<SlackConfig>) => Promise<void>
  updateTelegram: (updates: Partial<TelegramConfig>) => Promise<void>
  testSlackConnection: () => Promise<void>
  connectTelegram: () => Promise<void>
  setTestStatus: (status: 'idle' | 'testing' | 'success' | 'error') => void
}

const DEFAULT_SLACK: SlackConfig = {
  webhookUrl: '',
  channel: '#general',
  notifyOnComplete: true,
  notifyOnError: true,
  notifyOnSchedule: false,
}

const DEFAULT_TELEGRAM: TelegramConfig = {
  botToken: '',
  chatId: '',
  connected: false,
}

export const useChannelStore = create<ChannelState>((set, get) => ({
  slack: DEFAULT_SLACK,
  telegram: DEFAULT_TELEGRAM,
  testStatus: 'idle',
  testError: '',

  hydrate: async () => {
    const config = await getChannelConfig()
    if (config) {
      set({ slack: config.slack, telegram: config.telegram })
    }
  },

  updateSlack: async (updates) => {
    const newSlack = { ...get().slack, ...updates }
    set({ slack: newSlack })
    await putChannelConfig({ slack: newSlack, telegram: get().telegram })
  },

  updateTelegram: async (updates) => {
    const newTelegram = { ...get().telegram, ...updates }
    set({ telegram: newTelegram })
    await putChannelConfig({ slack: get().slack, telegram: newTelegram })
  },

  testSlackConnection: async () => {
    set({ testStatus: 'testing', testError: '' })
    // Mock test - simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    set({ testStatus: 'success' })
  },

  connectTelegram: async () => {
    set({ testStatus: 'testing', testError: '' })
    // Mock connection - simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const newTelegram = { ...get().telegram, connected: true }
    set({ telegram: newTelegram, testStatus: 'success' })
    await putChannelConfig({ slack: get().slack, telegram: newTelegram })
  },

  setTestStatus: (status) => set({ testStatus: status }),
}))
