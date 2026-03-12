import { useState, useCallback, useEffect, useRef } from 'react'
import { DEFAULT_MODEL_ID } from '@hchat/shared'
import { useStreamingChat } from '../hooks/useStreamingChat'
import { ChatHeader } from '../components/ChatHeader'
import { MessageList } from '../components/MessageList'
import { PromptInput } from '../components/PromptInput'
import { ModelSelector } from '../components/ModelSelector'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  segments: Array<{ type: string; content?: string }>
  createdAt: string
}

interface ChatViewProps {
  initialAction?: { action: string; text: string } | null
}

export function ChatView({ initialAction }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [modelId, setModelId] = useState(() =>
    localStorage.getItem('hchat-model') || DEFAULT_MODEL_ID,
  )
  const [sessionTitle, setSessionTitle] = useState('New Chat')
  const { isStreaming, streamingText, sendMessage, stopStreaming } = useStreamingChat()

  const credentialsRef = useRef<{ accessKeyId: string; secretAccessKey: string }>({
    accessKeyId: '',
    secretAccessKey: '',
  })

  useEffect(() => {
    chrome.storage.sync.get(['accessKeyId', 'secretAccessKey'], (result) => {
      credentialsRef.current = {
        accessKeyId: result.accessKeyId || '',
        secretAccessKey: result.secretAccessKey || '',
      }
    })
  }, [])

  function handleModelChange(id: string) {
    setModelId(id)
    localStorage.setItem('hchat-model', id)
  }

  const handleSend = useCallback(
    (text: string) => {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        segments: [{ type: 'text', content: text }],
        createdAt: new Date().toISOString(),
      }

      setMessages(prev => [...prev, userMsg])

      if (messages.length === 0) {
        setSessionTitle(text.slice(0, 50))
      }

      const history = [...messages, userMsg].map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.segments[0]?.content || '',
      }))

      sendMessage({
        modelId,
        messages: history,
        accessKeyId: credentialsRef.current.accessKeyId,
        secretAccessKey: credentialsRef.current.secretAccessKey,
      })
    },
    [messages, modelId, sendMessage],
  )

  // Collect streaming text into a message when streaming ends
  useEffect(() => {
    if (!isStreaming && streamingText) {
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        segments: [{ type: 'text', content: streamingText }],
        createdAt: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMsg])
    }
  }, [isStreaming, streamingText])

  // Handle initial quick action
  useEffect(() => {
    if (initialAction?.text) {
      handleSend(initialAction.text)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleNewChat() {
    setMessages([])
    setSessionTitle('New Chat')
  }

  return (
    <div className="flex h-full flex-col">
      <ChatHeader
        title={sessionTitle}
        modelId={modelId}
        onNewChat={handleNewChat}
      />
      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-1.5 dark:border-slate-800">
        <ModelSelector value={modelId} onChange={handleModelChange} />
      </div>
      <MessageList
        messages={messages}
        streamingText={isStreaming ? streamingText : ''}
      />
      <PromptInput
        onSend={handleSend}
        isStreaming={isStreaming}
        onStop={stopStreaming}
      />
    </div>
  )
}
