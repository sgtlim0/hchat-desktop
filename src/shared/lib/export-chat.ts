import type { Session, Message, ExportFormat } from '../types'
import { getTranslation } from '@/shared/i18n'
import { useSettingsStore } from '@/entities/settings/settings.store'

interface ExportData {
  session: Session
  messages: Message[]
}

export function exportToMarkdown(data: ExportData): string {
  const language = useSettingsStore.getState().language
  const t = getTranslation(language)
  const locale = language === 'ko' ? 'ko-KR' : 'en-US'

  const { session, messages } = data
  let content = `# ${session.title}\n\n`

  // Metadata
  content += `**${t('export.model')}:** ${session.modelId}\n`
  content += `**${t('export.createdAt')}:** ${new Date(session.createdAt).toLocaleString(locale)}\n`
  content += `**${t('export.updatedAt')}:** ${new Date(session.updatedAt).toLocaleString(locale)}\n`
  if (session.tags.length > 0) {
    content += `**${t('export.tags')}:** ${session.tags.join(', ')}\n`
  }
  content += '\n---\n\n'

  // Messages
  messages.forEach((msg) => {
    const role = msg.role === 'user' ? 'User' : 'Assistant'
    content += `## ${role}\n\n`

    msg.segments.forEach((segment) => {
      if (segment.type === 'text' && segment.content) {
        content += `${segment.content}\n\n`
      } else if (segment.type === 'tool' && segment.toolCalls) {
        segment.toolCalls.forEach((tool) => {
          content += `**Tool:** ${tool.toolName}\n`
          if (tool.args) {
            content += `**Args:**\n\`\`\`json\n${JSON.stringify(tool.args, null, 2)}\n\`\`\`\n`
          }
          if (tool.result) {
            content += `**Result:**\n\`\`\`\n${tool.result}\n\`\`\`\n`
          }
          content += '\n'
        })
      }
    })

    if (msg.attachments && msg.attachments.length > 0) {
      content += `**${t('export.attachments')}:**\n`
      msg.attachments.forEach((att) => {
        content += `- ![${att.name}](${att.url})\n`
      })
      content += '\n'
    }

    content += '---\n\n'
  })

  return content
}

