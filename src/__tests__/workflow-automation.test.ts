import { describe, it, expect } from 'vitest'
import {
  getNextRunTime,
  evaluateCondition,
  generateWebhookUrl,
  generateWebhookSecret,
  executeLoop,
  exportWorkflow,
  importWorkflow,
} from '@/shared/lib/workflow-automation'

describe('workflow-automation', () => {
  describe('getNextRunTime', () => {
    it('should schedule hourly', () => {
      const from = new Date('2026-03-07T10:30:00')
      const next = getNextRunTime('hourly', from)
      expect(next.getHours()).toBe(11)
      expect(next.getMinutes()).toBe(0)
    })

    it('should schedule daily', () => {
      const from = new Date('2026-03-07T10:30:00')
      const next = getNextRunTime('daily:09:00', from)
      expect(next.getDate()).toBe(8) // next day since 09:00 already passed
      expect(next.getHours()).toBe(9)
    })

    it('should schedule daily before time', () => {
      const from = new Date('2026-03-07T08:00:00')
      const next = getNextRunTime('daily:09:00', from)
      expect(next.getDate()).toBe(7) // same day
      expect(next.getHours()).toBe(9)
    })

    it('should schedule weekly', () => {
      const from = new Date('2026-03-07T10:00:00') // Saturday
      const next = getNextRunTime('weekly:mon:09:00', from)
      expect(next.getDay()).toBe(1) // Monday
    })

    it('should default to next hour for unknown expression', () => {
      const from = new Date('2026-03-07T10:30:00')
      const next = getNextRunTime('unknown', from)
      expect(next > from).toBe(true)
    })
  })

  describe('evaluateCondition', () => {
    it('should evaluate contains', () => {
      expect(evaluateCondition(
        { type: 'contains', field: '', operator: 'contains', value: 'hello' },
        'Hello World',
      )).toBe(true)
    })

    it('should evaluate length greater than', () => {
      expect(evaluateCondition(
        { type: 'length', field: '', operator: '>', value: '5' },
        'Hello World',
      )).toBe(true)
    })

    it('should evaluate length less than', () => {
      expect(evaluateCondition(
        { type: 'length', field: '', operator: '<', value: '5' },
        'Hi',
      )).toBe(true)
    })

    it('should evaluate regex', () => {
      expect(evaluateCondition(
        { type: 'regex', field: '', operator: 'matches', value: '^\\d+$' },
        '12345',
      )).toBe(true)
    })

    it('should handle invalid regex', () => {
      expect(evaluateCondition(
        { type: 'regex', field: '', operator: 'matches', value: '[invalid' },
        'test',
      )).toBe(false)
    })

    it('should evaluate positive sentiment', () => {
      expect(evaluateCondition(
        { type: 'sentiment', field: '', operator: '==', value: 'positive' },
        '정말 좋은 결과입니다',
      )).toBe(true)
    })

    it('should evaluate negative sentiment', () => {
      expect(evaluateCondition(
        { type: 'sentiment', field: '', operator: '==', value: 'negative' },
        '최악의 경험이었습니다',
      )).toBe(true)
    })

    it('should evaluate neutral sentiment', () => {
      expect(evaluateCondition(
        { type: 'sentiment', field: '', operator: '==', value: 'neutral' },
        '오늘 날씨가 흐립니다',
      )).toBe(true)
    })
  })

  describe('webhook', () => {
    it('should generate webhook URL', () => {
      const url = generateWebhookUrl('trigger-123')
      expect(url).toContain('/api/webhooks/trigger-123')
    })

    it('should generate secure secret', () => {
      const secret = generateWebhookSecret()
      expect(secret).toMatch(/^whsec_/)
      expect(secret.length).toBeGreaterThan(30)
    })

    it('should generate unique secrets', () => {
      const s1 = generateWebhookSecret()
      const s2 = generateWebhookSecret()
      expect(s1).not.toBe(s2)
    })
  })

  describe('executeLoop', () => {
    it('should execute forEach loop', () => {
      const items = ['apple', 'banana', 'cherry']
      const results = executeLoop(
        { type: 'forEach', maxIterations: 10 },
        items,
        (item) => item.toUpperCase(),
      )
      expect(results).toEqual(['APPLE', 'BANANA', 'CHERRY'])
    })

    it('should execute count loop', () => {
      const results = executeLoop(
        { type: 'count', maxIterations: 100, count: 3 },
        [],
        (_, i) => `item-${i}`,
      )
      expect(results).toEqual(['item-0', 'item-1', 'item-2'])
    })

    it('should execute while loop with condition', () => {
      let counter = 0
      const results = executeLoop(
        {
          type: 'while',
          maxIterations: 5,
          condition: { type: 'length', field: '', operator: '<', value: '10' },
        },
        ['ab'],
        (input) => {
          counter++
          return input + 'x'
        },
      )
      expect(results.length).toBeGreaterThan(0)
      expect(results.length).toBeLessThanOrEqual(5)
    })

    it('should respect maxIterations safety limit', () => {
      const results = executeLoop(
        { type: 'count', maxIterations: 5, count: 1000 },
        [],
        (_, i) => String(i),
      )
      expect(results.length).toBe(5)
    })
  })

  describe('export/import', () => {
    it('should export workflow as YAML', () => {
      const yaml = exportWorkflow({
        name: 'Daily Digest',
        description: 'Morning news summary',
        trigger: 'daily:09:00',
        blocks: [
          { type: 'prompt', config: { text: 'Summarize today news' } },
          { type: 'output', config: { channel: 'slack' } },
        ],
      })

      expect(yaml).toContain('name: Daily Digest')
      expect(yaml).toContain('trigger: daily:09:00')
      expect(yaml).toContain('type: prompt')
    })

    it('should import workflow from YAML', () => {
      const yaml = `name: Test Workflow\ndescription: A test\ntrigger: hourly`
      const result = importWorkflow(yaml)

      expect(result).not.toBeNull()
      expect(result!.name).toBe('Test Workflow')
      expect(result!.trigger).toBe('hourly')
    })

    it('should return null for invalid YAML', () => {
      expect(importWorkflow('invalid content')).toBeNull()
    })

    it('should roundtrip export/import', () => {
      const original = {
        name: 'Roundtrip',
        description: 'Test roundtrip',
        trigger: 'weekly:mon:09:00',
        blocks: [],
      }
      const yaml = exportWorkflow(original)
      const imported = importWorkflow(yaml)
      expect(imported!.name).toBe(original.name)
      expect(imported!.trigger).toBe(original.trigger)
    })
  })
})
