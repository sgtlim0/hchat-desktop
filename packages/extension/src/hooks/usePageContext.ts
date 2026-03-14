import { useState, useCallback } from 'react'
import type { PageContext } from '@ext/shared/types'

export function usePageContext() {
  const [pageContext, setPageContext] = useState<PageContext | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const extractPage = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await chrome.runtime.sendMessage({ type: 'EXTRACT_PAGE' })
      if (response && response.data) {
        setPageContext(response.data as PageContext)
      }
    } catch (error) {
      console.error('Failed to extract page context:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearContext = useCallback(() => {
    setPageContext(null)
  }, [])

  return { pageContext, isLoading, extractPage, clearContext }
}
