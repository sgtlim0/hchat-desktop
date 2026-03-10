import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMeetingStore } from '../meeting.store'
import type { MeetingTranscriptEntry, MeetingActionItem } from '../meeting.store'

describe('MeetingStore', () => {
  beforeEach(() => {
    useMeetingStore.setState({
      isRecording: false,
      startTime: null,
      transcripts: [],
      currentInterim: '',
      summary: null,
      isGeneratingSummary: false,
    })
    vi.clearAllMocks()
  })

  it('should have correct initial state', () => {
    const state = useMeetingStore.getState()
    expect(state.isRecording).toBe(false)
    expect(state.startTime).toBeNull()
    expect(state.transcripts).toEqual([])
    expect(state.currentInterim).toBe('')
    expect(state.summary).toBeNull()
    expect(state.isGeneratingSummary).toBe(false)
  })

  it('should start recording', () => {
    const { startRecording } = useMeetingStore.getState()
    const now = Date.now()

    startRecording()

    const state = useMeetingStore.getState()
    expect(state.isRecording).toBe(true)
    expect(state.startTime).toBeGreaterThanOrEqual(now)
    expect(state.transcripts).toEqual([])
    expect(state.currentInterim).toBe('')
    expect(state.summary).toBeNull()
  })

  it('should stop recording', () => {
    const { startRecording, stopRecording } = useMeetingStore.getState()

    startRecording()
    expect(useMeetingStore.getState().isRecording).toBe(true)

    stopRecording()
    expect(useMeetingStore.getState().isRecording).toBe(false)
  })

  it('should add transcript entries', () => {
    const { addTranscript } = useMeetingStore.getState()

    const entry1: Omit<MeetingTranscriptEntry, 'id'> = {
      speaker: 'User 1',
      text: 'Hello everyone',
      timestamp: Date.now(),
      isFinal: true,
    }

    addTranscript(entry1)

    let state = useMeetingStore.getState()
    expect(state.transcripts).toHaveLength(1)
    expect(state.transcripts[0].speaker).toBe('User 1')
    expect(state.transcripts[0].text).toBe('Hello everyone')
    expect(state.transcripts[0].id).toMatch(/^mt-/)

    const entry2: Omit<MeetingTranscriptEntry, 'id'> = {
      speaker: 'User 2',
      text: 'Hi there',
      timestamp: Date.now(),
      isFinal: false,
    }

    addTranscript(entry2)

    state = useMeetingStore.getState()
    expect(state.transcripts).toHaveLength(2)
    expect(state.currentInterim).toBe('')
  })

  it('should set current interim text', () => {
    const { setCurrentInterim } = useMeetingStore.getState()

    setCurrentInterim('This is interim text...')
    expect(useMeetingStore.getState().currentInterim).toBe('This is interim text...')

    setCurrentInterim('Updated interim')
    expect(useMeetingStore.getState().currentInterim).toBe('Updated interim')
  })

  it('should generate summary from transcripts', () => {
    const { startRecording, addTranscript, generateSummary } = useMeetingStore.getState()

    startRecording()

    // Add transcripts with action items and decisions
    addTranscript({
      speaker: 'Manager',
      text: '우리는 다음 주까지 보고서를 완료해야 합니다.',
      timestamp: Date.now(),
      isFinal: true,
    })

    addTranscript({
      speaker: 'Developer',
      text: '결정: 새로운 기능은 다음 스프린트에 포함시킵니다.',
      timestamp: Date.now(),
      isFinal: true,
    })

    addTranscript({
      speaker: 'Designer',
      text: 'UI 디자인은 제가 담당하겠습니다.',
      timestamp: Date.now(),
      isFinal: true,
    })

    generateSummary()

    const state = useMeetingStore.getState()
    expect(state.summary).not.toBeNull()
    expect(state.summary?.participants).toEqual(['Manager', 'Developer', 'Designer'])
    expect(state.summary?.keyPoints.length).toBeGreaterThan(0) // At least some key points
    expect(state.summary?.actionItems.length).toBeGreaterThan(0)
    expect(state.summary?.decisions).toHaveLength(1)
    expect(state.summary?.decisions[0]).toBe('새로운 기능은 다음 스프린트에 포함시킵니다')
  })

  it('should not generate summary with no transcripts', () => {
    const { generateSummary } = useMeetingStore.getState()

    generateSummary()

    const state = useMeetingStore.getState()
    expect(state.summary).toBeNull()
    expect(state.isGeneratingSummary).toBe(false)
  })

  it('should toggle action item completion', () => {
    const { generateSummary, addTranscript, startRecording, toggleActionItem } = useMeetingStore.getState()

    startRecording()
    addTranscript({
      speaker: 'Manager',
      text: 'John이 보고서를 작성해야 합니다.',
      timestamp: Date.now(),
      isFinal: true,
    })

    generateSummary()

    const state1 = useMeetingStore.getState()
    const actionItem = state1.summary?.actionItems[0]
    expect(actionItem?.completed).toBe(false)

    if (actionItem) {
      toggleActionItem(actionItem.id)
      const state2 = useMeetingStore.getState()
      expect(state2.summary?.actionItems[0].completed).toBe(true)

      toggleActionItem(actionItem.id)
      const state3 = useMeetingStore.getState()
      expect(state3.summary?.actionItems[0].completed).toBe(false)
    }
  })

  it('should clear meeting data', () => {
    const { startRecording, addTranscript, clearMeeting } = useMeetingStore.getState()

    startRecording()
    addTranscript({
      speaker: 'User',
      text: 'Test message',
      timestamp: Date.now(),
      isFinal: true,
    })

    expect(useMeetingStore.getState().transcripts).toHaveLength(1)

    clearMeeting()

    const state = useMeetingStore.getState()
    expect(state.isRecording).toBe(false)
    expect(state.startTime).toBeNull()
    expect(state.transcripts).toEqual([])
    expect(state.currentInterim).toBe('')
    expect(state.summary).toBeNull()
    expect(state.isGeneratingSummary).toBe(false)
  })
})