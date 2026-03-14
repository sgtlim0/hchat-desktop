import { useState, useCallback, useRef } from 'react'
import { getConfig } from '@hchat/shared'

export type ResearchMode = 'deep' | 'quick'

export type ResearchStep =
  | 'idle'
  | 'query_expansion'
  | 'searching'
  | 'extracting'
  | 'synthesizing'
  | 'done'
  | 'error'

export interface ResearchSource {
  readonly url: string
  readonly title: string
  readonly snippet?: string
  readonly score?: number
}

export interface ResearchState {
  readonly step: ResearchStep
  readonly message: string
  readonly queries: ReadonlyArray<string>
  readonly sources: ReadonlyArray<ResearchSource>
  readonly searchResults: ReadonlyArray<ResearchSource>
  readonly report: string
  readonly error: string | null
}

const INITIAL_STATE: ResearchState = {
  step: 'idle',
  message: '',
  queries: [],
  sources: [],
  searchResults: [],
  report: '',
  error: null,
}

export function useResearch() {
  const [state, setState] = useState<ResearchState>(INITIAL_STATE)
  const [isRunning, setIsRunning] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const start = useCallback(
    async (
      query: string,
      mode: ResearchMode,
      credentials: { accessKeyId: string; secretAccessKey: string; region: string },
      modelId: string,
    ) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setIsRunning(true)
      setState({ ...INITIAL_STATE, step: 'query_expansion', message: 'Starting research...' })

      const apiBase = getConfig().apiBaseUrl
      const endpoint = mode === 'quick' ? '/api/research/quick' : '/api/research/start'

      try {
        const response = await fetch(`${apiBase}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            credentials,
            modelId,
            depth: mode === 'deep' ? 2 : 1,
            maxSources: mode === 'deep' ? 5 : 3,
          }),
          signal: controller.signal,
        })

        if (!response.ok) throw new Error(`Research API error: ${response.status}`)
        if (!response.body) throw new Error('No response body')

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const data = JSON.parse(line.slice(6))
              handleEvent(data, setState)
            } catch {
              // skip malformed SSE
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setState((prev) => ({
          ...prev,
          step: 'error',
          error: err instanceof Error ? err.message : 'Research failed',
        }))
      } finally {
        setIsRunning(false)
      }
    },
    [],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setIsRunning(false)
    setState((prev) => ({ ...prev, step: 'done', message: 'Research stopped' }))
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setIsRunning(false)
    setState(INITIAL_STATE)
  }, [])

  return { state, isRunning, start, stop, reset }
}

function handleEvent(
  data: Record<string, unknown>,
  setState: React.Dispatch<React.SetStateAction<ResearchState>>,
) {
  const type = data.type as string

  switch (type) {
    case 'research_start':
      setState((prev) => ({ ...prev, step: 'query_expansion', message: 'Research started' }))
      break

    case 'research_status':
      setState((prev) => ({
        ...prev,
        step: data.step as ResearchStep,
        message: (data.message as string) || '',
      }))
      break

    case 'research_queries':
      setState((prev) => ({
        ...prev,
        queries: (data.queries as string[]) || [],
      }))
      break

    case 'research_search_done':
      setState((prev) => ({
        ...prev,
        searchResults: (data.results as ResearchSource[]) || [],
      }))
      break

    case 'research_evidence':
      setState((prev) => ({
        ...prev,
        sources: (data.sources as ResearchSource[]) || [],
      }))
      break

    case 'research_report':
      setState((prev) => ({
        ...prev,
        step: 'done',
        report: (data.content as string) || '',
      }))
      break

    case 'done':
      setState((prev) => ({ ...prev, step: 'done' }))
      break

    case 'error':
      setState((prev) => ({
        ...prev,
        step: 'error',
        error: (data.error as string) || 'Unknown error',
      }))
      break
  }
}
