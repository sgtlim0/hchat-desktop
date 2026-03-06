import { create } from 'zustand'
import type { VoiceState, VoiceTranscript } from '@/shared/types'

interface VoiceChatState {
  voiceState: VoiceState
  transcripts: VoiceTranscript[]
  currentInterim: string
  isMinimized: boolean
  language: string
  autoListen: boolean

  setVoiceState: (state: VoiceState) => void
  addTranscript: (transcript: VoiceTranscript) => void
  setCurrentInterim: (text: string) => void
  clearTranscripts: () => void
  toggleMinimized: () => void
  setLanguage: (lang: string) => void
  toggleAutoListen: () => void
  reset: () => void
}

const initialState = {
  voiceState: 'idle' as VoiceState,
  transcripts: [] as VoiceTranscript[],
  currentInterim: '',
  isMinimized: false,
  language: 'ko-KR',
  autoListen: true,
}

export const useVoiceChatStore = create<VoiceChatState>()((set) => ({
  ...initialState,

  setVoiceState: (voiceState) => set({ voiceState }),

  addTranscript: (transcript) =>
    set((s) => ({ transcripts: [...s.transcripts, transcript] })),

  setCurrentInterim: (currentInterim) => set({ currentInterim }),

  clearTranscripts: () => set({ transcripts: [], currentInterim: '' }),

  toggleMinimized: () => set((s) => ({ isMinimized: !s.isMinimized })),

  setLanguage: (language) => set({ language }),

  toggleAutoListen: () => set((s) => ({ autoListen: !s.autoListen })),

  reset: () => set(initialState),
}))
