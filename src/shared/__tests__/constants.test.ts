import { describe, it, expect } from 'vitest'
import {
  MODELS,
  DEFAULT_MODEL_ID,
  BEDROCK_MODEL_MAP,
  PROVIDER_COLORS,
  PROVIDER_LABELS,
} from '../constants'

describe('MODELS', () => {
  it('has at least 3 providers', () => {
    const providers = new Set(MODELS.map((m) => m.provider))
    expect(providers.size).toBeGreaterThanOrEqual(3)
  })

  it('every model has required fields', () => {
    MODELS.forEach((model) => {
      expect(model.id).toBeTruthy()
      expect(model.provider).toBeTruthy()
      expect(model.label).toBeTruthy()
      expect(model.shortLabel).toBeTruthy()
      expect(model.capabilities.length).toBeGreaterThan(0)
      expect(model.cost.input).toBeGreaterThanOrEqual(0)
      expect(model.cost.output).toBeGreaterThanOrEqual(0)
    })
  })

  it('has no duplicate model IDs', () => {
    const ids = MODELS.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('DEFAULT_MODEL_ID', () => {
  it('references an existing model', () => {
    const model = MODELS.find((m) => m.id === DEFAULT_MODEL_ID)
    expect(model).toBeDefined()
  })
})

describe('BEDROCK_MODEL_MAP', () => {
  it('maps all bedrock models', () => {
    const bedrockModels = MODELS.filter((m) => m.provider === 'bedrock')
    bedrockModels.forEach((model) => {
      expect(BEDROCK_MODEL_MAP[model.id]).toBeDefined()
    })
  })

  it('all mapped IDs start with us.anthropic', () => {
    Object.values(BEDROCK_MODEL_MAP).forEach((bedrockId) => {
      expect(bedrockId).toMatch(/^us\.anthropic\./)
    })
  })
})

describe('PROVIDER_COLORS / PROVIDER_LABELS', () => {
  it('covers all providers in MODELS', () => {
    const providers = new Set(MODELS.map((m) => m.provider))
    providers.forEach((provider) => {
      expect(PROVIDER_COLORS[provider]).toBeTruthy()
      expect(PROVIDER_LABELS[provider]).toBeTruthy()
    })
  })
})
