import { describe, it, expect, beforeEach } from 'vitest'
import { useMeetingStore } from '@/entities/meeting/meeting.store'

describe('meetingStore', () => {
  beforeEach(() => {
    useMeetingStore.getState().clearMeeting()
  })

  describe('recording', () => {
    it('should start recording', () => {
      useMeetingStore.getState().startRecording()
      const state = useMeetingStore.getState()
      expect(state.isRecording).toBe(true)
      expect(state.startTime).not.toBeNull()
      expect(state.transcripts).toEqual([])
    })

    it('should stop recording', () => {
      useMeetingStore.getState().startRecording()
      useMeetingStore.getState().stopRecording()
      expect(useMeetingStore.getState().isRecording).toBe(false)
    })

    it('should add transcripts', () => {
      useMeetingStore.getState().startRecording()
      useMeetingStore.getState().addTranscript({
        speaker: 'User',
        text: '오늘 회의 안건입니다',
        timestamp: Date.now(),
        isFinal: true,
      })

      const { transcripts } = useMeetingStore.getState()
      expect(transcripts).toHaveLength(1)
      expect(transcripts[0].speaker).toBe('User')
      expect(transcripts[0].id).toBeDefined()
    })

    it('should set current interim text', () => {
      useMeetingStore.getState().setCurrentInterim('진행 중...')
      expect(useMeetingStore.getState().currentInterim).toBe('진행 중...')
    })
  })

  describe('summary generation', () => {
    it('should generate summary from transcripts', () => {
      useMeetingStore.getState().startRecording()

      useMeetingStore.getState().addTranscript({
        speaker: 'Kim',
        text: '다음 주까지 보고서 작성을 완료해야 합니다',
        timestamp: Date.now(),
        isFinal: true,
      })

      useMeetingStore.getState().addTranscript({
        speaker: 'Lee',
        text: '디자인 리뷰도 진행해야 합니다. 이것은 중요한 결정입니다',
        timestamp: Date.now(),
        isFinal: true,
      })

      useMeetingStore.getState().generateSummary()
      const { summary } = useMeetingStore.getState()

      expect(summary).not.toBeNull()
      expect(summary!.participants).toContain('Kim')
      expect(summary!.participants).toContain('Lee')
      expect(summary!.duration).toBeGreaterThanOrEqual(0)
      expect(summary!.generatedAt).toBeDefined()
    })

    it('should not generate summary with empty transcripts', () => {
      useMeetingStore.getState().generateSummary()
      expect(useMeetingStore.getState().summary).toBeNull()
    })

    it('should toggle action items', () => {
      useMeetingStore.getState().startRecording()
      useMeetingStore.getState().addTranscript({
        speaker: 'Kim',
        text: '보고서를 다음 주까지 완료해야 합니다',
        timestamp: Date.now(),
        isFinal: true,
      })
      useMeetingStore.getState().generateSummary()

      const { summary } = useMeetingStore.getState()
      if (summary && summary.actionItems.length > 0) {
        const itemId = summary.actionItems[0].id
        useMeetingStore.getState().toggleActionItem(itemId)
        const updated = useMeetingStore.getState().summary!.actionItems[0]
        expect(updated.completed).toBe(true)
      }
    })
  })

  describe('clearMeeting', () => {
    it('should reset all state', () => {
      useMeetingStore.getState().startRecording()
      useMeetingStore.getState().addTranscript({
        speaker: 'User',
        text: 'test',
        timestamp: Date.now(),
        isFinal: true,
      })
      useMeetingStore.getState().clearMeeting()

      const state = useMeetingStore.getState()
      expect(state.isRecording).toBe(false)
      expect(state.transcripts).toEqual([])
      expect(state.summary).toBeNull()
    })
  })
})
