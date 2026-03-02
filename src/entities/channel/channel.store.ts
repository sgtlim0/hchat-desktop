import { create } from 'zustand'
import type { SlackConfig, TelegramConfig } from '@/shared/types'
import { getChannelConfig, putChannelConfig } from '@/shared/lib/db'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

interface NotifyResult {
  success: boolean
  errors: string[]
}

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
  sendNotification: (message: string) => Promise<NotifyResult>
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
    const { slack } = get()

    if (!slack.webhookUrl) {
      set({ testStatus: 'error', testError: 'Webhook URL is required' })
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/channels/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'slack',
          message: 'H Chat connection test',
          config: { webhookUrl: slack.webhookUrl },
        }),
      })

      const data = await response.json()
      if (data.success) {
        set({ testStatus: 'success' })
      } else {
        set({ testStatus: 'error', testError: data.error ?? 'Connection failed' })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed'
      set({ testStatus: 'error', testError: message })
    }
  },

  connectTelegram: async () => {
    set({ testStatus: 'testing', testError: '' })
    const { telegram } = get()

    if (!telegram.botToken || !telegram.chatId) {
      set({ testStatus: 'error', testError: 'Bot token and chat ID are required' })
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/channels/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'telegram',
          message: 'H Chat connected!',
          config: { botToken: telegram.botToken, chatId: telegram.chatId },
        }),
      })

      const data = await response.json()
      if (data.success) {
        const newTelegram = { ...telegram, connected: true }
        set({ telegram: newTelegram, testStatus: 'success' })
        await putChannelConfig({ slack: get().slack, telegram: newTelegram })
      } else {
        set({ testStatus: 'error', testError: data.error ?? 'Connection failed' })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed'
      set({ testStatus: 'error', testError: message })
    }
  },

  setTestStatus: (status) => set({ testStatus: status }),

  sendNotification: async (message) => {
    const { slack, telegram } = get()
    const errors: string[] = []
    let anySuccess = false

    // Send to Slack if webhook is configured
    if (slack.webhookUrl) {
      try {
        const response = await fetch(`${API_BASE}/api/channels/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: 'slack',
            message,
            config: { webhookUrl: slack.webhookUrl },
          }),
        })
        const data = await response.json()
        if (data.success) {
          anySuccess = true
        } else {
          errors.push(`Slack: ${data.error}`)
        }
      } catch (error) {
        errors.push(`Slack: ${error instanceof Error ? error.message : 'Failed'}`)
      }
    }

    // Send to Telegram if connected
    if (telegram.connected && telegram.botToken && telegram.chatId) {
      try {
        const response = await fetch(`${API_BASE}/api/channels/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: 'telegram',
            message,
            config: { botToken: telegram.botToken, chatId: telegram.chatId },
          }),
        })
        const data = await response.json()
        if (data.success) {
          anySuccess = true
        } else {
          errors.push(`Telegram: ${data.error}`)
        }
      } catch (error) {
        errors.push(`Telegram: ${error instanceof Error ? error.message : 'Failed'}`)
      }
    }

    return { success: anySuccess, errors }
  },
}))
