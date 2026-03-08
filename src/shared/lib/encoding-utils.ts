export function base64Encode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
}

export function base64Decode(encoded: string): string {
  return decodeURIComponent(escape(atob(encoded)))
}

export function urlEncode(str: string): string {
  return encodeURIComponent(str)
}

export function urlDecode(encoded: string): string {
  return decodeURIComponent(encoded)
}

export function encodeHtml(str: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
  return str.replace(/[&<>"']/g, (c) => map[c] || c)
}

export function decodeHtml(str: string): string {
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'"  // Also handle hex notation for apostrophe
  }
  return str.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&#x27;/g, (m) => map[m] || m)
}

export function utf8ByteLength(str: string): number {
  return new TextEncoder().encode(str).length
}
