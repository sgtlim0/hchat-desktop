import { describe, it, expect, beforeEach } from 'vitest'
import { useGroupChatStore } from '../group-chat.store'
import type { GroupChatMessage, GroupChatResponse } from '@/shared/types'

describe('useGroupChatStore', () => {
  beforeEach(() => {
    useGroupChatStore.setState({
      selectedModels: [],
      messages: [],
      isStreaming: false,
    })
  })

  describe('initial state', () => {
    it('has empty selectedModels', () => {
      expect(useGroupChatStore.getState().selectedModels).toEqual([])
    })

    it('has empty messages', () => {
      expect(useGroupChatStore.getState().messages).toEqual([])
    })

    it('is not streaming', () => {
      expect(useGroupChatStore.getState().isStreaming).toBe(false)
    })
  })

  describe('toggleModel', () => {
    it('adds a model when not selected', () => {
      useGroupChatStore.getState().toggleModel('claude-sonnet-4.6')
      expect(useGroupChatStore.getState().selectedModels).toEqual(['claude-sonnet-4.6'])
    })

    it('removes a model when already selected', () => {
      useGroupChatStore.getState().toggleModel('claude-sonnet-4.6')
      useGroupChatStore.getState().toggleModel('claude-sonnet-4.6')
      expect(useGroupChatStore.getState().selectedModels).toEqual([])
    })

    it('allows up to 4 models', () => {
      useGroupChatStore.getState().toggleModel('model-1')
      useGroupChatStore.getState().toggleModel('model-2')
      useGroupChatStore.getState().toggleModel('model-3')
      useGroupChatStore.getState().toggleModel('model-4')
      expect(useGroupChatStore.getState().selectedModels).toHaveLength(4)
    })

    it('does not add a 5th model', () => {
      useGroupChatStore.getState().toggleModel('model-1')
      useGroupChatStore.getState().toggleModel('model-2')
      useGroupChatStore.getState().toggleModel('model-3')
      useGroupChatStore.getState().toggleModel('model-4')
      useGroupChatStore.getState().toggleModel('model-5')

      const models = useGroupChatStore.getState().selectedModels
      expect(models).toHaveLength(4)
      expect(models).not.toContain('model-5')
    })

    it('preserves order when adding models', () => {
      useGroupChatStore.getState().toggleModel('model-1')
      useGroupChatStore.getState().toggleModel('model-2')
      useGroupChatStore.getState().toggleModel('model-3')

      expect(useGroupChatStore.getState().selectedModels).toEqual(['model-1', 'model-2', 'model-3'])
    })
  })

  describe('setSelectedModels', () => {
    it('sets models directly', () => {
      useGroupChatStore.getState().setSelectedModels(['model-1', 'model-2'])
      expect(useGroupChatStore.getState().selectedModels).toEqual(['model-1', 'model-2'])
    })

    it('limits to 4 models', () => {
      useGroupChatStore.getState().setSelectedModels(['m1', 'm2', 'm3', 'm4', 'm5', 'm6'])
      expect(useGroupChatStore.getState().selectedModels).toHaveLength(4)
      expect(useGroupChatStore.getState().selectedModels).toEqual(['m1', 'm2', 'm3', 'm4'])
    })

    it('allows empty array', () => {
      useGroupChatStore.getState().setSelectedModels(['model-1'])
      useGroupChatStore.getState().setSelectedModels([])
      expect(useGroupChatStore.getState().selectedModels).toEqual([])
    })
  })

  describe('addMessage', () => {
    it('adds a message to empty list', () => {
      const message: GroupChatMessage = {
        id: 'msg-1',
        prompt: 'Hello',
        responses: [],
        timestamp: new Date().toISOString(),
      }

      useGroupChatStore.getState().addMessage(message)
      expect(useGroupChatStore.getState().messages).toHaveLength(1)
      expect(useGroupChatStore.getState().messages[0].id).toBe('msg-1')
    })

    it('appends message to existing list', () => {
      const msg1: GroupChatMessage = {
        id: 'msg-1',
        prompt: 'First',
        responses: [],
        timestamp: new Date().toISOString(),
      }

      const msg2: GroupChatMessage = {
        id: 'msg-2',
        prompt: 'Second',
        responses: [],
        timestamp: new Date().toISOString(),
      }

      useGroupChatStore.getState().addMessage(msg1)
      useGroupChatStore.getState().addMessage(msg2)

      const messages = useGroupChatStore.getState().messages
      expect(messages).toHaveLength(2)
      expect(messages[0].id).toBe('msg-1')
      expect(messages[1].id).toBe('msg-2')
    })

    it('stores message reference', () => {
      const message: GroupChatMessage = {
        id: 'msg-1',
        prompt: 'Hello',
        responses: [],
        timestamp: new Date().toISOString(),
      }

      useGroupChatStore.getState().addMessage(message)
      const stored = useGroupChatStore.getState().messages[0]

      expect(stored).toEqual(message)
    })
  })

  describe('updateResponse', () => {
    it('updates a specific response in a message', () => {
      const response1: GroupChatResponse = {
        modelId: 'claude-sonnet-4.6',
        provider: 'bedrock',
        content: 'Initial content',
        isStreaming: false,
      }

      const response2: GroupChatResponse = {
        modelId: 'gpt-4',
        provider: 'openai',
        content: 'Other response',
        isStreaming: false,
      }

      const message: GroupChatMessage = {
        id: 'msg-1',
        prompt: 'Hello',
        responses: [response1, response2],
        timestamp: new Date().toISOString(),
      }

      useGroupChatStore.getState().addMessage(message)

      useGroupChatStore.getState().updateResponse('msg-1', 'claude-sonnet-4.6', (resp) => ({
        ...resp,
        content: 'Updated content',
        isStreaming: false,
      }))

      const updated = useGroupChatStore.getState().messages[0].responses[0]
      expect(updated.content).toBe('Updated content')
      expect(updated.isStreaming).toBe(false)

      // Other response should remain unchanged
      const unchanged = useGroupChatStore.getState().messages[0].responses[1]
      expect(unchanged.content).toBe('Other response')
    })

    it('does not update wrong message', () => {
      const response: GroupChatResponse = {
        modelId: 'claude-sonnet-4.6',
        provider: 'bedrock',
        content: 'Content',
        isStreaming: false,
      }

      const message: GroupChatMessage = {
        id: 'msg-1',
        prompt: 'Hello',
        responses: [response],
        timestamp: new Date().toISOString(),
      }

      useGroupChatStore.getState().addMessage(message)

      useGroupChatStore.getState().updateResponse('msg-999', 'claude-sonnet-4.6', (resp) => ({
        ...resp,
        content: 'Should not update',
      }))

      const unchanged = useGroupChatStore.getState().messages[0].responses[0]
      expect(unchanged.content).toBe('Content')
    })

    it('does not update wrong model', () => {
      const response: GroupChatResponse = {
        modelId: 'claude-sonnet-4.6',
        provider: 'bedrock',
        content: 'Content',
        isStreaming: false,
      }

      const message: GroupChatMessage = {
        id: 'msg-1',
        prompt: 'Hello',
        responses: [response],
        timestamp: new Date().toISOString(),
      }

      useGroupChatStore.getState().addMessage(message)

      useGroupChatStore.getState().updateResponse('msg-1', 'gpt-4', (resp) => ({
        ...resp,
        content: 'Should not update',
      }))

      const unchanged = useGroupChatStore.getState().messages[0].responses[0]
      expect(unchanged.content).toBe('Content')
    })
  })

  describe('setStreaming', () => {
    it('sets streaming to true', () => {
      useGroupChatStore.getState().setStreaming(true)
      expect(useGroupChatStore.getState().isStreaming).toBe(true)
    })

    it('sets streaming to false', () => {
      useGroupChatStore.getState().setStreaming(true)
      useGroupChatStore.getState().setStreaming(false)
      expect(useGroupChatStore.getState().isStreaming).toBe(false)
    })
  })

  describe('clearMessages', () => {
    it('clears all messages', () => {
      const msg1: GroupChatMessage = {
        id: 'msg-1',
        prompt: 'First',
        responses: [],
        timestamp: new Date().toISOString(),
      }

      const msg2: GroupChatMessage = {
        id: 'msg-2',
        prompt: 'Second',
        responses: [],
        timestamp: new Date().toISOString(),
      }

      useGroupChatStore.getState().addMessage(msg1)
      useGroupChatStore.getState().addMessage(msg2)

      expect(useGroupChatStore.getState().messages).toHaveLength(2)

      useGroupChatStore.getState().clearMessages()
      expect(useGroupChatStore.getState().messages).toEqual([])
    })

    it('does not affect selectedModels or streaming state', () => {
      useGroupChatStore.getState().setSelectedModels(['model-1', 'model-2'])
      useGroupChatStore.getState().setStreaming(true)

      const msg: GroupChatMessage = {
        id: 'msg-1',
        prompt: 'Hello',
        responses: [],
        timestamp: new Date().toISOString(),
      }
      useGroupChatStore.getState().addMessage(msg)

      useGroupChatStore.getState().clearMessages()

      expect(useGroupChatStore.getState().messages).toEqual([])
      expect(useGroupChatStore.getState().selectedModels).toEqual(['model-1', 'model-2'])
      expect(useGroupChatStore.getState().isStreaming).toBe(true)
    })
  })
})
