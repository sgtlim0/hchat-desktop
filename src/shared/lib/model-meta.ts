import { MODELS } from '../constants'
import type { ProviderType } from '../types'

export function getModelName(modelId: string): string {
  return MODELS.find(m => m.id === modelId)?.label ?? modelId
}

export function getModelShortName(modelId: string): string {
  return MODELS.find(m => m.id === modelId)?.shortLabel ?? modelId
}

export function getModelProvider(modelId: string): ProviderType | 'unknown' {
  return MODELS.find(m => m.id === modelId)?.provider ?? 'unknown'
}

export function getModelDescription(modelId: string): string {
  const model = MODELS.find(m => m.id === modelId)
  if (!model) return ''
  return model.capabilities.join(', ')
}
