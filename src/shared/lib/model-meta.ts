import { MODELS } from '../constants'

export function getModelName(modelId: string): string {
  return MODELS.find(m => m.id === modelId)?.name ?? modelId
}

export function getModelDescription(modelId: string): string {
  return MODELS.find(m => m.id === modelId)?.description ?? ''
}

export function getModelProvider(modelId: string): string {
  return MODELS.find(m => m.id === modelId)?.provider ?? 'unknown'
}
