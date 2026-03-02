import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useChannelStore } from '../channel.store'

vi.mock('@/shared/lib/db', () => ({
  getChannelConfig: vi.fn().mockResolvedValue(undefined),
  putChannelConfig: vi.fn().mockResolvedValue(undefined),
}))

describe('useChannelStore', () => {
  beforeEach(() => {
    useChannelStore.setState({
      slack: {
        webhookUrl: '',
        channel: '#general',
        notifyOnComplete: true,
        notifyOnError: true,
        notifyOnSchedule: false,
      },
      telegram: {
        botToken: '',
        chatId: '',
        connected: false,
      },
      testStatus: 'idle',
      testError: '',
    })
    vi.clearAllTimers()
  })

  describe('initial state', () => {
    it('has default Slack config', () => {
      const { slack } = useChannelStore.getState()
      expect(slack).toEqual({
        webhookUrl: '',
        channel: '#general',
        notifyOnComplete: true,
        notifyOnError: true,
        notifyOnSchedule: false,
      })
    })

    it('has default Telegram config', () => {
      const { telegram } = useChannelStore.getState()
      expect(telegram).toEqual({
        botToken: '',
        chatId: '',
        connected: false,
      })
    })

    it('has idle test status', () => {
      expect(useChannelStore.getState().testStatus).toBe('idle')
    })

    it('has empty test error', () => {
      expect(useChannelStore.getState().testError).toBe('')
    })
  })

  describe('updateSlack', () => {
    it('updates webhook URL', async () => {
      await useChannelStore.getState().updateSlack({ webhookUrl: 'https://hooks.slack.com/test' })
      expect(useChannelStore.getState().slack.webhookUrl).toBe('https://hooks.slack.com/test')
    })

    it('updates channel', async () => {
      await useChannelStore.getState().updateSlack({ channel: '#dev' })
      expect(useChannelStore.getState().slack.channel).toBe('#dev')
    })

    it('updates notification flags', async () => {
      await useChannelStore.getState().updateSlack({
        notifyOnComplete: false,
        notifyOnError: false,
        notifyOnSchedule: true,
      })

      const { slack } = useChannelStore.getState()
      expect(slack.notifyOnComplete).toBe(false)
      expect(slack.notifyOnError).toBe(false)
      expect(slack.notifyOnSchedule).toBe(true)
    })

    it('preserves other fields', async () => {
      await useChannelStore.getState().updateSlack({ webhookUrl: 'https://hooks.slack.com/new' })

      const { slack } = useChannelStore.getState()
      expect(slack.channel).toBe('#general')
      expect(slack.notifyOnComplete).toBe(true)
      expect(slack.notifyOnError).toBe(true)
      expect(slack.notifyOnSchedule).toBe(false)
    })

    it('allows partial updates', async () => {
      await useChannelStore.getState().updateSlack({
        webhookUrl: 'https://hooks.slack.com/test',
        channel: '#dev',
      })

      const { slack } = useChannelStore.getState()
      expect(slack.webhookUrl).toBe('https://hooks.slack.com/test')
      expect(slack.channel).toBe('#dev')
      expect(slack.notifyOnComplete).toBe(true)
    })
  })

  describe('updateTelegram', () => {
    it('updates bot token', async () => {
      await useChannelStore.getState().updateTelegram({ botToken: 'bot123:ABC' })
      expect(useChannelStore.getState().telegram.botToken).toBe('bot123:ABC')
    })

    it('updates chat ID', async () => {
      await useChannelStore.getState().updateTelegram({ chatId: '12345' })
      expect(useChannelStore.getState().telegram.chatId).toBe('12345')
    })

    it('updates connected status', async () => {
      await useChannelStore.getState().updateTelegram({ connected: true })
      expect(useChannelStore.getState().telegram.connected).toBe(true)
    })

    it('preserves other fields', async () => {
      await useChannelStore.getState().updateTelegram({ botToken: 'bot123:ABC' })

      const { telegram } = useChannelStore.getState()
      expect(telegram.chatId).toBe('')
      expect(telegram.connected).toBe(false)
    })

    it('allows partial updates', async () => {
      await useChannelStore.getState().updateTelegram({
        botToken: 'bot123:ABC',
        chatId: '12345',
      })

      const { telegram } = useChannelStore.getState()
      expect(telegram.botToken).toBe('bot123:ABC')
      expect(telegram.chatId).toBe('12345')
      expect(telegram.connected).toBe(false)
    })
  })

  describe('testSlackConnection', () => {
    it('sets error when no webhook URL', async () => {
      await useChannelStore.getState().testSlackConnection()
      expect(useChannelStore.getState().testStatus).toBe('error')
      expect(useChannelStore.getState().testError).toBe('Webhook URL is required')
    })

    it('clears error on new test', async () => {
      useChannelStore.setState({ testError: 'Previous error' })
      await useChannelStore.getState().testSlackConnection()
      // error is replaced, not cleared to empty (validation error replaces it)
      expect(useChannelStore.getState().testError).toBe('Webhook URL is required')
    })

    it('sets status to success on successful fetch', async () => {
      await useChannelStore.getState().updateSlack({ webhookUrl: 'https://hooks.slack.com/test' })

      const mockFetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      })
      vi.stubGlobal('fetch', mockFetch)

      await useChannelStore.getState().testSlackConnection()

      expect(useChannelStore.getState().testStatus).toBe('success')
      expect(mockFetch).toHaveBeenCalledOnce()
      vi.unstubAllGlobals()
    })

    it('sets error on failed fetch', async () => {
      await useChannelStore.getState().updateSlack({ webhookUrl: 'https://hooks.slack.com/test' })

      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

      await useChannelStore.getState().testSlackConnection()

      expect(useChannelStore.getState().testStatus).toBe('error')
      expect(useChannelStore.getState().testError).toBe('Network error')
      vi.unstubAllGlobals()
    })
  })

  describe('connectTelegram', () => {
    it('sets error when no bot token', async () => {
      await useChannelStore.getState().connectTelegram()
      expect(useChannelStore.getState().testStatus).toBe('error')
      expect(useChannelStore.getState().testError).toBe('Bot token and chat ID are required')
    })

    it('clears error on new connection', async () => {
      useChannelStore.setState({ testError: 'Previous error' })
      await useChannelStore.getState().connectTelegram()
      expect(useChannelStore.getState().testError).toBe('Bot token and chat ID are required')
    })

    it('sets connected to true and status to success', async () => {
      await useChannelStore.getState().updateTelegram({
        botToken: 'bot123:ABC',
        chatId: '12345',
      })

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      }))

      await useChannelStore.getState().connectTelegram()

      expect(useChannelStore.getState().testStatus).toBe('success')
      expect(useChannelStore.getState().telegram.connected).toBe(true)
      vi.unstubAllGlobals()
    })

    it('preserves other telegram fields', async () => {
      await useChannelStore.getState().updateTelegram({
        botToken: 'bot123:ABC',
        chatId: '12345',
      })

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      }))

      await useChannelStore.getState().connectTelegram()

      const { telegram } = useChannelStore.getState()
      expect(telegram.botToken).toBe('bot123:ABC')
      expect(telegram.chatId).toBe('12345')
      expect(telegram.connected).toBe(true)
      vi.unstubAllGlobals()
    })
  })

  describe('setTestStatus', () => {
    it('sets status to idle', () => {
      useChannelStore.setState({ testStatus: 'testing' })
      useChannelStore.getState().setTestStatus('idle')
      expect(useChannelStore.getState().testStatus).toBe('idle')
    })

    it('sets status to testing', () => {
      useChannelStore.getState().setTestStatus('testing')
      expect(useChannelStore.getState().testStatus).toBe('testing')
    })

    it('sets status to success', () => {
      useChannelStore.getState().setTestStatus('success')
      expect(useChannelStore.getState().testStatus).toBe('success')
    })

    it('sets status to error', () => {
      useChannelStore.getState().setTestStatus('error')
      expect(useChannelStore.getState().testStatus).toBe('error')
    })
  })
})
