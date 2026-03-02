import { describe, it, expect } from 'vitest'
import { formatBytes } from '../storage-analyzer'

describe('storage-analyzer', () => {
  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B')
      expect(formatBytes(512)).toBe('512 B')
      expect(formatBytes(1024)).toBe('1.0 KB')
      expect(formatBytes(1536)).toBe('1.5 KB')
      expect(formatBytes(1024 * 1024)).toBe('1.0 MB')
      expect(formatBytes(1024 * 1024 * 1.5)).toBe('1.5 MB')
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB')
    })

    it('should handle large numbers', () => {
      const result = formatBytes(5 * 1024 * 1024 * 1024)
      expect(result).toContain('GB')
      expect(result).toContain('5')
    })

    it('should handle edge cases', () => {
      expect(formatBytes(1023)).toBe('1023 B')
      expect(formatBytes(1025)).toBe('1.0 KB')
    })
  })
})
