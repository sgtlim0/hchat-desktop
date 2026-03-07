import { create } from 'zustand'

export interface VoiceNote {
  id: string
  rawText: string
  processedText: string
  tags: string[]
  duration: number
  createdAt: string
}

interface VoiceNoteState {
  notes: VoiceNote[]
  isRecording: boolean
  currentText: string
  recordingStartTime: number | null

  startRecording: () => void
  stopAndSave: (rawText: string) => void
  deleteNote: (id: string) => void
  updateNote: (id: string, updates: Partial<Pick<VoiceNote, 'processedText' | 'tags'>>) => void
  clearAll: () => void
}

/** Extract tags from text using keyword patterns */
function extractTags(text: string): string[] {
  const tagPatterns: Record<string, RegExp> = {
    'todo': /해야|할\s*일|to\s*do/i,
    'idea': /아이디어|idea|생각|제안/i,
    'meeting': /회의|미팅|meeting/i,
    'important': /중요|urgent|긴급/i,
    'question': /질문|\?|물어볼/,
    'reminder': /리마인더|reminder|잊지|기억/i,
  }

  const tags: string[] = []
  for (const [tag, pattern] of Object.entries(tagPatterns)) {
    if (pattern.test(text)) {
      tags.push(tag)
    }
  }
  return tags
}

/** Clean up raw speech text */
function processText(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/^(음|어|그|아)\s+/g, '')
    .replace(/\s+(음|어|그)\s+/g, ' ')
    .trim()
}

export const useVoiceNoteStore = create<VoiceNoteState>()((set, get) => ({
  notes: [],
  isRecording: false,
  currentText: '',
  recordingStartTime: null,

  startRecording: () => {
    set({ isRecording: true, currentText: '', recordingStartTime: Date.now() })
  },

  stopAndSave: (rawText) => {
    const { recordingStartTime } = get()
    const duration = recordingStartTime ? Math.round((Date.now() - recordingStartTime) / 1000) : 0
    const processedText = processText(rawText)
    const tags = extractTags(processedText)

    if (!processedText) {
      set({ isRecording: false, currentText: '', recordingStartTime: null })
      return
    }

    const note: VoiceNote = {
      id: `vn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      rawText,
      processedText,
      tags,
      duration,
      createdAt: new Date().toISOString(),
    }

    set((s) => ({
      notes: [note, ...s.notes],
      isRecording: false,
      currentText: '',
      recordingStartTime: null,
    }))
  },

  deleteNote: (id) => {
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }))
  },

  updateNote: (id, updates) => {
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    }))
  },

  clearAll: () => {
    set({ notes: [], isRecording: false, currentText: '', recordingStartTime: null })
  },
}))
