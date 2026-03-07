/**
 * Phase 34: Advanced Agent System — ReAct v2 loop,
 * tool registry, agent chains, safety guards.
 */

export interface AgentTool {
  id: string
  name: string
  description: string
  parameters: ToolParameter[]
  execute: (params: Record<string, unknown>) => Promise<string>
  category: 'search' | 'memory' | 'file' | 'code' | 'calendar' | 'database' | 'custom'
}

export interface ToolParameter {
  name: string
  type: 'string' | 'number' | 'boolean'
  required: boolean
  description: string
}

export interface AgentStep {
  id: string
  type: 'think' | 'act' | 'observe' | 'reflect'
  content: string
  toolName?: string
  toolParams?: Record<string, unknown>
  toolResult?: string
  timestamp: string
}

export interface AgentExecution {
  id: string
  goal: string
  steps: AgentStep[]
  status: 'running' | 'completed' | 'failed' | 'paused'
  totalCost: number
  startedAt: string
  completedAt: string | null
}

export interface SafetyGuard {
  maxSteps: number
  maxCostUsd: number
  requireApproval: boolean
  blockedActions: string[]
}

const DEFAULT_GUARDS: SafetyGuard = {
  maxSteps: 20,
  maxCostUsd: 1.0,
  requireApproval: false,
  blockedActions: ['delete_all', 'send_email', 'execute_code'],
}

// Tool Registry
const toolRegistry = new Map<string, AgentTool>()

/** Register a tool in the registry */
export function registerTool(tool: AgentTool): void {
  toolRegistry.set(tool.id, tool)
}

/** Unregister a tool */
export function unregisterTool(id: string): boolean {
  return toolRegistry.delete(id)
}

/** Get all registered tools */
export function getRegisteredTools(): AgentTool[] {
  return [...toolRegistry.values()]
}

/** Get tool by ID */
export function getTool(id: string): AgentTool | undefined {
  return toolRegistry.get(id)
}

/** Check if action is allowed by safety guards */
export function isActionAllowed(action: string, guards: SafetyGuard = DEFAULT_GUARDS): boolean {
  return !guards.blockedActions.includes(action)
}

/** Check if execution should stop (budget/step limits) */
export function shouldStop(
  execution: AgentExecution,
  guards: SafetyGuard = DEFAULT_GUARDS,
): { stop: boolean; reason?: string } {
  if (execution.steps.length >= guards.maxSteps) {
    return { stop: true, reason: `최대 단계 수(${guards.maxSteps}) 초과` }
  }
  if (execution.totalCost >= guards.maxCostUsd) {
    return { stop: true, reason: `비용 한도($${guards.maxCostUsd}) 초과` }
  }
  return { stop: false }
}

/** Create a new agent execution */
export function createExecution(goal: string): AgentExecution {
  return {
    id: `exec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    goal,
    steps: [],
    status: 'running',
    totalCost: 0,
    startedAt: new Date().toISOString(),
    completedAt: null,
  }
}

/** Add a step to execution */
export function addStep(
  execution: AgentExecution,
  step: Omit<AgentStep, 'id' | 'timestamp'>,
): AgentExecution {
  return {
    ...execution,
    steps: [
      ...execution.steps,
      {
        ...step,
        id: `step-${execution.steps.length}`,
        timestamp: new Date().toISOString(),
      },
    ],
  }
}

/** Complete an execution */
export function completeExecution(
  execution: AgentExecution,
  status: 'completed' | 'failed' = 'completed',
): AgentExecution {
  return {
    ...execution,
    status,
    completedAt: new Date().toISOString(),
  }
}

/** Format tool list for LLM system prompt */
export function formatToolsForPrompt(): string {
  const tools = getRegisteredTools()
  if (tools.length === 0) return '사용 가능한 도구가 없습니다.'

  return tools
    .map((t) => {
      const params = t.parameters
        .map((p) => `  - ${p.name} (${p.type}${p.required ? ', 필수' : ''}): ${p.description}`)
        .join('\n')
      return `### ${t.name}\n${t.description}\n매개변수:\n${params}`
    })
    .join('\n\n')
}

/** Parse tool call from LLM output (XML format) */
export function parseToolCall(text: string): {
  toolName: string
  params: Record<string, string>
} | null {
  const toolMatch = text.match(/<tool_use>\s*<name>(.*?)<\/name>([\s\S]*?)<\/tool_use>/)
  if (!toolMatch) return null

  const toolName = toolMatch[1].trim()
  const paramsBlock = toolMatch[2]
  const params: Record<string, string> = {}

  const paramRegex = /<(\w+)>([\s\S]*?)<\/\1>/g
  let match: RegExpExecArray | null
  while ((match = paramRegex.exec(paramsBlock)) !== null) {
    if (match[1] !== 'name') {
      params[match[1]] = match[2].trim()
    }
  }

  return { toolName, params }
}

// Register built-in tools
registerTool({
  id: 'search',
  name: '웹 검색',
  description: '인터넷에서 정보를 검색합니다.',
  parameters: [{ name: 'query', type: 'string', required: true, description: '검색 쿼리' }],
  execute: async (params) => `검색 결과: "${params.query}"에 대한 결과 3건`,
  category: 'search',
})

registerTool({
  id: 'memory_read',
  name: '메모리 조회',
  description: '저장된 기억을 조회합니다.',
  parameters: [{ name: 'topic', type: 'string', required: true, description: '주제' }],
  execute: async (params) => `메모리: "${params.topic}" 관련 기억 없음`,
  category: 'memory',
})

registerTool({
  id: 'memory_save',
  name: '메모리 저장',
  description: '새로운 정보를 기억에 저장합니다.',
  parameters: [
    { name: 'key', type: 'string', required: true, description: '키' },
    { name: 'value', type: 'string', required: true, description: '값' },
  ],
  execute: async (params) => `저장 완료: ${params.key}`,
  category: 'memory',
})
