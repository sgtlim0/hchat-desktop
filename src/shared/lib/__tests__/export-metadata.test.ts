import { describe, it, expect } from 'vitest'
import { createExportMetadata, formatMetadataHeader, formatMetadataJson } from '../export-metadata'

describe('export-metadata', () => {
  it('creates metadata with correct fields', () => {
    const meta = createExportMetadata(3, 50, 'json')
    expect(meta.appName).toBe('H Chat Desktop')
    expect(meta.sessionCount).toBe(3)
    expect(meta.messageCount).toBe(50)
    expect(meta.format).toBe('json')
    expect(meta.includesAttachments).toBe(false)
  })

  it('includes timestamp', () => {
    const meta = createExportMetadata(1, 10, 'markdown')
    expect(new Date(meta.exportedAt).getTime()).toBeGreaterThan(0)
  })

  it('supports attachments flag', () => {
    const meta = createExportMetadata(1, 5, 'html', true)
    expect(meta.includesAttachments).toBe(true)
  })

  it('formatMetadataHeader returns markdown', () => {
    const meta = createExportMetadata(2, 20, 'markdown')
    const header = formatMetadataHeader(meta)
    expect(header).toContain('H Chat Desktop')
    expect(header).toContain('Sessions: 2')
    expect(header).toContain('Messages: 20')
  })

  it('formatMetadataJson returns valid JSON', () => {
    const meta = createExportMetadata(1, 5, 'json')
    const json = formatMetadataJson(meta)
    const parsed = JSON.parse(json)
    expect(parsed._metadata.appName).toBe('H Chat Desktop')
  })
})
