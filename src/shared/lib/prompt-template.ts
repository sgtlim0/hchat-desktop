const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g

/**
 * Extract variable names from a template string.
 * e.g., "Hello {{name}}, your role is {{role}}" → ["name", "role"]
 */
export function extractVariables(content: string): string[] {
  const matches = new Set<string>()
  let match: RegExpExecArray | null
  while ((match = VARIABLE_PATTERN.exec(content)) !== null) {
    matches.add(match[1])
  }
  return [...matches]
}

/**
 * Replace {{variable}} placeholders with provided values.
 */
export function fillTemplate(content: string, values: Record<string, string>): string {
  return content.replace(VARIABLE_PATTERN, (_, key: string) => values[key] ?? `{{${key}}}`)
}
