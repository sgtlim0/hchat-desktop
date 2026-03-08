export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function createSearchRegex(query: string, flags = 'gi'): RegExp {
  return new RegExp(escapeRegex(query), flags)
}

export function matchAll(text: string, pattern: RegExp): Array<{ match: string; index: number }> {
  const results: Array<{ match: string; index: number }> = []
  const global = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g')
  let m
  while ((m = global.exec(text)) !== null) {
    results.push({ match: m[0], index: m.index })
  }
  return results
}

export function extractEmails(text: string): string[] {
  return text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/g) ?? []
}

export function extractPhoneNumbers(text: string): string[] {
  return text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) ?? []
}

export function isMatch(text: string, pattern: string | RegExp): boolean {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
  return regex.test(text)
}

export function replaceAll(text: string, pattern: string, replacement: string): string {
  return text.split(pattern).join(replacement)
}

export function highlightMatches(text: string, query: string, marker: [string, string] = ['<mark>', '</mark>']): string {
  if (!query) return text
  const regex = createSearchRegex(query)
  return text.replace(regex, (match) => `${marker[0]}${match}${marker[1]}`)
}

export function countMatches(text: string, pattern: string | RegExp): number {
  const regex = typeof pattern === 'string' ? new RegExp(escapeRegex(pattern), 'g') : new RegExp(pattern.source, 'g')
  return (text.match(regex) ?? []).length
}

export function testPattern(pattern: string): { valid: boolean; error?: string } {
  try {
    new RegExp(pattern)
    return { valid: true }
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : 'Invalid pattern' }
  }
}
