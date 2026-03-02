import { create } from 'zustand'
import type { SlackConfig, TelegramConfig } from '@/shared/types'

interface ChannelState {
  slack: SlackConfig
  telegram: TelegramConfig
  testStatus: 'idle' | 'testing' | 'success' | 'error'
  testError: string

  updateSlack: (updates: Partial<SlackConfig>) => void
  updateTelegram: (updates: Partial<TelegramConfig>) => void
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

export const useChannelStore = create<ChannelState>((set) => ({
  slack: DEFAULT_SLACK,
  telegram: DEFAULT_TELEGRAM,
  testStatus: 'idle',
  testError: '',

  updateSlack: (updates) => {
    set((state) => ({ slack: { ...state.slack, ...updates } }))
  },

  updateTelegram: (updates) => {
    set((state) => ({ telegram: { ...state.telegram, ...updates } }))
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
    set((state) => ({
      telegram: { ...state.telegram, connected: true },
      testStatus: 'success',
    }))
  },

  setTestStatus: (status) => set({ testStatus: status }),
}))
