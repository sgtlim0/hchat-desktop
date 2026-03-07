import { create } from 'zustand'

export interface MeetingTranscriptEntry {
  id: string
  speaker: string
  text: string
  timestamp: number
  isFinal: boolean
}

export interface MeetingActionItem {
  id: string
  text: string
  assignee?: string
  dueDate?: string
  completed: boolean
}

export interface MeetingSummary {
  title: string
  duration: number
  participants: string[]
  keyPoints: string[]
  actionItems: MeetingActionItem[]
  decisions: string[]
  generatedAt: string
}

interface MeetingState {
  isRecording: boolean
  startTime: number | null
  transcripts: MeetingTranscriptEntry[]
  currentInterim: string
  summary: MeetingSummary | null
  isGeneratingSummary: boolean

  startRecording: () => void
  stopRecording: () => void
  addTranscript: (entry: Omit<MeetingTranscriptEntry, 'id'>) => void
  setCurrentInterim: (text: string) => void
  generateSummary: () => void
  toggleActionItem: (id: string) => void
  clearMeeting: () => void
}

export const useMeetingStore = create<MeetingState>()((set, get) => ({
  isRecording: false,
  startTime: null,
  transcripts: [],
  currentInterim: '',
  summary: null,
  isGeneratingSummary: false,

  startRecording: () => {
    set({
      isRecording: true,
      startTime: Date.now(),
      transcripts: [],
      currentInterim: '',
      summary: null,
    })
  },

  stopRecording: () => {
    set({ isRecording: false })
  },

  addTranscript: (entry) => {
    const id = `mt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    set((s) => ({
      transcripts: [...s.transcripts, { ...entry, id }],
      currentInterim: '',
    }))
  },

  setCurrentInterim: (text) => set({ currentInterim: text }),

  generateSummary: () => {
    const { transcripts, startTime } = get()
    if (transcripts.length === 0) return

    set({ isGeneratingSummary: true })

    const fullText = transcripts.filter((t) => t.isFinal).map((t) => t.text).join(' ')
    const duration = startTime ? Math.round((Date.now() - startTime) / 1000) : 0
    const speakers = [...new Set(transcripts.map((t) => t.speaker))]

    // Extract key points (sentences with important keywords)
    const sentences = fullText.split(/[.!?。！？]\s+/).filter((s) => s.length > 10)
    const importantWords = ['결정', '합의', '다음', '해야', '필요', '중요', '완료', '진행', 'decide', 'agree', 'action', 'need', 'important', 'deadline']
    const keyPoints = sentences
      .filter((s) => importantWords.some((w) => s.toLowerCase().includes(w)))
      .slice(0, 5)

    // Extract action items (sentences with action verbs)
    const actionPatterns = [/(.+)해야\s*(합니다|해요|함)/, /(.+)\s*까지\s*완료/, /(.+)\s*담당/, /action:\s*(.+)/i]
    const actionItems: MeetingActionItem[] = sentences
      .map((s) => {
        for (const p of actionPatterns) {
          const match = s.match(p)
          if (match) {
            return {
              id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              text: s.trim(),
              completed: false,
            }
          }
        }
        return null
      })
      .filter((a): a is MeetingActionItem => a !== null)
      .slice(0, 10)

    // Extract decisions
    const decisionPatterns = [/결정[:\s](.+)/, /합의[:\s](.+)/, /decided[:\s](.+)/i]
    const decisions = sentences
      .map((s) => {
        for (const p of decisionPatterns) {
          const match = s.match(p)
          if (match) return match[1].trim()
        }
        return null
      })
      .filter((d): d is string => d !== null)

    const summary: MeetingSummary = {
      title: `회의 (${new Date().toLocaleDateString('ko-KR')})`,
      duration,
      participants: speakers,
      keyPoints: keyPoints.length > 0 ? keyPoints : ['회의 내용을 분석 중입니다...'],
      actionItems,
      decisions,
      generatedAt: new Date().toISOString(),
    }

    set({ summary, isGeneratingSummary: false })
  },

  toggleActionItem: (id) => {
    set((s) => {
      if (!s.summary) return s
      return {
        summary: {
          ...s.summary,
          actionItems: s.summary.actionItems.map((ai) =>
            ai.id === id ? { ...ai, completed: !ai.completed } : ai,
          ),
        },
      }
    })
  },

  clearMeeting: () => {
    set({
      isRecording: false,
      startTime: null,
      transcripts: [],
      currentInterim: '',
      summary: null,
      isGeneratingSummary: false,
    })
  },
}))
