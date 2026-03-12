import { useCallback } from 'react'

export function useMessageBuilder() {
  const buildSystemPrompt = useCallback(
    (basePrompt?: string, pageContent?: string): string => {
      const parts: string[] = []

      if (pageContent) {
        parts.push(`Current page content:\n---\n${pageContent}\n---`)
      }

      if (basePrompt) {
        parts.push(basePrompt)
      }

      return parts.join('\n\n') || 'You are a helpful AI assistant.'
    },
    [],
  )

  return { buildSystemPrompt }
}
