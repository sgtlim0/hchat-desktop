import { describe, it, expect, beforeEach } from 'vitest'
import { useVoiceChatStore } from '../voice-chat.store'

describe('VoiceChatStore', () => {
  beforeEach(() => {
    useVoiceChatStore.getState().reset()
  })

  it('should have idle initial state', () => {
    const s = useVoiceChatStore.getState()
    expect(s.voiceState).toBe('idle')
    expect(s.transcripts).toEqual([])
    expect(s.currentInterim).toBe('')
    expect(s.isMinimized).toBe(false)
    expect(s.language).toBe('ko-KR')
    expect(s.autoListen).toBe(true)
  })

  it('should set voice state', () => {
    useVoiceChatStore.getState().setVoiceState('listening')
    expect(useVoiceChatStore.getState().voiceState).toBe('listening')

    useVoiceChatStore.getState().setVoiceState('processing')
    expect(useVoiceChatStore.getState().voiceState).toBe('processing')

    useVoiceChatStore.getState().setVoiceState('speaking')
    expect(useVoiceChatStore.getState().voiceState).toBe('speaking')
  })

  it('should add transcripts', () => {
    const t1 = { id: '1', role: 'user' as const, text: 'Hello', timestamp: '2026-01-01T00:00:00Z' }
    const t2 = { id: '2', role: 'assistant' as const, text: 'Hi there', timestamp: '2026-01-01T00:00:01Z' }
    useVoiceChatStore.getState().addTranscript(t1)
    useVoiceChatStore.getState().addTranscript(t2)
    expect(useVoiceChatStore.getState().transcripts).toHaveLength(2)
    expect(useVoiceChatStore.getState().transcripts[0].text).toBe('Hello')
  })

  it('should set current interim text', () => {
    useVoiceChatStore.getState().setCurrentInterim('안녕하세...')
    expect(useVoiceChatStore.getState().currentInterim).toBe('안녕하세...')
  })

  it('should clear transcripts', () => {
    useVoiceChatStore.getState().addTranscript({ id: '1', role: 'user', text: 'test', timestamp: '' })
    useVoiceChatStore.getState().setCurrentInterim('interim')
    useVoiceChatStore.getState().clearTranscripts()
    expect(useVoiceChatStore.getState().transcripts).toEqual([])
    expect(useVoiceChatStore.getState().currentInterim).toBe('')
  })

  it('should toggle minimized', () => {
    expect(useVoiceChatStore.getState().isMinimized).toBe(false)
    useVoiceChatStore.getState().toggleMinimized()
    expect(useVoiceChatStore.getState().isMinimized).toBe(true)
    useVoiceChatStore.getState().toggleMinimized()
    expect(useVoiceChatStore.getState().isMinimized).toBe(false)
  })

  it('should set language', () => {
    useVoiceChatStore.getState().setLanguage('en-US')
    expect(useVoiceChatStore.getState().language).toBe('en-US')
  })

  it('should toggle auto listen', () => {
    expect(useVoiceChatStore.getState().autoListen).toBe(true)
    useVoiceChatStore.getState().toggleAutoListen()
    expect(useVoiceChatStore.getState().autoListen).toBe(false)
  })

  it('should reset to initial state', () => {
    useVoiceChatStore.getState().setVoiceState('speaking')
    useVoiceChatStore.getState().addTranscript({ id: '1', role: 'user', text: 'x', timestamp: '' })
    useVoiceChatStore.getState().toggleMinimized()
    useVoiceChatStore.getState().reset()
    const s = useVoiceChatStore.getState()
    expect(s.voiceState).toBe('idle')
    expect(s.transcripts).toEqual([])
    expect(s.isMinimized).toBe(false)
  })
})
