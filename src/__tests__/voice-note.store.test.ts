import { describe, it, expect, beforeEach } from 'vitest'
import { useVoiceNoteStore } from '@/entities/voice-note/voice-note.store'

describe('voiceNoteStore', () => {
  beforeEach(() => {
    useVoiceNoteStore.getState().clearAll()
  })

  describe('recording', () => {
    it('should start recording', () => {
      useVoiceNoteStore.getState().startRecording()
      expect(useVoiceNoteStore.getState().isRecording).toBe(true)
      expect(useVoiceNoteStore.getState().recordingStartTime).not.toBeNull()
    })

    it('should stop and save note', () => {
      useVoiceNoteStore.getState().startRecording()
      useVoiceNoteStore.getState().stopAndSave('오늘 해야 할 일 목록 정리')

      const { notes, isRecording } = useVoiceNoteStore.getState()
      expect(isRecording).toBe(false)
      expect(notes).toHaveLength(1)
      expect(notes[0].processedText).toBe('오늘 해야 할 일 목록 정리')
      expect(notes[0].tags).toContain('todo')
    })

    it('should not save empty note', () => {
      useVoiceNoteStore.getState().startRecording()
      useVoiceNoteStore.getState().stopAndSave('   ')

      expect(useVoiceNoteStore.getState().notes).toHaveLength(0)
    })

    it('should clean filler words', () => {
      useVoiceNoteStore.getState().startRecording()
      useVoiceNoteStore.getState().stopAndSave('음 그 아이디어가 좋은 것 같아요')

      const { notes } = useVoiceNoteStore.getState()
      expect(notes[0].processedText.startsWith('음')).toBe(false)
      expect(notes[0].tags).toContain('idea')
    })
  })

  describe('tag extraction', () => {
    it('should tag todo items', () => {
      useVoiceNoteStore.getState().startRecording()
      useVoiceNoteStore.getState().stopAndSave('내일까지 보고서를 작성해야 합니다')

      expect(useVoiceNoteStore.getState().notes[0].tags).toContain('todo')
    })

    it('should tag meeting notes', () => {
      useVoiceNoteStore.getState().startRecording()
      useVoiceNoteStore.getState().stopAndSave('회의에서 논의된 내용입니다')

      expect(useVoiceNoteStore.getState().notes[0].tags).toContain('meeting')
    })

    it('should tag important items', () => {
      useVoiceNoteStore.getState().startRecording()
      useVoiceNoteStore.getState().stopAndSave('이것은 매우 중요한 결정입니다')

      expect(useVoiceNoteStore.getState().notes[0].tags).toContain('important')
    })

    it('should tag questions', () => {
      useVoiceNoteStore.getState().startRecording()
      useVoiceNoteStore.getState().stopAndSave('이 기능에 대해 질문이 있습니다')

      expect(useVoiceNoteStore.getState().notes[0].tags).toContain('question')
    })
  })

  describe('CRUD', () => {
    it('should delete note', () => {
      useVoiceNoteStore.getState().startRecording()
      useVoiceNoteStore.getState().stopAndSave('테스트 메모')

      const id = useVoiceNoteStore.getState().notes[0].id
      useVoiceNoteStore.getState().deleteNote(id)
      expect(useVoiceNoteStore.getState().notes).toHaveLength(0)
    })

    it('should update note', () => {
      useVoiceNoteStore.getState().startRecording()
      useVoiceNoteStore.getState().stopAndSave('테스트 메모')

      const id = useVoiceNoteStore.getState().notes[0].id
      useVoiceNoteStore.getState().updateNote(id, { processedText: '수정된 메모', tags: ['updated'] })

      const note = useVoiceNoteStore.getState().notes[0]
      expect(note.processedText).toBe('수정된 메모')
      expect(note.tags).toContain('updated')
    })

    it('should order notes newest first', () => {
      useVoiceNoteStore.getState().startRecording()
      useVoiceNoteStore.getState().stopAndSave('첫 번째')
      useVoiceNoteStore.getState().startRecording()
      useVoiceNoteStore.getState().stopAndSave('두 번째')

      const { notes } = useVoiceNoteStore.getState()
      expect(notes[0].processedText).toBe('두 번째')
      expect(notes[1].processedText).toBe('첫 번째')
    })
  })
})
