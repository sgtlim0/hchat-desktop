import { useMemo } from 'react'
import DOMPurify from 'dompurify'

interface ArtifactHtmlPreviewProps {
  content: string
}

export function ArtifactHtmlPreview({ content }: ArtifactHtmlPreviewProps) {
  const srcDoc = useMemo(() => {
    const sanitized = DOMPurify.sanitize(content, {
      ADD_TAGS: ['style'],
      ADD_ATTR: ['xmlns', 'viewBox', 'fill', 'stroke', 'stroke-width', 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'transform', 'points', 'x1', 'y1', 'x2', 'y2'],
      WHOLE_DOCUMENT: false,
    })

    // For SVG, wrap in minimal HTML
    if (content.trimStart().startsWith('<svg')) {
      return `<!DOCTYPE html><html><head><style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff}</style></head><body>${sanitized}</body></html>`
    }
    // For full HTML, sanitize and wrap
    if (content.includes('<html') || content.includes('<!DOCTYPE')) {
      return DOMPurify.sanitize(content, { WHOLE_DOCUMENT: true, ADD_TAGS: ['style'] })
    }
    return `<!DOCTYPE html><html><head><style>body{margin:16px;font-family:system-ui,sans-serif}</style></head><body>${sanitized}</body></html>`
  }, [content])

  return (
    <iframe
      srcDoc={srcDoc}
      sandbox=""
      className="w-full h-full border-0 bg-white"
      title="Artifact Preview"
    />
  )
}
