import { describe, it, expect } from 'vitest'
import { routeModel } from '../router'
import type { ProviderModelDef } from '@/shared/types'

describe('router.ts', () => {
  const mockModels: ProviderModelDef[] = [
    {
      id: 'default-model',
      label: 'Default Model',
      shortLabel: 'Default',
      provider: 'bedrock' as const,
      capabilities: [],
      cost: { input: 3, output: 15 }
    },
    {
      id: 'code-model',
      label: 'Code Model',
      shortLabel: 'Code',
      provider: 'bedrock' as const,
      capabilities: ['code'],
      cost: { input: 3, output: 15 }
    },
    {
      id: 'reasoning-model',
      label: 'Reasoning Model',
      shortLabel: 'Reasoning',
      provider: 'bedrock' as const,
      capabilities: ['reasoning'],
      cost: { input: 3, output: 15 }
    },
    {
      id: 'fast-model',
      label: 'Fast Model',
      shortLabel: 'Fast',
      provider: 'bedrock' as const,
      capabilities: ['fast'],
      cost: { input: 0.25, output: 1.25 }
    }
  ]

  describe('routeModel', () => {
    it('throws error when no models are available', () => {
      expect(() => routeModel('test prompt', [])).toThrow('No available models')
    })

    it('returns code model for code-related prompts (English)', () => {
      expect(routeModel('write code for authentication', mockModels)).toBe('code-model')
      expect(routeModel('create a function to process data', mockModels)).toBe('code-model')
      expect(routeModel('class implementation needed', mockModels)).toBe('code-model')
      expect(routeModel('debug this error', mockModels)).toBe('code-model')
    })

    it('returns code model for code-related prompts (Korean)', () => {
      expect(routeModel('코드를 작성해줘', mockModels)).toBe('code-model')
      expect(routeModel('버그를 찾아줘', mockModels)).toBe('code-model')
    })

    it('returns reasoning model for analysis prompts (English)', () => {
      expect(routeModel('analyze this data', mockModels)).toBe('reasoning-model')
      expect(routeModel('why does this happen?', mockModels)).toBe('reasoning-model')
      expect(routeModel('explain the concept', mockModels)).toBe('reasoning-model')
    })

    it('returns reasoning model for analysis prompts (Korean)', () => {
      expect(routeModel('이것을 분석해줘', mockModels)).toBe('reasoning-model')
      expect(routeModel('왜 그런지 설명해줘', mockModels)).toBe('reasoning-model')
    })

    it('returns fast model for brief prompts (English)', () => {
      expect(routeModel('briefly summarize this', mockModels)).toBe('fast-model')
      expect(routeModel('tl;dr please', mockModels)).toBe('fast-model')
    })

    it('returns fast model for brief prompts (Korean)', () => {
      expect(routeModel('간단히 요약해줘', mockModels)).toBe('fast-model')
      expect(routeModel('짧게 설명해줘', mockModels)).toBe('fast-model')
    })

    it('returns default model when no pattern matches', () => {
      expect(routeModel('hello world', mockModels)).toBe('default-model')
      expect(routeModel('random question', mockModels)).toBe('default-model')
    })

    it('prioritizes code over reasoning when both patterns exist', () => {
      expect(routeModel('analyze this code and explain', mockModels)).toBe('code-model')
    })

    it('prioritizes code over fast when both patterns exist', () => {
      expect(routeModel('briefly write code', mockModels)).toBe('code-model')
    })

    it('prioritizes reasoning over fast when both patterns exist', () => {
      expect(routeModel('briefly analyze this', mockModels)).toBe('reasoning-model')
    })

    it('returns default model when matching capability is not available', () => {
      const limitedModels: ProviderModelDef[] = [
        {
          id: 'only-model',
          label: 'Only Model',
          shortLabel: 'Only',
          provider: 'bedrock' as const,
          capabilities: [],
          cost: { input: 3, output: 15 }
        }
      ]

      expect(routeModel('write code', limitedModels)).toBe('only-model')
      expect(routeModel('analyze this', limitedModels)).toBe('only-model')
      expect(routeModel('briefly explain', limitedModels)).toBe('only-model')
    })

    it('is case insensitive', () => {
      expect(routeModel('WRITE CODE', mockModels)).toBe('code-model')
      expect(routeModel('ANALYZE THIS', mockModels)).toBe('reasoning-model')
      expect(routeModel('BRIEFLY SUMMARIZE', mockModels)).toBe('fast-model')
    })

    it('handles models without capabilities array', () => {
      const modelsNoCaps: ProviderModelDef[] = [
        {
          id: 'model-1',
          label: 'Model 1',
          shortLabel: 'M1',
          provider: 'bedrock' as const,
          capabilities: [],
          cost: { input: 3, output: 15 }
        },
        {
          id: 'model-2',
          label: 'Model 2',
          shortLabel: 'M2',
          provider: 'bedrock' as const,
          capabilities: [],
          cost: { input: 3, output: 15 }
        }
      ]

      expect(routeModel('write code', modelsNoCaps)).toBe('model-1')
      expect(routeModel('analyze this', modelsNoCaps)).toBe('model-1')
    })

    it('finds models with partial capability matches', () => {
      const modelsPartial: ProviderModelDef[] = [
        {
          id: 'multi-capability',
          label: 'Multi',
          shortLabel: 'Multi',
          provider: 'bedrock' as const,
          capabilities: ['code', 'reasoning', 'fast'],
          cost: { input: 3, output: 15 }
        }
      ]

      expect(routeModel('write code', modelsPartial)).toBe('multi-capability')
      expect(routeModel('analyze this', modelsPartial)).toBe('multi-capability')
      expect(routeModel('briefly', modelsPartial)).toBe('multi-capability')
    })

    it('handles empty prompt', () => {
      expect(routeModel('', mockModels)).toBe('default-model')
    })

    it('handles whitespace-only prompt', () => {
      expect(routeModel('   ', mockModels)).toBe('default-model')
    })
  })
})
