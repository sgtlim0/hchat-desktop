export interface CopyOptions {
  format?: 'text' | 'html' | 'code'
  language?: string
  notify?: boolean
}

export async function copyToClipboard(
  text: string,
  options?: CopyOptions,
): Promise<boolean> {
  const format = options?.format ?? 'text'

  try {
    if (format === 'html' && typeof ClipboardItem !== 'undefined') {
      const htmlBlob = new Blob([text], { type: 'text/html' })
      const textBlob = new Blob([stripHtml(text)], { type: 'text/plain' })
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        }),
      ])
      return true
    }

    if (format === 'code') {
      const formatted = options?.language
        ? `\`\`\`${options.language}\n${text}\n\`\`\``
        : text
      await navigator.clipboard.writeText(formatted)
      return true
    }

    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return fallbackCopy(text)
  }
}

function fallbackCopy(text: string): boolean {
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    return true
  } catch {
    return false
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}

export function formatCodeForCopy(code: string, language?: string): string {
  return language ? `// Language: ${language}\n${code}` : code
}

export function formatMarkdownForCopy(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
}
