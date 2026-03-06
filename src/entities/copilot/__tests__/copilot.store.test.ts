import { describe, it, expect, beforeEach } from 'vitest'
import { useCopilotStore } from '../copilot.store'

describe('CopilotStore', () => {
  beforeEach(() => {
    useCopilotStore.getState().reset()
  })

  it('should have closed initial state', () => {
    const s = useCopilotStore.getState()
    expect(s.isOpen).toBe(false)
    expect(s.size).toBe('mini')
    expect(s.messages).toEqual([])
    expect(s.input).toBe('')
    expect(s.isStreaming).toBe(false)
  })

  it('should toggle open/close', () => {
    useCopilotStore.getState().toggle()
    expect(useCopilotStore.getState().isOpen).toBe(true)
    useCopilotStore.getState().toggle()
    expect(useCopilotStore.getState().isOpen).toBe(false)
  })

  it('should open and close explicitly', () => {
    useCopilotStore.getState().open()
    expect(useCopilotStore.getState().isOpen).toBe(true)
    useCopilotStore.getState().close()
    expect(useCopilotStore.getState().isOpen).toBe(false)
  })

  it('should set size', () => {
    useCopilotStore.getState().setSize('full')
    expect(useCopilotStore.getState().size).toBe('full')
    useCopilotStore.getState().setSize('mini')
    expect(useCopilotStore.getState().size).toBe('mini')
  })

  it('should set input', () => {
    useCopilotStore.getState().setInput('test query')
    expect(useCopilotStore.getState().input).toBe('test query')
  })

  it('should add messages', () => {
    const msg = { id: '1', role: 'user' as const, content: 'Hello', timestamp: '2026-01-01T00:00:00Z' }
    useCopilotStore.getState().addMessage(msg)
    expect(useCopilotStore.getState().messages).toHaveLength(1)
    expect(useCopilotStore.getState().messages[0].content).toBe('Hello')
  })

  it('should update last assistant message', () => {
    useCopilotStore.getState().addMessage({ id: '1', role: 'user', content: 'q', timestamp: '' })
    useCopilotStore.getState().addMessage({ id: '2', role: 'assistant', content: 'partial', timestamp: '' })
    useCopilotStore.getState().updateLastAssistant('full response')
    expect(useCopilotStore.getState().messages[1].content).toBe('full response')
  })

  it('should not crash updateLastAssistant when no assistant message', () => {
    useCopilotStore.getState().addMessage({ id: '1', role: 'user', content: 'q', timestamp: '' })
    useCopilotStore.getState().updateLastAssistant('test')
    expect(useCopilotStore.getState().messages[0].content).toBe('q')
  })

  it('should set streaming state', () => {
    useCopilotStore.getState().setStreaming(true)
    expect(useCopilotStore.getState().isStreaming).toBe(true)
  })

  it('should set context hint', () => {
    useCopilotStore.getState().setContextHint('채팅 페이지')
    expect(useCopilotStore.getState().contextHint).toBe('채팅 페이지')
  })

  it('should clear messages', () => {
    useCopilotStore.getState().addMessage({ id: '1', role: 'user', content: 'q', timestamp: '' })
    useCopilotStore.getState().setInput('draft')
    useCopilotStore.getState().clearMessages()
    expect(useCopilotStore.getState().messages).toEqual([])
    expect(useCopilotStore.getState().input).toBe('')
  })

  it('should reset to initial state', () => {
    useCopilotStore.getState().open()
    useCopilotStore.getState().setSize('full')
    useCopilotStore.getState().addMessage({ id: '1', role: 'user', content: 'q', timestamp: '' })
    useCopilotStore.getState().reset()
    const s = useCopilotStore.getState()
    expect(s.isOpen).toBe(false)
    expect(s.size).toBe('mini')
    expect(s.messages).toEqual([])
  })
})
