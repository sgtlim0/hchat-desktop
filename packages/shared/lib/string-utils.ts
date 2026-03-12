export function padStart(str: string, length: number, char = ' '): string {
  return str.padStart(length, char)
}

export function padEnd(str: string, length: number, char = ' '): string {
  return str.padEnd(length, char)
}

export function mask(str: string, visibleStart = 2, visibleEnd = 0, maskChar = '*'): string {
  if (str.length <= visibleStart + visibleEnd) return str
  const start = str.slice(0, visibleStart)
  const end = visibleEnd > 0 ? str.slice(-visibleEnd) : ''
  const masked = maskChar.repeat(Math.max(1, str.length - visibleStart - visibleEnd))
  return start + masked + end
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s\u3131-\uD79D-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function reverse(str: string): string {
  return Array.from(str).reverse().join('')
}

export function repeat(str: string, count: number, separator = ''): string {
  if (count <= 0) return ''
  return Array(count).fill(str).join(separator)
}

export function contains(str: string, search: string, ignoreCase = false): boolean {
  if (ignoreCase) return str.toLowerCase().includes(search.toLowerCase())
  return str.includes(search)
}

export function startsWith(str: string, search: string, ignoreCase = false): boolean {
  if (ignoreCase) return str.toLowerCase().startsWith(search.toLowerCase())
  return str.startsWith(search)
}

export function endsWith(str: string, search: string, ignoreCase = false): boolean {
  if (ignoreCase) return str.toLowerCase().endsWith(search.toLowerCase())
  return str.endsWith(search)
}
