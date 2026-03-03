import { useMemo } from 'react'

interface ArtifactHtmlPreviewProps {
  content: string
}

export function ArtifactHtmlPreview({ content }: ArtifactHtmlPreviewProps) {
  const srcDoc = useMemo(() => {
    // For SVG, wrap in minimal HTML
    if (content.trimStart().startsWith('<svg')) {
      return `<!DOCTYPE html><html><head><style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff}</style></head><body>${content}</body></html>`
    }
    // For full HTML, use as-is; for partial, wrap
    if (content.includes('<html') || content.includes('<!DOCTYPE')) {
      return content
    }
    return `<!DOCTYPE html><html><head><style>body{margin:16px;font-family:system-ui,sans-serif}</style></head><body>${content}</body></html>`
  }, [content])

  return (
    <iframe
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      className="w-full h-full border-0 bg-white"
      title="Artifact Preview"
    />
  )
}
