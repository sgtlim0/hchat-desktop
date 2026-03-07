/**
 * Enterprise Security — PII detection, data retention,
 * encryption utilities, compliance reporting.
 */

export interface PIIMatch {
  type: PIIType
  value: string
  startIndex: number
  endIndex: number
  confidence: number
}

export type PIIType =
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit-card'
  | 'ip-address'
  | 'korean-rrn'
  | 'passport'
  | 'name-pattern'

export interface RetentionPolicy {
  id: string
  name: string
  maxAgeDays: number
  dataTypes: ('conversations' | 'messages' | 'files' | 'audit-logs')[]
  enabled: boolean
  lastEnforced: string | null
}

export interface ComplianceReport {
  generatedAt: string
  totalConversations: number
  totalMessages: number
  piiDetections: number
  encryptedItems: number
  retentionCompliant: boolean
  findings: ComplianceFinding[]
}

export interface ComplianceFinding {
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: string
  description: string
  recommendation: string
}

const PII_PATTERNS: Record<PIIType, RegExp> = {
  'email': /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  'phone': /(?:\+82|010|011|016|017|018|019)[-.\s]?\d{3,4}[-.\s]?\d{4}/g,
  'ssn': /\d{3}-\d{2}-\d{4}/g,
  'credit-card': /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g,
  'ip-address': /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  'korean-rrn': /\d{6}[-\s]?\d{7}/g,
  'passport': /[A-Z]{1,2}\d{7,8}/g,
  'name-pattern': /(?:주민등록번호|비밀번호|password|secret|api[_-]?key)\s*[:=]\s*\S+/gi,
}

/** Detect PII in text */
export function detectPII(text: string): PIIMatch[] {
  const matches: PIIMatch[] = []

  for (const [type, pattern] of Object.entries(PII_PATTERNS) as [PIIType, RegExp][]) {
    const regex = new RegExp(pattern.source, pattern.flags)
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        type,
        value: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence: type === 'name-pattern' ? 0.9 : 0.95,
      })
    }
  }

  return matches.sort((a, b) => a.startIndex - b.startIndex)
}

/** Redact PII from text */
export function redactPII(text: string, matches?: PIIMatch[]): string {
  const piiMatches = matches ?? detectPII(text)
  if (piiMatches.length === 0) return text

  let result = text
  // Process from end to preserve indices
  const sorted = [...piiMatches].sort((a, b) => b.startIndex - a.startIndex)

  for (const match of sorted) {
    const replacement = `[${match.type.toUpperCase()}_REDACTED]`
    result = result.slice(0, match.startIndex) + replacement + result.slice(match.endIndex)
  }

  return result
}

/** Check if data exceeds retention policy */
export function isExpired(createdAt: string, maxAgeDays: number): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays > maxAgeDays
}

/** Get items that should be deleted per retention policy */
export function getExpiredItems<T extends { createdAt: string }>(
  items: T[],
  maxAgeDays: number,
): T[] {
  return items.filter((item) => isExpired(item.createdAt, maxAgeDays))
}

/** Generate compliance report */
export function generateComplianceReport(data: {
  conversations: { createdAt: string }[]
  messages: { content: string; createdAt: string }[]
  retentionPolicy: RetentionPolicy | null
}): ComplianceReport {
  const { conversations, messages, retentionPolicy } = data
  const findings: ComplianceFinding[] = []

  // Scan messages for PII
  let piiDetections = 0
  for (const msg of messages) {
    const pii = detectPII(msg.content)
    piiDetections += pii.length
  }

  if (piiDetections > 0) {
    findings.push({
      severity: 'high',
      category: 'PII Exposure',
      description: `${piiDetections}건의 개인 식별 정보가 메시지에서 감지되었습니다.`,
      recommendation: 'PII 자동 감지 및 마스킹 활성화를 권장합니다.',
    })
  }

  // Check retention compliance
  let retentionCompliant = true
  if (retentionPolicy?.enabled) {
    const expired = getExpiredItems(conversations, retentionPolicy.maxAgeDays)
    if (expired.length > 0) {
      retentionCompliant = false
      findings.push({
        severity: 'medium',
        category: 'Data Retention',
        description: `${expired.length}건의 대화가 보존 기한(${retentionPolicy.maxAgeDays}일)을 초과했습니다.`,
        recommendation: '자동 삭제 정책을 실행하세요.',
      })
    }
  } else {
    findings.push({
      severity: 'low',
      category: 'Data Retention',
      description: '데이터 보존 정책이 설정되지 않았습니다.',
      recommendation: '조직 보안 정책에 따라 보존 기한을 설정하세요.',
    })
  }

  // Check encryption
  if (typeof window !== 'undefined' && !window.crypto?.subtle) {
    findings.push({
      severity: 'critical',
      category: 'Encryption',
      description: 'Web Crypto API를 사용할 수 없습니다.',
      recommendation: 'HTTPS 환경에서 실행하세요.',
    })
  }

  return {
    generatedAt: new Date().toISOString(),
    totalConversations: conversations.length,
    totalMessages: messages.length,
    piiDetections,
    encryptedItems: 0, // placeholder
    retentionCompliant,
    findings,
  }
}
