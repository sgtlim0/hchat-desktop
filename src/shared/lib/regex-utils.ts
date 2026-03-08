/**
 * Regex utility functions for pattern matching and text manipulation
 */

/**
 * Escapes special regex characters in a string
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Creates a case-insensitive regex from a search query
 */
export function createSearchRegex(query: string, flags: string = 'i'): RegExp {
  // For empty query, return an empty regex
  if (!query) {
    return new RegExp('', flags)
  }
  return new RegExp(escapeRegex(query), flags)
}

/**
 * Returns all matches with their indices
 */
export function matchAll(text: string, pattern: RegExp): Array<{ match: string; index: number }> {
  const results: Array<{ match: string; index: number }> = []

  // If the pattern is not global, only find the first match
  if (!pattern.global) {
    const match = pattern.exec(text)
    if (match) {
      results.push({ match: match[0], index: match.index })
    }
    return results
  }

  // Make a copy to avoid mutating the original pattern's lastIndex
  const regex = new RegExp(pattern.source, pattern.flags)
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    results.push({ match: match[0], index: match.index })
    // Prevent infinite loop for zero-width matches
    if (match.index === regex.lastIndex) {
      regex.lastIndex++
    }
  }

  return results
}

/**
 * Extracts email addresses from text
 */
export function extractEmails(text: string): string[] {
  // Email regex pattern - supports most common email formats
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi
  const matches = text.match(emailPattern) || []

  // Deduplicate using Set
  return [...new Set(matches)]
}

/**
 * Extracts phone numbers from text
 */
export function extractPhoneNumbers(text: string): string[] {
  // Phone number patterns for various formats
  const patterns = [
    /\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{0,4}/g,
    /\(\d{3}\)\s?\d{3}-\d{4}/g,
    /\d{3}[-.\s]\d{3}[-.\s]\d{4}/g,
    /\+\d{1,3}\s\d{2}\s\d{4}\s\d{4}/g
  ]

  const phones = new Set<string>()

  for (const pattern of patterns) {
    const matches = text.match(pattern) || []
    for (const match of matches) {
      // Filter out too short numbers (less than 7 digits)
      const digitCount = match.replace(/\D/g, '').length
      if (digitCount >= 7) {
        phones.add(match.trim())
      }
    }
  }

  return [...phones]
}

/**
 * Tests if text matches a pattern
 */
export function isMatch(text: string, pattern: string | RegExp): boolean {
  if (typeof pattern === 'string') {
    // Create case-insensitive regex from string pattern
    const regex = createSearchRegex(pattern)
    return regex.test(text)
  }
  return pattern.test(text)
}

/**
 * Replaces all occurrences of a pattern in text
 */
export function replaceAll(text: string, pattern: string, replacement: string): string {
  // Escape the pattern and create a global, case-insensitive regex
  const regex = new RegExp(escapeRegex(pattern), 'gi')
  return text.replace(regex, replacement)
}

/**
 * Highlights matches in text by wrapping them in markers
 */
export function highlightMatches(
  text: string,
  query: string,
  marker: [string, string] = ['<mark>', '</mark>']
): string {
  if (!query) return text

  // Create a global, case-insensitive regex
  const regex = createSearchRegex(query, 'gi')

  return text.replace(regex, (match) => `${marker[0]}${match}${marker[1]}`)
}

/**
 * Counts the number of matches in text
 */
export function countMatches(text: string, pattern: string | RegExp): number {
  if (!text || !pattern) return 0

  if (typeof pattern === 'string') {
    // Create case-insensitive global regex from string
    const regex = createSearchRegex(pattern, 'gi')
    const matches = text.match(regex)
    return matches ? matches.length : 0
  }

  // For RegExp, ensure it's global
  const regex = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g')
  const matches = text.match(regex)
  return matches ? matches.length : 0
}

/**
 * Tests if a regex pattern is valid
 */
export function testPattern(pattern: string): { valid: boolean; error?: string } {
  try {
    new RegExp(pattern)
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid regular expression'
    }
  }
}
