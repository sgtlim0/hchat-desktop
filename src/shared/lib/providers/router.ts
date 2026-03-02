import type { ProviderModelDef } from '../../types'

export function routeModel(
  prompt: string,
  availableModels: ProviderModelDef[]
): string {
  if (availableModels.length === 0) {
    throw new Error('No available models')
  }

  const lowerPrompt = prompt.toLowerCase()

  const codePatterns = ['코드', 'code', 'function', 'class', 'debug', '버그']
  const reasoningPatterns = ['분석', 'analyze', '왜', 'why', 'explain']
  const fastPatterns = ['간단히', 'briefly', '짧게', 'tl;dr']

  const hasCodePattern = codePatterns.some((pattern) =>
    lowerPrompt.includes(pattern)
  )
  const hasReasoningPattern = reasoningPatterns.some((pattern) =>
    lowerPrompt.includes(pattern)
  )
  const hasFastPattern = fastPatterns.some((pattern) =>
    lowerPrompt.includes(pattern)
  )

  if (hasCodePattern) {
    const codeModel = availableModels.find((model) =>
      model.capabilities?.includes('code')
    )
    if (codeModel) return codeModel.id
  }

  if (hasReasoningPattern) {
    const reasoningModel = availableModels.find((model) =>
      model.capabilities?.includes('reasoning')
    )
    if (reasoningModel) return reasoningModel.id
  }

  if (hasFastPattern) {
    const fastModel = availableModels.find((model) =>
      model.capabilities?.includes('fast')
    )
    if (fastModel) return fastModel.id
  }

  return availableModels[0].id
}
