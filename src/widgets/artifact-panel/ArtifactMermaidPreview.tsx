import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from '@/shared/i18n'

interface ArtifactMermaidPreviewProps {
  content: string
}

export function ArtifactMermaidPreview({ content }: ArtifactMermaidPreviewProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const renderMermaid = useCallback(async () => {
    if (!containerRef.current) return

    setLoading(true)
    setError(null)

    try {
      const mermaid = (await import('mermaid')).default
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'strict',
      })

      const id = `mermaid-${Date.now()}`
      const { svg } = await mermaid.render(id, content)
      if (containerRef.current) {
        containerRef.current.innerHTML = svg
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [content])

  useEffect(() => {
    renderMermaid()
  }, [renderMermaid])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
        {t('common.loading')}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <p className="text-red-500 text-sm font-medium">{t('artifact.mermaidError')}</p>
          <p className="text-text-tertiary text-xs mt-1 max-w-md">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center h-full overflow-auto p-4 bg-white [&_svg]:max-w-full"
    />
  )
}
