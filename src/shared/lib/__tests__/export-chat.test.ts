import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportToMarkdown, exportToHtml, exportToJson, exportToTxt } from '../export-chat'
import type { Session, Message } from '@/shared/types'

vi.mock('@/entities/settings/settings.store', () => ({
  useSettingsStore: {
    getState: vi.fn(() => ({ language: 'ko' }))
  }
}))

vi.mock('@/shared/i18n', () => ({
  getTranslation: vi.fn(() => (key: string) => {
    const translations: Record<string, string> = {
      'export.model': '모델',
      'export.createdAt': '생성일',
      'export.updatedAt': '수정일',
      'export.tags': '태그',
      'export.attachments': '첨부파일'
    }
    return translations[key] || key
  })
}))

describe('export-chat.ts', () => {
  const mockSession: Session = {
    id: 'test-session',
    title: 'Test Chat',
    modelId: 'claude-3-5-sonnet-20241022',
    createdAt: '2026-03-02T10:00:00Z',
    updatedAt: '2026-03-02T12:00:00Z',
    tags: ['test', 'example'],
    isFavorite: false,
    isStreaming: false,
    pinned: false
  }

  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      sessionId: 'test-session',
      role: 'user',
      segments: [{ type: 'text', content: 'Hello, how are you?' }],
      createdAt: '2026-03-02T10:00:00Z'
    },
    {
      id: 'msg-2',
      sessionId: 'test-session',
      role: 'assistant',
      segments: [{ type: 'text', content: 'I am doing well, thank you!' }],
      createdAt: '2026-03-02T10:00:10Z'
    }
  ]

  const mockMessagesWithTools: Message[] = [
    {
      id: 'msg-3',
      sessionId: 'test-session',
      role: 'assistant',
      segments: [
        {
          type: 'tool',
          toolCalls: [
            {
              id: 'tool-1',
              toolName: 'calculator',
              args: { operation: 'add', a: 2, b: 3 },
              result: '5',
              status: 'done'
            }
          ]
        }
      ],
      createdAt: '2026-03-02T10:00:20Z'
    }
  ]

  const mockMessagesWithAttachments: Message[] = [
    {
      id: 'msg-4',
      sessionId: 'test-session',
      role: 'user',
      segments: [{ type: 'text', content: 'Check this image' }],
      attachments: [
        { id: 'img-1', name: 'test.png', url: 'http://example.com/test.png', type: 'image/png' }
      ],
      createdAt: '2026-03-02T10:00:30Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exportToMarkdown', () => {
    it('exports basic session and messages to markdown', () => {
      const result = exportToMarkdown({ session: mockSession, messages: mockMessages })

      expect(result).toContain('# Test Chat')
      expect(result).toContain('**모델:** claude-3-5-sonnet-20241022')
      expect(result).toContain('**태그:** test, example')
      expect(result).toContain('## User')
      expect(result).toContain('Hello, how are you?')
      expect(result).toContain('## Assistant')
      expect(result).toContain('I am doing well, thank you!')
    })

    it('exports session without tags', () => {
      const sessionNoTags = { ...mockSession, tags: [] }
      const result = exportToMarkdown({ session: sessionNoTags, messages: mockMessages })

      expect(result).not.toContain('**태그:**')
      expect(result).toContain('# Test Chat')
    })

    it('exports tool calls in markdown', () => {
      const result = exportToMarkdown({ session: mockSession, messages: mockMessagesWithTools })

      expect(result).toContain('**Tool:** calculator')
      expect(result).toContain('**Args:**')
      expect(result).toContain('"operation": "add"')
      expect(result).toContain('**Result:**')
      expect(result).toContain('5')
    })

    it('exports attachments in markdown', () => {
      const result = exportToMarkdown({ session: mockSession, messages: mockMessagesWithAttachments })

      expect(result).toContain('**첨부파일:**')
      expect(result).toContain('![test.png](http://example.com/test.png)')
    })

    it('handles tool calls without args', () => {
      const messagesNoArgs: Message[] = [
        {
          id: 'msg-5',
          sessionId: 'test-session',
          role: 'assistant',
          segments: [
            {
              type: 'tool',
              toolCalls: [{ id: 'tool-2', toolName: 'ping', result: 'pong', status: 'done' }]
            }
          ],
          createdAt: '2026-03-02T10:00:40Z'
        }
      ]

      const result = exportToMarkdown({ session: mockSession, messages: messagesNoArgs })

      expect(result).toContain('**Tool:** ping')
      expect(result).not.toContain('**Args:**')
      expect(result).toContain('**Result:**')
      expect(result).toContain('pong')
    })

    it('handles tool calls without result', () => {
      const messagesNoResult: Message[] = [
        {
          id: 'msg-6',
          sessionId: 'test-session',
          role: 'assistant',
          segments: [
            {
              type: 'tool',
              toolCalls: [{ id: 'tool-3', toolName: 'notify', args: { message: 'hello' }, status: 'running' }]
            }
          ],
          createdAt: '2026-03-02T10:00:50Z'
        }
      ]

      const result = exportToMarkdown({ session: mockSession, messages: messagesNoResult })

      expect(result).toContain('**Tool:** notify')
      expect(result).toContain('**Args:**')
      expect(result).not.toContain('**Result:**')
    })
  })

  describe('exportToHtml', () => {
    it('exports basic session and messages to HTML', () => {
      const result = exportToHtml({ session: mockSession, messages: mockMessages })

      expect(result).toContain('<!DOCTYPE html>')
      expect(result).toContain('<title>Test Chat</title>')
      expect(result).toContain('<h1>Test Chat</h1>')
      expect(result).toContain('모델:')
      expect(result).toContain('claude-3-5-sonnet-20241022')
      expect(result).toContain('Hello, how are you?')
      expect(result).toContain('I am doing well, thank you!')
    })

    it('exports session with tags in HTML', () => {
      const result = exportToHtml({ session: mockSession, messages: mockMessages })

      expect(result).toContain('태그:')
      expect(result).toContain('test, example')
    })

    it('exports session without tags in HTML', () => {
      const sessionNoTags = { ...mockSession, tags: [] }
      const result = exportToHtml({ session: sessionNoTags, messages: mockMessages })

      expect(result).not.toContain('태그:')
    })

    it('exports tool calls in HTML', () => {
      const result = exportToHtml({ session: mockSession, messages: mockMessagesWithTools })

      expect(result).toContain('Tool:')
      expect(result).toContain('calculator')
      expect(result).toContain('Args:')
      expect(result).toContain('"operation": "add"')
      expect(result).toContain('Result:')
      expect(result).toContain('5')
    })

    it('exports attachments in HTML', () => {
      const result = exportToHtml({ session: mockSession, messages: mockMessagesWithAttachments })

      expect(result).toContain('<img src="http://example.com/test.png"')
      expect(result).toContain('alt="test.png"')
    })

    it('escapes HTML special characters', () => {
      const messagesWithHtml: Message[] = [
        {
          id: 'msg-7',
          sessionId: 'test-session',
          role: 'user',
          segments: [{ type: 'text', content: '<script>alert("xss")</script>' }],
          createdAt: '2026-03-02T10:01:00Z'
        }
      ]

      const result = exportToHtml({ session: mockSession, messages: messagesWithHtml })

      expect(result).not.toContain('<script>')
      expect(result).toContain('&lt;script&gt;')
    })
  })

  describe('exportToJson', () => {
    it('exports session and messages to JSON string', () => {
      const result = exportToJson({ session: mockSession, messages: mockMessages })
      const parsed = JSON.parse(result)

      expect(parsed.session.id).toBe('test-session')
      expect(parsed.session.title).toBe('Test Chat')
      expect(parsed.messages).toHaveLength(2)
      expect(parsed.messages[0].role).toBe('user')
      expect(parsed.messages[1].role).toBe('assistant')
    })

    it('formats JSON with proper indentation', () => {
      const result = exportToJson({ session: mockSession, messages: mockMessages })

      expect(result).toContain('  "session": {')
      expect(result).toContain('  "messages": [')
    })

    it('preserves all data structures', () => {
      const result = exportToJson({ session: mockSession, messages: mockMessagesWithTools })
      const parsed = JSON.parse(result)

      expect(parsed.messages[0].segments[0].type).toBe('tool')
      expect(parsed.messages[0].segments[0].toolCalls[0].toolName).toBe('calculator')
      expect(parsed.messages[0].segments[0].toolCalls[0].args).toEqual({ operation: 'add', a: 2, b: 3 })
    })
  })

  describe('exportToTxt', () => {
    it('exports basic session and messages to plain text', () => {
      const result = exportToTxt({ session: mockSession, messages: mockMessages })

      expect(result).toContain('Test Chat')
      expect(result).toContain('=========')
      expect(result).toContain('모델: claude-3-5-sonnet-20241022')
      expect(result).toContain('태그: test, example')
      expect(result).toContain('User:')
      expect(result).toContain('Hello, how are you?')
      expect(result).toContain('Assistant:')
      expect(result).toContain('I am doing well, thank you!')
    })

    it('exports session without tags', () => {
      const sessionNoTags = { ...mockSession, tags: [] }
      const result = exportToTxt({ session: sessionNoTags, messages: mockMessages })

      expect(result).not.toContain('태그:')
    })

    it('exports tool calls in plain text', () => {
      const result = exportToTxt({ session: mockSession, messages: mockMessagesWithTools })

      expect(result).toContain('[Tool: calculator]')
      expect(result).toContain('Args: {"operation":"add","a":2,"b":3}')
      expect(result).toContain('Result: 5')
    })

    it('exports attachments in plain text', () => {
      const result = exportToTxt({ session: mockSession, messages: mockMessagesWithAttachments })

      expect(result).toContain('첨부파일:')
      expect(result).toContain('- test.png (http://example.com/test.png)')
    })

    it('uses underscores as separators', () => {
      const result = exportToTxt({ session: mockSession, messages: mockMessages })

      expect(result).toMatch(/-{80}/)
    })
  })
})
