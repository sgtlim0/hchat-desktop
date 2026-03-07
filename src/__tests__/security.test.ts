import { describe, it, expect } from 'vitest'
import {
  detectPII,
  redactPII,
  isExpired,
  getExpiredItems,
  generateComplianceReport,
} from '@/shared/lib/security'

describe('security', () => {
  describe('detectPII', () => {
    it('should detect email addresses', () => {
      const matches = detectPII('연락처: user@example.com 입니다')
      expect(matches.length).toBeGreaterThan(0)
      expect(matches[0].type).toBe('email')
      expect(matches[0].value).toBe('user@example.com')
    })

    it('should detect Korean phone numbers', () => {
      const matches = detectPII('전화번호 010-1234-5678')
      expect(matches.some((m) => m.type === 'phone')).toBe(true)
    })

    it('should detect credit card numbers', () => {
      const matches = detectPII('카드번호 1234-5678-9012-3456')
      expect(matches.some((m) => m.type === 'credit-card')).toBe(true)
    })

    it('should detect IP addresses', () => {
      const matches = detectPII('서버 IP: 192.168.1.100')
      expect(matches.some((m) => m.type === 'ip-address')).toBe(true)
    })

    it('should detect Korean RRN', () => {
      const matches = detectPII('주민번호 901231-1234567')
      expect(matches.some((m) => m.type === 'korean-rrn')).toBe(true)
    })

    it('should detect password patterns', () => {
      const matches = detectPII('비밀번호: mySecret123')
      expect(matches.some((m) => m.type === 'name-pattern')).toBe(true)
    })

    it('should detect API key patterns', () => {
      const matches = detectPII('api_key=sk-proj-abc123')
      expect(matches.some((m) => m.type === 'name-pattern')).toBe(true)
    })

    it('should return empty for clean text', () => {
      const matches = detectPII('안녕하세요. 좋은 하루 보내세요.')
      expect(matches).toEqual([])
    })

    it('should detect multiple PII in one text', () => {
      const matches = detectPII('이메일: a@b.com, 전화: 010-1111-2222')
      expect(matches.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('redactPII', () => {
    it('should redact detected PII', () => {
      const text = '메일은 user@test.com 이고 번호는 010-1234-5678 입니다'
      const redacted = redactPII(text)
      expect(redacted).toContain('[EMAIL_REDACTED]')
      expect(redacted).toContain('[PHONE_REDACTED]')
      expect(redacted).not.toContain('user@test.com')
    })

    it('should preserve non-PII text', () => {
      const text = '오늘 날씨가 좋습니다'
      expect(redactPII(text)).toBe(text)
    })
  })

  describe('retention', () => {
    it('should detect expired items', () => {
      const old = new Date()
      old.setDate(old.getDate() - 100)
      expect(isExpired(old.toISOString(), 90)).toBe(true)
    })

    it('should not flag fresh items', () => {
      expect(isExpired(new Date().toISOString(), 90)).toBe(false)
    })

    it('should filter expired items from list', () => {
      const old = new Date()
      old.setDate(old.getDate() - 100)
      const items = [
        { id: '1', createdAt: old.toISOString() },
        { id: '2', createdAt: new Date().toISOString() },
      ]
      const expired = getExpiredItems(items, 90)
      expect(expired).toHaveLength(1)
      expect(expired[0].id).toBe('1')
    })
  })

  describe('generateComplianceReport', () => {
    it('should generate report with PII findings', () => {
      const report = generateComplianceReport({
        conversations: [{ createdAt: new Date().toISOString() }],
        messages: [
          { content: '이메일은 test@test.com 입니다', createdAt: new Date().toISOString() },
        ],
        retentionPolicy: null,
      })

      expect(report.piiDetections).toBeGreaterThan(0)
      expect(report.findings.some((f) => f.category === 'PII Exposure')).toBe(true)
    })

    it('should flag missing retention policy', () => {
      const report = generateComplianceReport({
        conversations: [],
        messages: [],
        retentionPolicy: null,
      })

      expect(report.findings.some((f) => f.category === 'Data Retention')).toBe(true)
    })

    it('should detect retention violations', () => {
      const old = new Date()
      old.setDate(old.getDate() - 100)

      const report = generateComplianceReport({
        conversations: [{ createdAt: old.toISOString() }],
        messages: [],
        retentionPolicy: {
          id: 'p1', name: '90일 정책', maxAgeDays: 90,
          dataTypes: ['conversations'], enabled: true, lastEnforced: null,
        },
      })

      expect(report.retentionCompliant).toBe(false)
    })

    it('should pass when retention is compliant', () => {
      const report = generateComplianceReport({
        conversations: [{ createdAt: new Date().toISOString() }],
        messages: [{ content: '일반 텍스트', createdAt: new Date().toISOString() }],
        retentionPolicy: {
          id: 'p1', name: '90일', maxAgeDays: 90,
          dataTypes: ['conversations'], enabled: true, lastEnforced: null,
        },
      })

      expect(report.retentionCompliant).toBe(true)
      expect(report.piiDetections).toBe(0)
    })
  })
})
