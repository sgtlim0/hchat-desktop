import { useState, useCallback } from 'react'

interface PageData {
  title: string
  url: string
  content: string
  selectedText: string
  meta: { description: string; keywords: string; ogTitle: string }
}

export function usePageContext() {
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchPageContent = useCallback(async () => {
    setIsLoading(true)
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) {
        setIsLoading(false)
        return
      }
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE' })
      setPageData(response as PageData)
    } catch {
      setPageData(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { pageData, isLoading, fetchPageContent }
}
