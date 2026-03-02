import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useChannelStore } from '../channel.store'

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
    it('updates webhook URL', () => {
      useChannelStore.getState().updateSlack({ webhookUrl: 'https://hooks.slack.com/test' })
      expect(useChannelStore.getState().slack.webhookUrl).toBe('https://hooks.slack.com/test')
    })

    it('updates channel', () => {
      useChannelStore.getState().updateSlack({ channel: '#dev' })
      expect(useChannelStore.getState().slack.channel).toBe('#dev')
    })

    it('updates notification flags', () => {
      useChannelStore.getState().updateSlack({
        notifyOnComplete: false,
        notifyOnError: false,
        notifyOnSchedule: true,
      })

      const { slack } = useChannelStore.getState()
      expect(slack.notifyOnComplete).toBe(false)
      expect(slack.notifyOnError).toBe(false)
      expect(slack.notifyOnSchedule).toBe(true)
    })

    it('preserves other fields', () => {
      useChannelStore.getState().updateSlack({ webhookUrl: 'https://hooks.slack.com/new' })

      const { slack } = useChannelStore.getState()
      expect(slack.channel).toBe('#general')
      expect(slack.notifyOnComplete).toBe(true)
      expect(slack.notifyOnError).toBe(true)
      expect(slack.notifyOnSchedule).toBe(false)
    })

    it('allows partial updates', () => {
      useChannelStore.getState().updateSlack({
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
    it('updates bot token', () => {
      useChannelStore.getState().updateTelegram({ botToken: 'bot123:ABC' })
      expect(useChannelStore.getState().telegram.botToken).toBe('bot123:ABC')
    })

    it('updates chat ID', () => {
      useChannelStore.getState().updateTelegram({ chatId: '12345' })
      expect(useChannelStore.getState().telegram.chatId).toBe('12345')
    })

    it('updates connected status', () => {
      useChannelStore.getState().updateTelegram({ connected: true })
      expect(useChannelStore.getState().telegram.connected).toBe(true)
    })

    it('preserves other fields', () => {
      useChannelStore.getState().updateTelegram({ botToken: 'bot123:ABC' })

      const { telegram } = useChannelStore.getState()
      expect(telegram.chatId).toBe('')
      expect(telegram.connected).toBe(false)
    })

    it('allows partial updates', () => {
      useChannelStore.getState().updateTelegram({
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
    it('sets status to testing initially', async () => {
      const promise = useChannelStore.getState().testSlackConnection()
      expect(useChannelStore.getState().testStatus).toBe('testing')
      await promise
    })

    it('clears error on new test', async () => {
      useChannelStore.setState({ testError: 'Previous error' })
      const promise = useChannelStore.getState().testSlackConnection()
      expect(useChannelStore.getState().testError).toBe('')
      await promise
    })

    it('sets status to success after delay', async () => {
      vi.useFakeTimers()
      const promise = useChannelStore.getState().testSlackConnection()

      expect(useChannelStore.getState().testStatus).toBe('testing')

      vi.advanceTimersByTime(1500)
      await promise

      expect(useChannelStore.getState().testStatus).toBe('success')
      vi.useRealTimers()
    })
  })

  describe('connectTelegram', () => {
    it('sets status to testing initially', async () => {
      const promise = useChannelStore.getState().connectTelegram()
      expect(useChannelStore.getState().testStatus).toBe('testing')
      await promise
    })

    it('clears error on new connection', async () => {
      useChannelStore.setState({ testError: 'Previous error' })
      const promise = useChannelStore.getState().connectTelegram()
      expect(useChannelStore.getState().testError).toBe('')
      await promise
    })

    it('sets connected to true and status to success', async () => {
      vi.useFakeTimers()
      const promise = useChannelStore.getState().connectTelegram()

      expect(useChannelStore.getState().testStatus).toBe('testing')
      expect(useChannelStore.getState().telegram.connected).toBe(false)

      vi.advanceTimersByTime(1500)
      await promise

      expect(useChannelStore.getState().testStatus).toBe('success')
      expect(useChannelStore.getState().telegram.connected).toBe(true)
      vi.useRealTimers()
    })

    it('preserves other telegram fields', async () => {
      useChannelStore.getState().updateTelegram({
        botToken: 'bot123:ABC',
        chatId: '12345',
      })

      await useChannelStore.getState().connectTelegram()

      const { telegram } = useChannelStore.getState()
      expect(telegram.botToken).toBe('bot123:ABC')
      expect(telegram.chatId).toBe('12345')
      expect(telegram.connected).toBe(true)
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
