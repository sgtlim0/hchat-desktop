import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useVoiceNoteStore } from '../voice-note.store'
import type { VoiceNote } from '../voice-note.store'

describe('VoiceNoteStore', () => {
  beforeEach(() => {
    useVoiceNoteStore.setState({
      notes: [],
      isRecording: false,
      currentText: '',
      recordingStartTime: null,
    })
    vi.clearAllMocks()
  })

  it('should have correct initial state', () => {
    const state = useVoiceNoteStore.getState()
    expect(state.notes).toEqual([])
    expect(state.isRecording).toBe(false)
    expect(state.currentText).toBe('')
    expect(state.recordingStartTime).toBeNull()
  })

  it('should start recording', () => {
    const { startRecording } = useVoiceNoteStore.getState()
    const now = Date.now()

    startRecording()

    const state = useVoiceNoteStore.getState()
    expect(state.isRecording).toBe(true)
    expect(state.currentText).toBe('')
    expect(state.recordingStartTime).toBeGreaterThanOrEqual(now)
  })

  it('should stop and save voice note', () => {
    const { startRecording, stopAndSave } = useVoiceNoteStore.getState()

    startRecording()
    const startTime = useVoiceNoteStore.getState().recordingStartTime

    const rawText = '음 안녕하세요 어 오늘 회의 내용 정리해야 합니다'
    stopAndSave(rawText)

    const state = useVoiceNoteStore.getState()
    expect(state.notes).toHaveLength(1)
    expect(state.notes[0].rawText).toBe(rawText)
    expect(state.notes[0].processedText).toBe('안녕하세요 오늘 회의 내용 정리해야 합니다')
    expect(state.notes[0].tags).toContain('meeting')
    expect(state.notes[0].tags).toContain('todo')
    expect(state.notes[0].duration).toBeGreaterThanOrEqual(0)
    expect(state.isRecording).toBe(false)
    expect(state.recordingStartTime).toBeNull()
  })

  it('should extract correct tags from text', () => {
    const { startRecording, stopAndSave } = useVoiceNoteStore.getState()

    const testCases = [
      { text: '오늘 할 일 목록', expectedTags: ['todo'] },
      { text: 'Great idea for the project', expectedTags: ['idea'] },
      { text: '내일 회의 준비해야 함', expectedTags: ['todo', 'meeting'] },
      { text: '중요한 질문이 있습니다', expectedTags: ['important', 'question'] },
      { text: '잊지 말고 리마인더 설정', expectedTags: ['reminder'] },
    ]

    testCases.forEach(({ text, expectedTags }) => {
      useVoiceNoteStore.setState({ notes: [] }) // Clear notes
      startRecording()
      stopAndSave(text)

      const state = useVoiceNoteStore.getState()
      expectedTags.forEach((tag) => {
        expect(state.notes[0].tags).toContain(tag)
      })
    })
  })

  it('should not save empty processed text', () => {
    const { startRecording, stopAndSave } = useVoiceNoteStore.getState()

    startRecording()
    stopAndSave('   ') // Just whitespace

    const state = useVoiceNoteStore.getState()
    expect(state.notes).toHaveLength(0)
    expect(state.isRecording).toBe(false)
  })

  it('should delete a note', () => {
    const notes: VoiceNote[] = [
      {
        id: 'vn-1',
        rawText: 'raw 1',
        processedText: 'processed 1',
        tags: [],
        duration: 10,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'vn-2',
        rawText: 'raw 2',
        processedText: 'processed 2',
        tags: [],
        duration: 20,
        createdAt: new Date().toISOString(),
      },
    ]

    useVoiceNoteStore.setState({ notes })

    const { deleteNote } = useVoiceNoteStore.getState()
    deleteNote('vn-1')

    const state = useVoiceNoteStore.getState()
    expect(state.notes).toHaveLength(1)
    expect(state.notes[0].id).toBe('vn-2')
  })

  it('should update a note', () => {
    const note: VoiceNote = {
      id: 'vn-1',
      rawText: 'raw text',
      processedText: 'original processed',
      tags: ['todo'],
      duration: 10,
      createdAt: new Date().toISOString(),
    }

    useVoiceNoteStore.setState({ notes: [note] })

    const { updateNote } = useVoiceNoteStore.getState()
    updateNote('vn-1', {
      processedText: 'updated processed text',
      tags: ['idea', 'important'],
    })

    const state = useVoiceNoteStore.getState()
    expect(state.notes[0].processedText).toBe('updated processed text')
    expect(state.notes[0].tags).toEqual(['idea', 'important'])
    expect(state.notes[0].rawText).toBe('raw text') // Unchanged
  })

  it('should clear all notes', () => {
    const notes: VoiceNote[] = [
      {
        id: 'vn-1',
        rawText: 'raw 1',
        processedText: 'processed 1',
        tags: [],
        duration: 10,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'vn-2',
        rawText: 'raw 2',
        processedText: 'processed 2',
        tags: [],
        duration: 20,
        createdAt: new Date().toISOString(),
      },
    ]

    useVoiceNoteStore.setState({
      notes,
      isRecording: true,
      currentText: 'some text',
      recordingStartTime: Date.now(),
    })

    const { clearAll } = useVoiceNoteStore.getState()
    clearAll()

    const state = useVoiceNoteStore.getState()
    expect(state.notes).toEqual([])
    expect(state.isRecording).toBe(false)
    expect(state.currentText).toBe('')
    expect(state.recordingStartTime).toBeNull()
  })

  it('should maintain note order with newest first', () => {
    const { startRecording, stopAndSave } = useVoiceNoteStore.getState()

    startRecording()
    stopAndSave('First note')

    startRecording()
    stopAndSave('Second note')

    startRecording()
    stopAndSave('Third note')

    const state = useVoiceNoteStore.getState()
    expect(state.notes).toHaveLength(3)
    expect(state.notes[0].processedText).toBe('Third note')
    expect(state.notes[1].processedText).toBe('Second note')
    expect(state.notes[2].processedText).toBe('First note')
  })
})