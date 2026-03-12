import { describe, it, expect } from 'vitest'
import {
  registerTool,
  unregisterTool,
  getRegisteredTools,
  getTool,
  isActionAllowed,
  shouldStop,
  createExecution,
  addStep,
  completeExecution,
  formatToolsForPrompt,
  parseToolCall,
} from '@/shared/lib/agent-v2'

describe('agent-v2', () => {
  describe('tool registry', () => {
    it('should have built-in tools', () => {
      const tools = getRegisteredTools()
      expect(tools.length).toBeGreaterThanOrEqual(3) // search, memory_read, memory_save
    })

    it('should register and retrieve tool', () => {
      registerTool({
        id: 'test-tool',
        name: 'Test',
        description: 'A test tool',
        parameters: [],
        execute: async () => 'result',
        category: 'custom',
      })
      expect(getTool('test-tool')).toBeDefined()
      unregisterTool('test-tool')
    })

    it('should unregister tool', () => {
      registerTool({
        id: 'temp',
        name: 'Temp',
        description: 'Temporary',
        parameters: [],
        execute: async () => '',
        category: 'custom',
      })
      expect(unregisterTool('temp')).toBe(true)
      expect(getTool('temp')).toBeUndefined()
    })

    it('should return undefined for non-existent tool', () => {
      expect(getTool('non-existent')).toBeUndefined()
    })
  })

  describe('safety guards', () => {
    it('should allow normal actions', () => {
      expect(isActionAllowed('search')).toBe(true)
    })

    it('should block dangerous actions', () => {
      expect(isActionAllowed('delete_all')).toBe(false)
      expect(isActionAllowed('send_email')).toBe(false)
    })

    it('should stop on max steps', () => {
      const exec = createExecution('test')
      let current = exec
      for (let i = 0; i < 20; i++) {
        current = addStep(current, { type: 'think', content: `step ${i}` })
      }
      expect(shouldStop(current).stop).toBe(true)
      expect(shouldStop(current).reason).toContain('단계')
    })

    it('should stop on budget limit', () => {
      const exec = { ...createExecution('test'), totalCost: 1.5 }
      expect(shouldStop(exec).stop).toBe(true)
      expect(shouldStop(exec).reason).toContain('비용')
    })

    it('should not stop when within limits', () => {
      const exec = createExecution('test')
      expect(shouldStop(exec).stop).toBe(false)
    })
  })

  describe('execution', () => {
    it('should create execution', () => {
      const exec = createExecution('Find information about AI')
      expect(exec.goal).toBe('Find information about AI')
      expect(exec.status).toBe('running')
      expect(exec.steps).toEqual([])
    })

    it('should add steps immutably', () => {
      const exec = createExecution('test')
      const withStep = addStep(exec, { type: 'think', content: 'Planning...' })
      expect(exec.steps).toHaveLength(0)
      expect(withStep.steps).toHaveLength(1)
      expect(withStep.steps[0].type).toBe('think')
    })

    it('should complete execution', () => {
      const exec = createExecution('test')
      const completed = completeExecution(exec, 'completed')
      expect(completed.status).toBe('completed')
      expect(completed.completedAt).toBeTruthy()
    })
  })

  describe('formatToolsForPrompt', () => {
    it('should format tools as string', () => {
      const prompt = formatToolsForPrompt()
      expect(prompt).toContain('웹 검색')
      expect(prompt).toContain('메모리')
    })
  })

  describe('parseToolCall', () => {
    it('should parse XML tool call', () => {
      const xml = '<tool_use><name>search</name><query>AI news</query></tool_use>'
      const result = parseToolCall(xml)
      expect(result).not.toBeNull()
      expect(result!.toolName).toBe('search')
      expect(result!.params.query).toBe('AI news')
    })

    it('should return null for no tool call', () => {
      expect(parseToolCall('Just regular text')).toBeNull()
    })

    it('should parse multiple parameters', () => {
      const xml = '<tool_use><name>memory_save</name><key>topic</key><value>AI</value></tool_use>'
      const result = parseToolCall(xml)
      expect(result!.params.key).toBe('topic')
      expect(result!.params.value).toBe('AI')
    })
  })
})
