// Parse tool calls from LLM response XML

export interface ParsedToolCall {
  name: string
  args: Record<string, string>
}

export function parseToolCalls(text: string): ParsedToolCall[] {
  const calls: ParsedToolCall[] = []
  const regex = /<tool_call>\s*<name>([\s\S]*?)<\/name>\s*<args>([\s\S]*?)<\/args>\s*<\/tool_call>/g

  let match = regex.exec(text)
  while (match) {
    const name = match[1].trim()
    const argsXml = match[2]
    const args: Record<string, string> = {}

    // Parse individual args
    const argRegex = /<(\w+)>([\s\S]*?)<\/\1>/g
    let argMatch = argRegex.exec(argsXml)
    while (argMatch) {
      args[argMatch[1]] = argMatch[2].trim()
      argMatch = argRegex.exec(argsXml)
    }

    calls.push({ name, args })
    match = regex.exec(text)
  }

  return calls
}

export function stripToolCalls(text: string): string {
  return text
    .replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '')
    .trim()
}
