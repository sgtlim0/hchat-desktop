import type { ArtifactType } from '@/shared/types'

export interface DetectedArtifact {
  language: string
  type: ArtifactType
  content: string
  title: string
}

const CODE_BLOCK_REGEX = /```(\w+)?\n([\s\S]*?)```/g
const MIN_CODE_LINES = 5

const LANGUAGE_TYPE_MAP: Record<string, ArtifactType> = {
  html: 'html',
  htm: 'html',
  svg: 'svg',
  mermaid: 'mermaid',
}

export function languageToArtifactType(language: string): ArtifactType {
  return LANGUAGE_TYPE_MAP[language.toLowerCase()] ?? 'code'
}

export function inferArtifactTitle(language: string, content: string): string {
  // Try to extract function/class/component name
  const funcMatch = content.match(/(?:function|const|let|var)\s+(\w+)/)
  if (funcMatch) return funcMatch[1]

  const classMatch = content.match(/class\s+(\w+)/)
  if (classMatch) return classMatch[1]

  const exportMatch = content.match(/export\s+(?:default\s+)?(?:function|class|const)\s+(\w+)/)
  if (exportMatch) return exportMatch[1]

  const componentMatch = content.match(/(?:function|const)\s+([A-Z]\w+)/)
  if (componentMatch) return componentMatch[1]

  // HTML: try to extract <title>
  if (language === 'html' || language === 'htm') {
    const titleMatch = content.match(/<title>([^<]+)<\/title>/i)
    if (titleMatch) return titleMatch[1].trim()
  }

  // Mermaid: use diagram type
  if (language === 'mermaid') {
    const typeMatch = content.match(/^(\w+)/)
    if (typeMatch) return `${typeMatch[1]} diagram`
  }

  return `${language} snippet`
}

export function detectArtifacts(markdown: string): DetectedArtifact[] {
  const results: DetectedArtifact[] = []
  let match: RegExpExecArray | null

  // Reset lastIndex for global regex
  CODE_BLOCK_REGEX.lastIndex = 0

  while ((match = CODE_BLOCK_REGEX.exec(markdown)) !== null) {
    const language = match[1] ?? 'text'
    const content = match[2].trim()
    if (!content) continue

    const type = languageToArtifactType(language)

    // For plain code, require minimum lines
    if (type === 'code') {
      const lineCount = content.split('\n').length
      if (lineCount < MIN_CODE_LINES) continue
    }

    const title = inferArtifactTitle(language, content)
    results.push({ language, type, content, title })
  }

  return results
}
