import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AGENT_TOOLS, getToolDescriptions, getAgentSystemPrompt } from '../tools'

vi.mock('../../web-search', () => ({
  webSearch: vi.fn(),
  formatSearchResults: vi.fn((results: unknown[]) =>
    results.length === 0 ? 'No results' : 'Formatted results',
  ),
}))

describe('AGENT_TOOLS', () => {
  it('should have calculate, get_datetime, web_search, and fetch_url tools', () => {
    const names = AGENT_TOOLS.map((t) => t.name)
    expect(names).toContain('calculate')
    expect(names).toContain('get_datetime')
    expect(names).toContain('web_search')
    expect(names).toContain('fetch_url')
  })

  describe('calculate tool', () => {
    const calcTool = AGENT_TOOLS.find((t) => t.name === 'calculate')!

    it('should calculate basic arithmetic', async () => {
      const result = await calcTool.execute({ expression: '2 + 3' })
      expect(result).toBe('Result: 5')
    })

    it('should handle multiplication and division', async () => {
      const result = await calcTool.execute({ expression: '10 * 5 / 2' })
      expect(result).toBe('Result: 25')
    })

    it('should handle parentheses', async () => {
      const result = await calcTool.execute({ expression: '(2 + 3) * 4' })
      expect(result).toBe('Result: 20')
    })

    it('should sanitize dangerous characters', async () => {
      const result = await calcTool.execute({ expression: 'alert("xss")' })
      expect(result).toContain('Result:')
      // Should not execute arbitrary code
    })

    it('should handle empty expression', async () => {
      const result = await calcTool.execute({ expression: '' })
      expect(result).toBe('Result: Invalid expression')
    })

    it('should handle missing expression arg', async () => {
      const result = await calcTool.execute({})
      expect(result).toBe('Result: Invalid expression')
    })
  })

  describe('get_datetime tool', () => {
    it('should return current date/time', async () => {
      const tool = AGENT_TOOLS.find((t) => t.name === 'get_datetime')!
      const result = await tool.execute({})
      expect(result).toContain('Current date/time:')
    })
  })

  describe('web_search tool', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should handle search errors gracefully', async () => {
      const { webSearch } = await import('../../web-search')
      vi.mocked(webSearch).mockRejectedValue(new Error('Network error'))

      const tool = AGENT_TOOLS.find((t) => t.name === 'web_search')!
      const result = await tool.execute({ query: 'test' })
      expect(result).toContain('Web search error: Network error')
    })
  })

  describe('fetch_url tool', () => {
    it('should indicate feature is not connected', async () => {
      const tool = AGENT_TOOLS.find((t) => t.name === 'fetch_url')!
      expect(tool.available).toBe(false)
      const result = await tool.execute({ url: 'https://example.com' })
      expect(result).toContain('not yet connected')
    })
  })
})

describe('getToolDescriptions', () => {
  it('should return XML descriptions for available tools only', () => {
    const descriptions = getToolDescriptions()
    expect(descriptions).toContain('calculate')
    expect(descriptions).toContain('get_datetime')
    expect(descriptions).toContain('web_search')
    expect(descriptions).not.toContain('fetch_url')
  })

  it('should include tool names in XML format', () => {
    const descriptions = getToolDescriptions()
    expect(descriptions).toContain('<tool name="calculate">')
    expect(descriptions).toContain('<description>')
  })
})

describe('getAgentSystemPrompt', () => {
  it('should return system prompt with tool descriptions', () => {
    const prompt = getAgentSystemPrompt()
    expect(prompt).toContain('Available tools:')
    expect(prompt).toContain('tool_call')
    expect(prompt).toContain('<name>tool_name</name>')
  })
})
