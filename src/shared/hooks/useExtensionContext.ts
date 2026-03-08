import { useState, useEffect, useCallback } from 'react'

declare const chrome: any

export interface PageContext {
  url: string
  title: string
  selectedText: string
  bodyText: string
  capturedAt: number
}

export type AnalyzeMode = 'summarize' | 'explain' | 'research' | 'translate'

export interface ExtensionContext {
  context: PageContext
  mode: AnalyzeMode
}

export function useExtensionContext() {
  const [extContext, setExtContext] = useState<ExtensionContext | null>(null)

  useEffect(() => {
    // 1. Check chrome.storage.local for pending context (from context menu -> new tab)
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      chrome.storage.local.get('pendingContext', (result: Record<string, unknown>) => {
        if (result.pendingContext) {
          setExtContext(result.pendingContext as ExtensionContext)
          chrome.storage.local.remove('pendingContext')
        }
      })
    }

    // 2. Listen for postMessage from Extension (already open tab)
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CONTEXT_FROM_EXTENSION') {
        setExtContext(event.data.payload as ExtensionContext)
      }
    }
    window.addEventListener('message', handleMessage)

    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const clearContext = useCallback(() => setExtContext(null), [])

  return { extContext, clearContext }
}
