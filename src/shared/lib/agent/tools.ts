// Agent tools that run locally in the browser

export interface AgentTool {
  name: string
  description: string
  parameters: Record<string, string>
  execute: (args: Record<string, string>) => Promise<string>
  available: boolean
}

// Safe math calculator (no eval)
function safeCalculate(expression: string): string {
  // Simple arithmetic parser supporting +, -, *, /, (), ^
  const sanitized = expression.replace(/[^0-9+\-*/().^% ]/g, '')
  if (!sanitized.trim()) return 'Invalid expression'

  try {
    // Replace ^ with ** for exponentiation
    const expr = sanitized.replace(/\^/g, '**')
    // Use Function constructor as a safer alternative to eval
    const fn = new Function(`"use strict"; return (${expr})`)
    const result = fn()
    if (typeof result !== 'number' || !isFinite(result)) {
      return 'Invalid result'
    }
    return String(result)
  } catch {
    return 'Calculation error'
  }
}

export const AGENT_TOOLS: AgentTool[] = [
  {
    name: 'calculate',
    description: 'Perform mathematical calculations. Supports +, -, *, /, ^, (), %.',
    parameters: { expression: 'The mathematical expression to evaluate' },
    execute: async (args) => {
      const result = safeCalculate(args.expression ?? '')
      return `Result: ${result}`
    },
    available: true,
  },
  {
    name: 'get_datetime',
    description: 'Get the current date and time.',
    parameters: {},
    execute: async () => {
      const now = new Date()
      return `Current date/time: ${now.toISOString()} (${now.toLocaleString()})`
    },
    available: true,
  },
  {
    name: 'web_search',
    description: 'Search the web for information. Requires backend proxy.',
    parameters: { query: 'The search query' },
    execute: async (args) => {
      return `[Web search for "${args.query}" requires backend proxy. Feature not yet connected.]`
    },
    available: false,
  },
  {
    name: 'fetch_url',
    description: 'Fetch and extract text content from a URL. Requires backend proxy.',
    parameters: { url: 'The URL to fetch' },
    execute: async (args) => {
      return `[Fetching "${args.url}" requires backend proxy. Feature not yet connected.]`
    },
    available: false,
  },
]

export function getToolDescriptions(): string {
  return AGENT_TOOLS
    .filter((t) => t.available)
    .map((t) => {
      const params = Object.entries(t.parameters)
        .map(([k, v]) => `  <${k}>${v}</${k}>`)
        .join('\n')
      return `<tool name="${t.name}">\n  <description>${t.description}</description>\n${params ? `  <parameters>\n${params}\n  </parameters>` : ''}\n</tool>`
    })
    .join('\n\n')
}

export function getAgentSystemPrompt(): string {
  return `You are an AI agent that can use tools to help answer questions and complete tasks.

Available tools:
${getToolDescriptions()}

To use a tool, include a tool call in your response using this exact XML format:
<tool_call>
<name>tool_name</name>
<args>
<param_name>value</param_name>
</args>
</tool_call>

You can include multiple tool calls in one response. After receiving tool results, use them to provide a comprehensive answer.
If you don't need any tools, just respond normally.`
}
