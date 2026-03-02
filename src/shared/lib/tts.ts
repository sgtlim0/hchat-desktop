// TTS (Text-to-Speech) — Web Speech API wrapper

const MARKDOWN_PATTERNS = [
  /```[\s\S]*?```/g,          // code blocks
  /`[^`]+`/g,                  // inline code
  /!\[.*?\]\(.*?\)/g,          // images
  /\[([^\]]+)\]\(.*?\)/g,     // links → keep text
  /#{1,6}\s+/g,               // headings
  /[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, // bold/italic/strike → keep text
  /^\s*[-*+]\s+/gm,           // list markers
  /^\s*\d+\.\s+/gm,           // numbered list
  /^\s*>\s+/gm,               // blockquote
  /\|[^|]*\|/g,               // tables
  /---+/g,                     // horizontal rules
]

function stripMarkdown(text: string): string {
  let result = text
  // Replace links with their text
  result = result.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  // Replace bold/italic with their text
  result = result.replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, '$1')
  // Remove remaining markdown
  for (const pattern of MARKDOWN_PATTERNS) {
    if (pattern.source.includes('(') && !pattern.source.startsWith('[')) continue
    result = result.replace(pattern, ' ')
  }
  return result.replace(/\s+/g, ' ').trim()
}

export function isSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speak(text: string, lang = 'ko-KR'): void {
  if (!isSupported()) return
  stop()
  const cleaned = stripMarkdown(text)
  if (!cleaned) return

  const utterance = new SpeechSynthesisUtterance(cleaned)
  utterance.lang = lang
  utterance.rate = 1.0
  utterance.pitch = 1.0
  speechSynthesis.speak(utterance)
}

export function stop(): void {
  if (!isSupported()) return
  speechSynthesis.cancel()
}

export function isSpeaking(): boolean {
  if (!isSupported()) return false
  return speechSynthesis.speaking
}
