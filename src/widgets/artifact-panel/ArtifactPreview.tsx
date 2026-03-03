import type { Artifact } from '@/shared/types'
import { ArtifactCodeView } from './ArtifactCodeView'
import { ArtifactHtmlPreview } from './ArtifactHtmlPreview'
import { ArtifactMermaidPreview } from './ArtifactMermaidPreview'

interface ArtifactPreviewProps {
  artifact: Artifact
  viewMode: 'preview' | 'code'
}

export function ArtifactPreview({ artifact, viewMode }: ArtifactPreviewProps) {
  const currentVersion = artifact.versions[artifact.currentVersionIndex]
  if (!currentVersion) return null

  const content = currentVersion.content

  if (viewMode === 'code') {
    return <ArtifactCodeView language={artifact.language} content={content} />
  }

  // Preview mode: dispatch by type
  switch (artifact.type) {
    case 'html':
    case 'svg':
      return <ArtifactHtmlPreview content={content} />
    case 'mermaid':
      return <ArtifactMermaidPreview content={content} />
    case 'code':
    default:
      return <ArtifactCodeView language={artifact.language} content={content} />
  }
}
