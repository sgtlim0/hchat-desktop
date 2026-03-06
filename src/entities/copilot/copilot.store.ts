import { create } from 'zustand'

interface CopilotMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

type CopilotSize = 'mini' | 'full'

interface CopilotState {
  isOpen: boolean
  size: CopilotSize
  messages: CopilotMessage[]
  input: string
  isStreaming: boolean
  contextHint: string

  toggle: () => void
  open: () => void
  close: () => void
  setSize: (size: CopilotSize) => void
  setInput: (input: string) => void
  addMessage: (message: CopilotMessage) => void
  updateLastAssistant: (content: string) => void
  setStreaming: (isStreaming: boolean) => void
  setContextHint: (hint: string) => void
  clearMessages: () => void
  reset: () => void
}

const initialState = {
  isOpen: false,
  size: 'mini' as CopilotSize,
  messages: [] as CopilotMessage[],
  input: '',
  isStreaming: false,
  contextHint: '',
}

export const useCopilotStore = create<CopilotState>()((set) => ({
  ...initialState,

  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setSize: (size) => set({ size }),
  setInput: (input) => set({ input }),

  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),

  updateLastAssistant: (content) =>
    set((s) => {
      const msgs = [...s.messages]
      const lastIdx = msgs.length - 1
      if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
        msgs[lastIdx] = { ...msgs[lastIdx], content }
      }
      return { messages: msgs }
    }),

  setStreaming: (isStreaming) => set({ isStreaming }),
  setContextHint: (contextHint) => set({ contextHint }),
  clearMessages: () => set({ messages: [], input: '' }),
  reset: () => set(initialState),
}))
