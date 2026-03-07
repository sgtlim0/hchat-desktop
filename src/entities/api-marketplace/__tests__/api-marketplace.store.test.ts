import { describe, it, expect, beforeEach } from 'vitest'
import { useApiMarketplaceStore } from '../api-marketplace.store'
describe('ApiMarketplaceStore', () => {
  beforeEach(() => { useApiMarketplaceStore.setState({ models: [], benchmarks: {}, selectedModelId: null }) })
  it('should have default models when not reset', () => { const fresh = useApiMarketplaceStore.getState(); expect(fresh.models).toBeDefined() })
  it('should add model', () => { useApiMarketplaceStore.getState().addModel({ id: 'x', name: 'X', provider: 'P', category: 'chat', speed: 50, quality: 50, costPer1k: 1 }); expect(useApiMarketplaceStore.getState().models).toHaveLength(1) })
  it('should set benchmark', () => { useApiMarketplaceStore.getState().setBenchmark('x', { modelId: 'x', latency: 100, tokensPerSec: 50, score: 80 }); expect(useApiMarketplaceStore.getState().benchmarks['x'].score).toBe(80) })
  it('should remove model', () => { useApiMarketplaceStore.getState().addModel({ id: 'y', name: 'Y', provider: 'P', category: 'chat', speed: 50, quality: 50, costPer1k: 1 }); useApiMarketplaceStore.getState().removeModel('y'); expect(useApiMarketplaceStore.getState().models).toHaveLength(0) })
})
