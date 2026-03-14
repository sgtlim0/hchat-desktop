import { useState, useCallback } from 'react'
import type { DatasetCandidate } from '@ext/content/dataset-candidate'

export function useDatasetDiscovery() {
  const [candidates, setCandidates] = useState<DatasetCandidate[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scan = useCallback(async () => {
    setIsScanning(true)
    setError(null)
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) throw new Error('No active tab')

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'DISCOVER_DATASETS',
      })

      if (response?.error) throw new Error(response.error)
      setCandidates(response.data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scan failed'
      setError(message)
    } finally {
      setIsScanning(false)
    }
  }, [])

  const highlight = useCallback(async (datasetIndex: number) => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) return
      await chrome.tabs.sendMessage(tab.id, {
        type: 'HIGHLIGHT_DATASET',
        datasetIndex,
      })
    } catch {
      // ignore
    }
  }, [])

  const clearHighlight = useCallback(async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) return
      await chrome.tabs.sendMessage(tab.id, { type: 'CLEAR_HIGHLIGHTS' })
    } catch {
      // ignore
    }
  }, [])

  const clear = useCallback(() => {
    setCandidates([])
    setError(null)
  }, [])

  return { candidates, isScanning, error, scan, highlight, clearHighlight, clear }
}
