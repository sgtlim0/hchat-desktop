/**
 * Convert text to title case (capitalize first letter of each word)
 */
export function toTitleCase(text: string): string {
  if (!text) return ''

  return text
    .toLowerCase()
    .split(/(\s+|[-@.])/)
    .map((word, index) => {
      // Don't capitalize separators
      if (index % 2 === 1) return word
      // Skip Korean characters
      if (/^[\u3131-\uD79D]/.test(word)) return word
      // Capitalize first letter if it's a letter
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join('')
}

/**
 * Convert text to camelCase
 */
export function toCamelCase(text: string): string {
  if (!text) return ''

  // Split by spaces, hyphens, underscores
  const words = text.split(/[\s\-_]+/)

  return words
    .map((word, index) => {
      word = word.toLowerCase()
      if (index === 0) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join('')
}

/**
 * Convert text to kebab-case
 */
export function toKebabCase(text: string): string {
  if (!text) return ''

  return text
    // Insert hyphen before uppercase letters in camelCase
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    // Handle consecutive uppercase letters
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    // Replace spaces, underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove any non-alphanumeric except hyphens
    .replace(/[^\w\-]+/g, '')
    // Remove multiple hyphens
    .replace(/\-+/g, '-')
    // Convert to lowercase
    .toLowerCase()
}

/**
 * Convert text to snake_case
 */
export function toSnakeCase(text: string): string {
  if (!text) return ''

  return text
    // Insert underscore before uppercase letters in camelCase
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    // Handle consecutive uppercase letters
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    // Replace spaces, hyphens with underscores
    .replace(/[\s\-]+/g, '_')
    // Remove any non-alphanumeric except underscores
    .replace(/[^\w_]+/g, '')
    // Remove multiple underscores
    .replace(/_+/g, '_')
    // Convert to lowercase
    .toLowerCase()
}

/**
 * Count the number of words in text (supports Korean)
 */
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0

  // Remove punctuation and extra whitespace
  const cleanText = text
    .replace(/[.,!?;:'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleanText) return 0

  // Split by whitespace and filter empty strings
  return cleanText.split(/\s+/).filter(word => word.length > 0).length
}

/**
 * Count the number of characters in text
 * @param includeSpaces - Whether to include spaces in the count (default: true)
 */
export function countChars(text: string, includeSpaces: boolean = true): number {
  if (!text) return 0

  if (includeSpaces) {
    // Use Array.from to properly handle emojis and special characters
    return Array.from(text).length
  }

  return Array.from(text.replace(/\s/g, '')).length
}

/**
 * Count the number of sentences in text
 */
export function countSentences(text: string): number {
  if (!text || !text.trim()) return 0

  // Handle common abbreviations by temporarily replacing them
  let processedText = text
    .replace(/Dr\./g, 'Dr')
    .replace(/Mr\./g, 'Mr')
    .replace(/Mrs\./g, 'Mrs')
    .replace(/Ms\./g, 'Ms')
    .replace(/Jr\./g, 'Jr')
    .replace(/Sr\./g, 'Sr')
    .replace(/Ph\.D/g, 'PhD')
    .replace(/U\.S\.A\./g, 'USA')
    .replace(/U\.S\./g, 'US')
    .replace(/U\.K\./g, 'UK')
    .replace(/etc\./g, 'etc')
    .replace(/vs\./g, 'vs')
    .replace(/i\.e\./g, 'ie')
    .replace(/e\.g\./g, 'eg')
    // Handle decimal numbers
    .replace(/\$(\d+)\.(\d+)/g, '$$$1_$2')
    .replace(/(\d+)\.(\d+)/g, '$1_$2')

  // Count sentences by looking for sentence-ending punctuation
  // Includes Western punctuation (. ! ?) and Korean endings
  const sentences = processedText.match(/[.!?]+/g)

  if (!sentences) {
    // If no sentence-ending punctuation, count as 1 sentence if there's content
    return processedText.trim() ? 1 : 0
  }

  return sentences.length
}

/**
 * Truncate text to a maximum length
 * @param maxLength - Maximum length of the truncated text
 * @param suffix - Suffix to append when truncated (default: '...')
 */
export function truncate(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text) return ''

  if (text.length <= maxLength) {
    return text
  }

  if (maxLength <= 0) {
    return suffix
  }

  // Try to truncate at word boundary
  const truncated = text.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  // If we can break at a word boundary and it's reasonably close to maxLength
  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace) + suffix
  }

  return truncated + suffix
}

/**
 * Remove extra whitespace from text
 */
export function removeExtraWhitespace(text: string): string {
  if (!text) return ''

  return text
    // Replace all whitespace characters with single space
    .replace(/\s+/g, ' ')
    // Trim leading and trailing whitespace
    .trim()
}

/**
 * Extract URLs from text
 */
export function extractUrls(text: string): string[] {
  if (!text) return []

  // Regex pattern for matching URLs
  // Matches http(s)://, ftp://, and www. URLs
  const urlPattern = /(?:(?:https?|ftp):\/\/|www\.)[^\s,;)]*[^\s,;).]/gi

  const matches = text.match(urlPattern)
  return matches || []
}