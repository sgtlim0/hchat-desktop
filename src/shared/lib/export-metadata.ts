export interface ExportMetadata {
  appName: string
  appVersion: string
  exportedAt: string
  sessionCount: number
  messageCount: number
  format: 'json' | 'markdown' | 'html' | 'txt'
  includesAttachments: boolean
}

export function createExportMetadata(
  sessionCount: number,
  messageCount: number,
  format: ExportMetadata['format'],
  includesAttachments = false,
): ExportMetadata {
  return {
    appName: 'H Chat Desktop',
    appVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    sessionCount,
    messageCount,
    format,
    includesAttachments,
  }
}

export function formatMetadataHeader(meta: ExportMetadata): string {
  return [
    `# Export from ${meta.appName}`,
    `- Exported: ${new Date(meta.exportedAt).toLocaleString()}`,
    `- Sessions: ${meta.sessionCount}`,
    `- Messages: ${meta.messageCount}`,
    `- Format: ${meta.format}`,
    '',
  ].join('\n')
}

export function formatMetadataJson(meta: ExportMetadata): string {
  return JSON.stringify({ _metadata: meta }, null, 2)
}
