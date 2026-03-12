// Agent tools that run locally in the browser

import { webSearch, formatSearchResults } from '../web-search'

export interface AgentTool {
  name: string
  description: string
  parameters: Record<string, string>
  execute: (args: Record<string, string>) => Promise<string>
  available: boolean
}

// Safe math calculator — recursive descent parser (no eval/Function)
function safeCalculate(expression: string): string {
  if (!expression || !expression.trim()) return 'Invalid expression'
  try {
    const result = evaluateMathExpression(expression)
    if (typeof result !== 'number' || !isFinite(result)) return 'Invalid result'
    return String(result)
  } catch {
    return 'Calculation error'
  }
}

function tokenizeMath(expr: string): string[] {
  const tokens: string[] = []
  let i = 0
  while (i < expr.length) {
    if (expr[i] === ' ') { i++; continue }
    if ('+-*/%^()'.includes(expr[i])) {
      tokens.push(expr[i])
      i++
    } else if (/[0-9.]/.test(expr[i])) {
      let num = ''
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        num += expr[i]
        i++
      }
      tokens.push(num)
    } else {
      throw new Error(`Invalid character: ${expr[i]}`)
    }
  }
  return tokens
}

function evaluateMathExpression(expr: string): number {
  const tokens = tokenizeMath(expr)
  let pos = 0

  function peek(): string | undefined { return tokens[pos] }
  function next(): string { return tokens[pos++] }

  function parseAddSub(): number {
    let result = parseMulDiv()
    while (peek() === '+' || peek() === '-') {
      const op = next()
      result = op === '+' ? result + parseMulDiv() : result - parseMulDiv()
    }
    return result
  }

  function parseMulDiv(): number {
    let result = parsePower()
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = next()
      const right = parsePower()
      if (op === '*') result *= right
      else if (op === '%') result %= right
      else {
        if (right === 0) throw new Error('Division by zero')
        result /= right
      }
    }
    return result
  }

  function parsePower(): number {
    const base = parseUnary()
    if (peek() === '^') {
      next()
      return Math.pow(base, parsePower())
    }
    return base
  }

  function parseUnary(): number {
    if (peek() === '-') { next(); return -parseAtom() }
    if (peek() === '+') { next() }
    return parseAtom()
  }

  function parseAtom(): number {
    if (peek() === '(') {
      next()
      const val = parseAddSub()
      if (peek() !== ')') throw new Error('Missing closing parenthesis')
      next()
      return val
    }
    const token = next()
    if (token === undefined) throw new Error('Unexpected end of expression')
    const num = Number(token)
    if (isNaN(num)) throw new Error(`Invalid token: ${token}`)
    return num
  }

  const result = parseAddSub()
  if (pos < tokens.length) throw new Error('Unexpected token after expression')
  return result
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
    description: 'Search the web for current information, news, facts, or any topic.',
    parameters: { query: 'The search query' },
    execute: async (args) => {
      try {
        const results = await webSearch(args.query ?? '', 5)
        return formatSearchResults(results)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Search failed'
        return `Web search error: ${message}`
      }
    },
    available: true,
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
