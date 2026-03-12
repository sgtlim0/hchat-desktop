import type { ProviderModelDef } from '../../types'
import { analyzeIntent, routeByIntent, type RoutingDecision } from './router-rules'

/**
 * Basic pattern-matching router (legacy, kept for backward compatibility)
 */
export function routeModel(
  prompt: string,
  availableModels: ProviderModelDef[]
): string {
  if (availableModels.length === 0) {
    throw new Error('No available models')
  }

  const decision = routeModelAdvanced(prompt, availableModels)
  return decision.modelId
}

/**
 * Advanced intent-based router with cost/speed optimization
 */
export function routeModelAdvanced(
  prompt: string,
  availableModels: ProviderModelDef[],
  options?: { preferCost?: boolean; preferSpeed?: boolean }
): RoutingDecision {
  if (availableModels.length === 0) {
    throw new Error('No available models')
  }

  return routeByIntent(prompt, availableModels, options)
}

export { analyzeIntent, type RoutingDecision }
