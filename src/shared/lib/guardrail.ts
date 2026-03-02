// AI Guardrail — Sensitive data detection and masking

export interface Detection {
  type: string
  value: string
  index: number
}

const PATTERNS: Record<string, RegExp> = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /\d{2,3}-\d{3,4}-\d{4}/g,
  ssn: /\d{6}-[1-4]\d{6}/g,
  creditCard: /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g,
  apiKey: /(sk-|pk_|AKIA)[a-zA-Z0-9]{20,}/g,
}

export function detectSensitiveData(text: string): Detection[] {
  const detections: Detection[] = []

  for (const [type, pattern] of Object.entries(PATTERNS)) {
    const regex = new RegExp(pattern.source, pattern.flags)
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      detections.push({
        type,
        value: match[0],
        index: match.index,
      })
    }
  }

  return detections.sort((a, b) => a.index - b.index)
}

export function maskSensitiveData(text: string): string {
  let result = text
  const detections = detectSensitiveData(text)

  // Process in reverse order to preserve indices
  for (let i = detections.length - 1; i >= 0; i--) {
    const d = detections[i]
    const masked = d.value.slice(0, 3) + '***' + d.value.slice(-2)
    result = result.slice(0, d.index) + masked + result.slice(d.index + d.value.length)
  }

  return result
}

export function getDetectionLabel(type: string): string {
  const labels: Record<string, string> = {
    email: 'Email',
    phone: 'Phone',
    ssn: 'SSN',
    creditCard: 'Credit Card',
    apiKey: 'API Key',
  }
  return labels[type] ?? type
}
