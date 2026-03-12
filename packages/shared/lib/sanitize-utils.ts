const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
}

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char)
}

export function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]*>/g, '')
}

export function sanitizeUrl(url: string): string {
  const trimmed = url.trim()
  if (/^javascript:/i.test(trimmed)) return ''
  if (/^data:/i.test(trimmed) && !/^data:image\//i.test(trimmed)) return ''
  if (/^vbscript:/i.test(trimmed)) return ''
  return trimmed
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/^\.+/, '')
    .trim()
    .slice(0, 255)
}

export function preventXss(input: string): string {
  return escapeHtml(stripHtmlTags(input))
}

export function isCleanText(str: string): boolean {
  return !/<script/i.test(str) && !/on\w+\s*=/i.test(str) && !/javascript:/i.test(str)
}
