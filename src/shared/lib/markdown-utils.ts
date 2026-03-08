export interface Heading { level: number; text: string; id: string }
export interface CodeBlock { language: string; content: string }
export interface TOCEntry { heading: Heading; children: TOCEntry[] }

export function extractHeadings(markdown: string): Heading[] {
  const regex = /^(#{1,6})\s+(.+)$/gm
  const headings: Heading[] = []
  let match
  while ((match = regex.exec(markdown)) !== null) {
    const text = match[2].trim()
    headings.push({
      level: match[1].length,
      text,
      id: text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
    })
  }
  return headings
}

export function generateTOC(headings: Heading[]): TOCEntry[] {
  const root: TOCEntry[] = []
  const stack: TOCEntry[] = []

  for (const heading of headings) {
    const entry: TOCEntry = { heading, children: [] }

    while (stack.length > 0 && stack[stack.length - 1].heading.level >= heading.level) {
      stack.pop()
    }

    if (stack.length === 0) {
      root.push(entry)
    } else {
      stack[stack.length - 1].children.push(entry)
    }
    stack.push(entry)
  }

  return root
}

export function countCodeBlocks(markdown: string): number {
  const matches = markdown.match(/```/g)
  return matches ? Math.floor(matches.length / 2) : 0
}

export function extractCodeBlocks(markdown: string): CodeBlock[] {
  const regex = /```(\w*)\n([\s\S]*?)```/g
  const blocks: CodeBlock[] = []
  let match
  while ((match = regex.exec(markdown)) !== null) {
    blocks.push({ language: match[1] || 'text', content: match[2].trim() })
  }
  return blocks
}

export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function wordCount(markdown: string): number {
  const plain = stripMarkdown(markdown)
  if (!plain) return 0
  return plain.split(/\s+/).filter((w) => w.length > 0).length
}

export function estimateReadingTime(markdown: string, wpm = 200): number {
  const words = wordCount(markdown)
  return Math.max(1, Math.ceil(words / wpm))
}
