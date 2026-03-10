import { useCallback } from 'react'
import { useArtifactStore } from '@/entities/artifact/artifact.store'
import { useUsageStore, calculateCost } from '@/entities/usage/usage.store'
import { useMemoryStore } from '@/entities/memory/memory.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { detectArtifacts } from '@/shared/lib/artifact-detector'
import { estimateTokens } from '@/shared/lib/token-estimator'
import { MODELS } from '@/shared/constants'
import type { UsageEntry } from '@/shared/types'

export function usePostProcessing() {
  const createArtifact = useArtifactStore((s) => s.createArtifact)
  const addUsage = useUsageStore((s) => s.addUsage)
  const autoExtract = useMemoryStore((s) => s.autoExtract)
  const extractFromMessages = useMemoryStore((s) => s.extractFromMessages)
  const credentials = useSettingsStore((s) => s.credentials)

  const processResponse = useCallback(
    async (
      sessionId: string,
      assistantMessageId: string,
      messageText: string,
      fullText: string,
      chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
      effectiveModel: string,
      actualInputTokens: number | null,
      actualOutputTokens: number | null
    ) => {
      // Auto-detect artifacts from completed response
      if (fullText) {
        const detected = detectArtifacts(fullText)
        for (const det of detected) {
          createArtifact({
            sessionId,
            messageId: assistantMessageId,
            title: det.title,
            language: det.language,
            type: det.type,
            content: det.content,
          })
        }
      }

      // Record usage — prefer actual token counts from backend, fall back to estimates
      const model = MODELS.find((m) => m.id === effectiveModel)
      if (model && fullText) {
        const inputTokens = actualInputTokens ?? estimateTokens(messageText)
        const outputTokens = actualOutputTokens ?? estimateTokens(fullText)
        const cost = calculateCost(effectiveModel, inputTokens, outputTokens)
        const usageEntry: UsageEntry = {
          id: `usage-${Date.now()}`,
          sessionId,
          modelId: effectiveModel,
          provider: model.provider,
          inputTokens,
          outputTokens,
          cost,
          createdAt: new Date().toISOString(),
          category: 'chat',
        }
        addUsage(usageEntry)
      }

      // Auto-extract memories from recent messages
      if (autoExtract && credentials && fullText) {
        const recentMessages = chatHistory.slice(-6).concat([
          { role: 'assistant' as const, content: fullText },
        ])
        extractFromMessages(recentMessages, credentials).catch(() => {
          // Silent failure — memory extraction is best-effort
        })
      }
    },
    [createArtifact, addUsage, autoExtract, extractFromMessages, credentials]
  )

  return { processResponse }
}