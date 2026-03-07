/**
 * Workflow Automation Engine — Cron scheduler, webhook triggers,
 * conditional branching v2, loop nodes, human-in-the-loop
 */

export interface CronSchedule {
  id: string
  workflowId: string
  expression: string // simplified: 'daily:09:00' | 'weekly:mon:09:00' | 'hourly'
  enabled: boolean
  lastRun: string | null
  nextRun: string
  description: string
}

export interface WebhookTrigger {
  id: string
  workflowId: string
  source: 'slack' | 'github' | 'email' | 'custom'
  event: string
  secret: string
  url: string
  enabled: boolean
  lastTriggered: string | null
}

export interface ConditionalBranch {
  id: string
  condition: ConditionRule
  trueBranch: string // block ID
  falseBranch: string // block ID
}

export interface ConditionRule {
  type: 'contains' | 'sentiment' | 'length' | 'regex' | 'ai-classify'
  field: string
  operator: '==' | '!=' | '>' | '<' | 'contains' | 'matches'
  value: string
}

export interface LoopConfig {
  type: 'forEach' | 'while' | 'count'
  maxIterations: number
  source?: string // variable name for forEach
  condition?: ConditionRule // for while
  count?: number // for count
}

export interface HumanApproval {
  id: string
  workflowId: string
  blockId: string
  status: 'pending' | 'approved' | 'rejected'
  message: string
  requestedAt: string
  respondedAt: string | null
  respondedBy: string | null
}

/** Parse simplified cron expression to next run time */
export function getNextRunTime(expression: string, from: Date = new Date()): Date {
  const next = new Date(from)

  if (expression === 'hourly') {
    next.setHours(next.getHours() + 1, 0, 0, 0)
    return next
  }

  if (expression.startsWith('daily:')) {
    const [, time] = expression.split(':')
    const [hours, minutes] = (time + ':00').split(':').map(Number)
    next.setHours(hours, minutes, 0, 0)
    if (next <= from) next.setDate(next.getDate() + 1)
    return next
  }

  if (expression.startsWith('weekly:')) {
    const parts = expression.split(':')
    const dayMap: Record<string, number> = {
      sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
    }
    const targetDay = dayMap[parts[1]] ?? 1
    const hours = Number(parts[2]) || 9
    const minutes = Number(parts[3]) || 0

    next.setHours(hours, minutes, 0, 0)
    const currentDay = next.getDay()
    let daysUntil = targetDay - currentDay
    if (daysUntil < 0 || (daysUntil === 0 && next <= from)) daysUntil += 7
    next.setDate(next.getDate() + daysUntil)
    return next
  }

  // Default: next hour
  next.setHours(next.getHours() + 1, 0, 0, 0)
  return next
}

/** Evaluate a condition rule against input text */
export function evaluateCondition(rule: ConditionRule, input: string): boolean {
  switch (rule.type) {
    case 'contains':
      return input.toLowerCase().includes(rule.value.toLowerCase())

    case 'length':
      const len = input.length
      const target = Number(rule.value)
      switch (rule.operator) {
        case '>': return len > target
        case '<': return len < target
        case '==': return len === target
        case '!=': return len !== target
        default: return false
      }

    case 'regex':
      try {
        return new RegExp(rule.value, 'i').test(input)
      } catch {
        return false
      }

    case 'sentiment': {
      const positive = /좋|훌륭|excellent|great|good|긍정|만족|감사/i
      const negative = /나쁘|최악|bad|terrible|poor|부정|불만/i
      const isPositive = positive.test(input)
      const isNegative = negative.test(input)
      const sentiment = isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'
      return rule.operator === '==' ? sentiment === rule.value : sentiment !== rule.value
    }

    case 'ai-classify':
      // Placeholder: would call LLM for classification
      return input.toLowerCase().includes(rule.value.toLowerCase())

    default:
      return false
  }
}

/** Generate webhook URL for a trigger */
export function generateWebhookUrl(triggerId: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hchat-desktop.vercel.app'
  return `${baseUrl}/api/webhooks/${triggerId}`
}

/** Generate a secure webhook secret */
export function generateWebhookSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let secret = 'whsec_'
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return secret
}

/** Execute loop logic */
export function executeLoop(
  config: LoopConfig,
  items: string[],
  executor: (item: string, index: number) => string,
): string[] {
  const results: string[] = []
  const max = Math.min(config.maxIterations, 100) // safety limit

  switch (config.type) {
    case 'forEach':
      for (let i = 0; i < Math.min(items.length, max); i++) {
        results.push(executor(items[i], i))
      }
      break

    case 'count': {
      const count = Math.min(config.count ?? 1, max)
      for (let i = 0; i < count; i++) {
        results.push(executor(String(i), i))
      }
      break
    }

    case 'while': {
      let i = 0
      let currentInput = items[0] ?? ''
      while (i < max) {
        if (config.condition && !evaluateCondition(config.condition, currentInput)) break
        const result = executor(currentInput, i)
        results.push(result)
        currentInput = result
        i++
      }
      break
    }
  }

  return results
}

/** Export workflow as YAML-like string */
export function exportWorkflow(workflow: {
  name: string
  description: string
  trigger: string
  blocks: { type: string; config: Record<string, unknown> }[]
}): string {
  const lines = [
    `name: ${workflow.name}`,
    `description: ${workflow.description}`,
    `trigger: ${workflow.trigger}`,
    `blocks:`,
  ]

  for (const block of workflow.blocks) {
    lines.push(`  - type: ${block.type}`)
    for (const [key, value] of Object.entries(block.config)) {
      lines.push(`    ${key}: ${JSON.stringify(value)}`)
    }
  }

  return lines.join('\n')
}

/** Parse YAML-like workflow string */
export function importWorkflow(yaml: string): {
  name: string
  description: string
  trigger: string
} | null {
  const lines = yaml.split('\n').map((l) => l.trim())
  const name = lines.find((l) => l.startsWith('name:'))?.slice(5).trim()
  const description = lines.find((l) => l.startsWith('description:'))?.slice(12).trim()
  const trigger = lines.find((l) => l.startsWith('trigger:'))?.slice(8).trim()

  if (!name) return null

  return { name, description: description ?? '', trigger: trigger ?? 'manual' }
}
