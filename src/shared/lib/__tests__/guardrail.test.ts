import { describe, it, expect } from 'vitest'
import { detectSensitiveData, maskSensitiveData, getDetectionLabel } from '../guardrail'

describe('detectSensitiveData', () => {
  it('detects email addresses', () => {
    const text = 'Contact us at support@example.com or info@company.co.kr'
    const detections = detectSensitiveData(text)

    expect(detections).toHaveLength(2)
    expect(detections[0].type).toBe('email')
    expect(detections[0].value).toBe('support@example.com')
    expect(detections[1].type).toBe('email')
    expect(detections[1].value).toBe('info@company.co.kr')
  })

  it('detects Korean phone numbers', () => {
    const text = 'Call me at 010-1234-5678 or 02-123-4567'
    const detections = detectSensitiveData(text)

    expect(detections).toHaveLength(2)
    expect(detections[0].type).toBe('phone')
    expect(detections[0].value).toBe('010-1234-5678')
    expect(detections[1].type).toBe('phone')
    expect(detections[1].value).toBe('02-123-4567')
  })

  it('detects Korean SSN format', () => {
    const text = 'SSN: 901231-1234567'
    const detections = detectSensitiveData(text)

    expect(detections).toHaveLength(1)
    expect(detections[0].type).toBe('ssn')
    expect(detections[0].value).toBe('901231-1234567')
  })

  it('detects credit card numbers', () => {
    const text = 'Card: 1234-5678-9012-3456 or 1234567890123456'
    const detections = detectSensitiveData(text)

    expect(detections.length).toBeGreaterThanOrEqual(2)
    const creditCards = detections.filter(d => d.type === 'creditCard')
    expect(creditCards.length).toBeGreaterThanOrEqual(1)
    expect(creditCards[0].value).toMatch(/\d{4}/)
  })

  it('detects API keys with sk- prefix', () => {
    const text = 'API key: sk-abcdefghijklmnopqrstuvwxyz'
    const detections = detectSensitiveData(text)

    const apiKeys = detections.filter(d => d.type === 'apiKey')
    expect(apiKeys).toHaveLength(1)
    expect(apiKeys[0].value).toBe('sk-abcdefghijklmnopqrstuvwxyz')
  })

  it('detects API keys with pk_ prefix', () => {
    const text = 'Public key: pk_1234567890abcdefghij123'
    const detections = detectSensitiveData(text)

    expect(detections).toHaveLength(1)
    expect(detections[0].type).toBe('apiKey')
    expect(detections[0].value).toBe('pk_1234567890abcdefghij123')
  })

  it('detects AWS API keys with AKIA prefix', () => {
    const text = 'AWS: AKIAIOSFODNN7EXAMPLE12345'
    const detections = detectSensitiveData(text)

    expect(detections).toHaveLength(1)
    expect(detections[0].type).toBe('apiKey')
    expect(detections[0].value).toBe('AKIAIOSFODNN7EXAMPLE12345')
  })

  it('returns empty array for safe text', () => {
    const text = 'This is just a normal message without any sensitive data.'
    const detections = detectSensitiveData(text)

    expect(detections).toHaveLength(0)
  })

  it('detects multiple types of sensitive data', () => {
    const text = 'Email: test@example.com, Phone: 010-1234-5678, SSN: 900101-1234567'
    const detections = detectSensitiveData(text)

    expect(detections.length).toBeGreaterThanOrEqual(3)
    expect(detections.some(d => d.type === 'email')).toBe(true)
    expect(detections.some(d => d.type === 'phone')).toBe(true)
    expect(detections.some(d => d.type === 'ssn')).toBe(true)
  })

  it('sorts detections by index position', () => {
    const text = 'Phone: 010-1234-5678, Email: test@example.com'
    const detections = detectSensitiveData(text)

    expect(detections.length).toBeGreaterThanOrEqual(2)
    expect(detections[0].index).toBeLessThan(detections[1].index)
  })
})

describe('maskSensitiveData', () => {
  it('masks email addresses with first 3 chars + *** + last 2 chars', () => {
    const text = 'Contact: support@example.com'
    const masked = maskSensitiveData(text)

    expect(masked).toContain('sup***om')
    expect(masked).not.toContain('support@example.com')
  })

  it('masks phone numbers correctly', () => {
    const text = 'Call: 010-1234-5678'
    const masked = maskSensitiveData(text)

    expect(masked).toContain('010***78')
    expect(masked).not.toContain('010-1234-5678')
  })

  it('masks SSN correctly', () => {
    const text = 'SSN: 901231-1234567'
    const masked = maskSensitiveData(text)

    expect(masked).toContain('901***67')
    expect(masked).not.toContain('901231-1234567')
  })

  it('masks API keys correctly', () => {
    const text = 'Key: sk-abcdefghijklmnopqrstuvwxyz'
    const masked = maskSensitiveData(text)

    expect(masked).toContain('sk-***yz')
    expect(masked).not.toContain('sk-abcdefghijklmnopqrstuvwxyz')
  })

  it('masks multiple sensitive items', () => {
    const text = 'Email: test@example.com, Phone: 010-1234-5678'
    const masked = maskSensitiveData(text)

    expect(masked).toContain('***')
    expect(masked).not.toContain('test@example.com')
    expect(masked).not.toContain('010-1234-5678')
  })

  it('preserves text without sensitive data', () => {
    const text = 'This is a safe message'
    const masked = maskSensitiveData(text)

    expect(masked).toBe(text)
  })

  it('handles credit card masking', () => {
    const text = 'Card: 1234-5678-9012-3456'
    const masked = maskSensitiveData(text)

    expect(masked).toContain('123***56')
    expect(masked).not.toContain('1234-5678-9012-3456')
  })

  it('processes detections in reverse order to preserve indices', () => {
    const text = 'First: test@example.com, Second: admin@test.com'
    const masked = maskSensitiveData(text)

    // Both should be masked
    expect(masked).not.toContain('test@example.com')
    expect(masked).not.toContain('admin@test.com')
    expect(masked.split('***').length - 1).toBe(2)
  })
})

describe('getDetectionLabel', () => {
  it('returns Email for email type', () => {
    expect(getDetectionLabel('email')).toBe('Email')
  })

  it('returns Phone for phone type', () => {
    expect(getDetectionLabel('phone')).toBe('Phone')
  })

  it('returns SSN for ssn type', () => {
    expect(getDetectionLabel('ssn')).toBe('SSN')
  })

  it('returns Credit Card for creditCard type', () => {
    expect(getDetectionLabel('creditCard')).toBe('Credit Card')
  })

  it('returns API Key for apiKey type', () => {
    expect(getDetectionLabel('apiKey')).toBe('API Key')
  })

  it('returns the type itself for unknown types', () => {
    expect(getDetectionLabel('unknown')).toBe('unknown')
    expect(getDetectionLabel('customType')).toBe('customType')
  })
})