export function exportToHtml(data: ExportData): string {
  const language = useSettingsStore.getState().language
  const t = getTranslation(language)
  const locale = language === 'ko' ? 'ko-KR' : 'en-US'
  const { session, messages } = data

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(session.title)}</title>
  <style>
    :root {
      --bg-page: #ffffff;
      --bg-card: #f9fafb;
      --text-primary: #111827;
      --text-secondary: #6b7280;
      --border: #e5e7eb;
      --primary: #6366f1;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg-page: #0f172a;
        --bg-card: #1e293b;
        --text-primary: #f1f5f9;
        --text-secondary: #94a3b8;
        --border: #334155;
        --primary: #818cf8;
      }
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--bg-page);
      color: var(--text-primary);
      line-height: 1.6;
      padding: 2rem;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid var(--border);
    }
    .header h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    .metadata {
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.8;
    }
    .message {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background-color: var(--bg-card);
      border-radius: 0.5rem;
      border: 1px solid var(--border);
    }
    .message-role {
      font-weight: 600;
      font-size: 0.875rem;
      text-transform: uppercase;
      color: var(--primary);
      margin-bottom: 0.75rem;
    }
    .message-content {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .tool-call {
      background-color: var(--bg-page);
      padding: 1rem;
      border-radius: 0.375rem;
      margin-top: 0.75rem;
      font-family: monospace;
      font-size: 0.875rem;
    }
    .tool-call strong {
      color: var(--primary);
    }
    .attachments {
      margin-top: 1rem;
    }
    .attachments img {
      max-width: 100%;
      border-radius: 0.375rem;
      margin-top: 0.5rem;
    }
    pre {
      background-color: var(--bg-page);
      padding: 0.75rem;
      border-radius: 0.375rem;
      overflow-x: auto;
      margin: 0.5rem 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${escapeHtml(session.title)}</h1>
      <div class="metadata">
        <div><strong>${t('export.model')}:</strong> ${escapeHtml(session.modelId)}</div>
        <div><strong>${t('export.createdAt')}:</strong> ${new Date(session.createdAt).toLocaleString(locale)}</div>
        <div><strong>${t('export.updatedAt')}:</strong> ${new Date(session.updatedAt).toLocaleString(locale)}</div>
        ${session.tags.length > 0 ? `<div><strong>${t('export.tags')}:</strong> ${session.tags.map(escapeHtml).join(', ')}</div>` : ''}
      </div>
    </div>

    <div class="messages">
      ${messages.map((msg) => {
        const role = msg.role === 'user' ? 'User' : 'Assistant'
        let content = ''

        msg.segments.forEach((segment) => {
          if (segment.type === 'text' && segment.content) {
            content += `<div class="message-content">${escapeHtml(segment.content)}</div>`
          } else if (segment.type === 'tool' && segment.toolCalls) {
            segment.toolCalls.forEach((tool) => {
              content += `<div class="tool-call">
                <div><strong>Tool:</strong> ${escapeHtml(tool.toolName)}</div>
                ${tool.args ? `<div><strong>Args:</strong><pre>${escapeHtml(JSON.stringify(tool.args, null, 2))}</pre></div>` : ''}
                ${tool.result ? `<div><strong>Result:</strong><pre>${escapeHtml(tool.result)}</pre></div>` : ''}
              </div>`
            })
          }
        })

        if (msg.attachments && msg.attachments.length > 0) {
          content += '<div class="attachments">'
          msg.attachments.forEach((att) => {
            content += `<img src="${escapeHtml(att.url)}" alt="${escapeHtml(att.name)}" />`
          })
          content += '</div>'
        }

        return `<div class="message">
          <div class="message-role">${role}</div>
          ${content}
        </div>`
      }).join('\n')}
    </div>
  </div>
</body>
</html>`

  return html
}

export function exportToJson(data: ExportData): string {
  return JSON.stringify({ session: data.session, messages: data.messages }, null, 2)
}

export function exportToTxt(data: ExportData): string {
  const language = useSettingsStore.getState().language
  const t = getTranslation(language)
  const locale = language === 'ko' ? 'ko-KR' : 'en-US'
  const { session, messages } = data
  let content = `${session.title}\n`
  content += `${'='.repeat(session.title.length)}\n\n`

  content += `${t('export.model')}: ${session.modelId}\n`
  content += `${t('export.createdAt')}: ${new Date(session.createdAt).toLocaleString(locale)}\n`
  content += `${t('export.updatedAt')}: ${new Date(session.updatedAt).toLocaleString(locale)}\n`
  if (session.tags.length > 0) {
    content += `${t('export.tags')}: ${session.tags.join(', ')}\n`
  }
  content += '\n' + '-'.repeat(80) + '\n\n'

  messages.forEach((msg) => {
    const role = msg.role === 'user' ? 'User' : 'Assistant'
    content += `${role}:\n`

    msg.segments.forEach((segment) => {
      if (segment.type === 'text' && segment.content) {
        content += `${segment.content}\n`
      } else if (segment.type === 'tool' && segment.toolCalls) {
        segment.toolCalls.forEach((tool) => {
          content += `[Tool: ${tool.toolName}]\n`
          if (tool.args) {
            content += `Args: ${JSON.stringify(tool.args)}\n`
          }
          if (tool.result) {
            content += `Result: ${tool.result}\n`
          }
        })
      }
    })

    if (msg.attachments && msg.attachments.length > 0) {
      content += `${t('export.attachments')}:\n`
      msg.attachments.forEach((att) => {
        content += `  - ${att.name} (${att.url})\n`
      })
    }

    content += '\n' + '-'.repeat(80) + '\n\n'
  })

  return content
}

export async function exportToPdf(data: ExportData): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const language = useSettingsStore.getState().language
  const t = getTranslation(language)
  const locale = language === 'ko' ? 'ko-KR' : 'en-US'
  const { session, messages } = data

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  const maxWidth = pageWidth - margin * 2
  let yPosition = 20

  // Helper function to add text with word wrapping and page break
  const addText = (text: string, fontSize = 10, isBold = false) => {
    doc.setFontSize(fontSize)
    if (isBold) {
      doc.setFont('helvetica', 'bold')
    } else {
      doc.setFont('helvetica', 'normal')
    }

    const lines = doc.splitTextToSize(text, maxWidth)
    const lineHeight = fontSize * 0.5

    lines.forEach((line: string) => {
      // Check if we need a new page
      if (yPosition + lineHeight > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage()
        yPosition = 20
      }
      doc.text(line, margin, yPosition)
      yPosition += lineHeight
    })
  }

  // Header: Session title
  addText(session.title, 16, true)
  yPosition += 5

  // Metadata
  addText(`${t('export.model')}: ${session.modelId}`, 10, false)
  addText(`${t('export.createdAt')}: ${new Date(session.createdAt).toLocaleString(locale)}`, 10, false)
  addText(`${t('export.updatedAt')}: ${new Date(session.updatedAt).toLocaleString(locale)}`, 10, false)
  if (session.tags.length > 0) {
    addText(`${t('export.tags')}: ${session.tags.join(', ')}`, 10, false)
  }
  yPosition += 10

  // Messages
  messages.forEach((msg) => {
    const role = msg.role === 'user' ? 'User' : 'Assistant'
    addText(role, 12, true)
    yPosition += 2

    msg.segments.forEach((segment) => {
      if (segment.type === 'text' && segment.content) {
        addText(segment.content, 10, false)
      } else if (segment.type === 'tool' && segment.toolCalls) {
        segment.toolCalls.forEach((tool) => {
          addText(`[Tool: ${tool.toolName}]`, 10, false)
          if (tool.args) {
            addText(`Args: ${JSON.stringify(tool.args)}`, 9, false)
          }
          if (tool.result) {
            addText(`Result: ${tool.result}`, 9, false)
          }
        })
      }
    })

    if (msg.attachments && msg.attachments.length > 0) {
      addText(`${t('export.attachments')}:`, 10, true)
      msg.attachments.forEach((att) => {
        addText(`- ${att.name}`, 9, false)
      })
    }

    yPosition += 8
  })

  // Download
  const sanitizedTitle = session.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')
  doc.save(`${sanitizedTitle}.pdf`)
}

export function downloadExport(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportChat(data: ExportData, format: ExportFormat): Promise<void> {
  // Handle PDF separately since it doesn't use the standard download flow
  if (format === 'pdf') {
    await exportToPdf(data)
    return
  }

  const sanitizedTitle = data.session.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')
  let content: string
  let filename: string
  let mimeType: string

  switch (format) {
    case 'markdown':
      content = exportToMarkdown(data)
      filename = `${sanitizedTitle}.md`
      mimeType = 'text/markdown'
      break
    case 'html':
      content = exportToHtml(data)
      filename = `${sanitizedTitle}.html`
      mimeType = 'text/html'
      break
    case 'json':
      content = exportToJson(data)
      filename = `${sanitizedTitle}.json`
      mimeType = 'application/json'
      break
    case 'txt':
      content = exportToTxt(data)
      filename = `${sanitizedTitle}.txt`
      mimeType = 'text/plain'
      break
  }

  downloadExport(content, filename, mimeType)
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
