import { create } from 'zustand'
import type { GroupChatMessage, GroupChatResponse } from '@/shared/types'

interface GroupChatState {
  selectedModels: string[]
  messages: GroupChatMessage[]
  isStreaming: boolean

  toggleModel: (modelId: string) => void
  setSelectedModels: (models: string[]) => void
  addMessage: (message: GroupChatMessage) => void
  updateResponse: (messageId: string, modelId: string, updater: (resp: GroupChatResponse) => GroupChatResponse) => void
  setStreaming: (streaming: boolean) => void
  clearMessages: () => void
}

export const useGroupChatStore = create<GroupChatState>((set) => ({
  selectedModels: [],
  messages: [],
  isStreaming: false,

  toggleModel: (modelId) => {
    set((state) => {
      const exists = state.selectedModels.includes(modelId)
      if (exists) {
        return { selectedModels: state.selectedModels.filter((id) => id !== modelId) }
      }
      if (state.selectedModels.length >= 4) return state
      return { selectedModels: [...state.selectedModels, modelId] }
    })
  },

  setSelectedModels: (models) => set({ selectedModels: models.slice(0, 4) }),

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }))
  },

  updateResponse: (messageId, modelId, updater) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              responses: msg.responses.map((resp) =>
                resp.modelId === modelId ? updater(resp) : resp
              ),
            }
          : msg
      ),
    }))
  },

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  clearMessages: () => set({ messages: [] }),
}))
