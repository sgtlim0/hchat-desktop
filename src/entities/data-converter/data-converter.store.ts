import { create } from 'zustand'
import type { DataFormat, ConversionHistory } from '@/shared/types'
import { getAllConversionHistory, putConversionHistory, clearConversionHistory } from '@/shared/lib/db'

interface DataConverterState {
  sourceContent: string
  targetContent: string
  sourceFormat: DataFormat
  targetFormat: DataFormat
  history: ConversionHistory[]
  error: string | null

  setSourceContent: (content: string) => void
  setTargetContent: (content: string) => void
  setSourceFormat: (format: DataFormat) => void
  setTargetFormat: (format: DataFormat) => void
  convert: () => void
  swapFormats: () => void
  formatSource: () => void
  minifySource: () => void
  clearAll: () => void
  hydrate: () => Promise<void>
}

function toYaml(obj: unknown, indent: number = 0): string {
  const prefix = '  '.repeat(indent)

  if (obj === null || obj === undefined) {
    return 'null'
  }

  if (typeof obj === 'string') {
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#') || obj.includes("'") || obj.includes('"') || obj.trim() !== obj) {
      return `"${obj.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
    }
    return obj
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj)
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]'
    return obj
      .map((item) => {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          const entries = Object.entries(item)
          if (entries.length === 0) return `${prefix}- {}`
          const [firstKey, firstVal] = entries[0]
          const firstLine = `${prefix}- ${firstKey}: ${toYaml(firstVal, indent + 2)}`
          const rest = entries.slice(1).map(([k, v]) => {
            const val = typeof v === 'object' && v !== null
              ? `\n${toYaml(v, indent + 2)}`
              : ` ${toYaml(v, indent + 2)}`
            return `${prefix}  ${k}:${typeof v === 'object' && v !== null ? '' : ''}${val}`
          })
          return [firstLine, ...rest].join('\n')
        }
        return `${prefix}- ${toYaml(item, indent + 1)}`
      })
      .join('\n')
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>)
    if (entries.length === 0) return '{}'
    return entries
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          const nested = toYaml(value, indent + 1)
          return `${prefix}${key}:\n${nested}`
        }
        return `${prefix}${key}: ${toYaml(value, indent)}`
      })
      .join('\n')
  }

  return String(obj)
}

interface YamlContext {
  lines: string[]
  index: number
}

function getIndentLevel(line: string): number {
  const match = line.match(/^(\s*)/)
  return match ? match[1].length : 0
}

function parseYamlValue(value: string): unknown {
  const trimmed = value.trim()
  if (trimmed === '' || trimmed === 'null' || trimmed === '~') return null
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10)
  if (/^-?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed)
  if (trimmed === '[]') return []
  if (trimmed === '{}') return {}
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  }
  return trimmed
}

function fromYaml(str: string): unknown {
  const lines = str.split('\n').filter((line) => {
    const trimmed = line.trim()
    return trimmed !== '' && !trimmed.startsWith('#')
  })

  if (lines.length === 0) return {}

  const ctx: YamlContext = { lines, index: 0 }
  return parseYamlBlock(ctx, 0)
}

function parseYamlBlock(ctx: YamlContext, baseIndent: number): unknown {
  if (ctx.index >= ctx.lines.length) return {}

  const firstLine = ctx.lines[ctx.index]
  const trimmedFirst = firstLine.trim()

  if (trimmedFirst.startsWith('- ') || trimmedFirst === '-') {
    return parseYamlArray(ctx, baseIndent)
  }

  return parseYamlObject(ctx, baseIndent)
}

function parseYamlArray(ctx: YamlContext, baseIndent: number): unknown[] {
  const result: unknown[] = []

  while (ctx.index < ctx.lines.length) {
    const line = ctx.lines[ctx.index]
    const indent = getIndentLevel(line)
    const trimmed = line.trim()

    if (indent < baseIndent) break

    if (!trimmed.startsWith('-')) break

    if (trimmed === '-') {
      ctx.index++
      if (ctx.index < ctx.lines.length) {
        const nextIndent = getIndentLevel(ctx.lines[ctx.index])
        if (nextIndent > indent) {
          result.push(parseYamlBlock(ctx, nextIndent))
        } else {
          result.push(null)
        }
      } else {
        result.push(null)
      }
      continue
    }

    const afterDash = trimmed.slice(2)
    const colonIdx = afterDash.indexOf(':')

    if (colonIdx > 0 && colonIdx < afterDash.length) {
      const key = afterDash.slice(0, colonIdx).trim()
      const valueStr = afterDash.slice(colonIdx + 1).trim()

      if (valueStr === '' || valueStr === '') {
        const obj: Record<string, unknown> = {}
        obj[key] = null
        ctx.index++

        const itemIndent = indent + 2
        while (ctx.index < ctx.lines.length) {
          const nextLine = ctx.lines[ctx.index]
          const nextIndent = getIndentLevel(nextLine)
          const nextTrimmed = nextLine.trim()

          if (nextIndent < itemIndent) break
          if (nextTrimmed.startsWith('-')) break

          const nextColonIdx = nextTrimmed.indexOf(':')
          if (nextColonIdx > 0) {
            const nKey = nextTrimmed.slice(0, nextColonIdx).trim()
            const nVal = nextTrimmed.slice(nextColonIdx + 1).trim()

            if (nVal === '') {
              ctx.index++
              if (ctx.index < ctx.lines.length) {
                const deepIndent = getIndentLevel(ctx.lines[ctx.index])
                if (deepIndent > nextIndent) {
                  obj[nKey] = parseYamlBlock(ctx, deepIndent)
                } else {
                  obj[nKey] = null
                }
              } else {
                obj[nKey] = null
              }
            } else {
              obj[nKey] = parseYamlValue(nVal)
              ctx.index++
            }
          } else {
            ctx.index++
          }
        }

        if (obj[key] === null && ctx.index <= ctx.lines.length) {
          const checkIdx = ctx.index
          if (checkIdx < ctx.lines.length) {
            const checkIndent = getIndentLevel(ctx.lines[checkIdx])
            if (checkIndent > indent + 2) {
              obj[key] = parseYamlBlock(ctx, checkIndent)
            }
          }
        }

        result.push(obj)
      } else {
        const obj: Record<string, unknown> = {}
        obj[key] = parseYamlValue(valueStr)
        ctx.index++

        const itemIndent = indent + 2
        while (ctx.index < ctx.lines.length) {
          const nextLine = ctx.lines[ctx.index]
          const nextIndent = getIndentLevel(nextLine)
          const nextTrimmed = nextLine.trim()

          if (nextIndent < itemIndent) break
          if (nextTrimmed.startsWith('-')) break

          const nextColonIdx = nextTrimmed.indexOf(':')
          if (nextColonIdx > 0) {
            const nKey = nextTrimmed.slice(0, nextColonIdx).trim()
            const nVal = nextTrimmed.slice(nextColonIdx + 1).trim()
            obj[nKey] = nVal === '' ? null : parseYamlValue(nVal)
            ctx.index++
          } else {
            ctx.index++
          }
        }

        result.push(obj)
      }
      continue
    }

    result.push(parseYamlValue(afterDash))
    ctx.index++
  }

  return result
}

function parseYamlObject(ctx: YamlContext, baseIndent: number): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  while (ctx.index < ctx.lines.length) {
    const line = ctx.lines[ctx.index]
    const indent = getIndentLevel(line)
    const trimmed = line.trim()

    if (indent < baseIndent) break

    const colonIdx = trimmed.indexOf(':')
    if (colonIdx <= 0) {
      ctx.index++
      continue
    }

    const key = trimmed.slice(0, colonIdx).trim()
    const valueStr = trimmed.slice(colonIdx + 1).trim()

    if (valueStr === '') {
      ctx.index++
      if (ctx.index < ctx.lines.length) {
        const nextIndent = getIndentLevel(ctx.lines[ctx.index])
        if (nextIndent > indent) {
          result[key] = parseYamlBlock(ctx, nextIndent)
        } else {
          result[key] = null
        }
      } else {
        result[key] = null
      }
    } else {
      result[key] = parseYamlValue(valueStr)
      ctx.index++
    }
  }

  return result
}

export const useDataConverterStore = create<DataConverterState>((set, get) => ({
  sourceContent: '',
  targetContent: '',
  sourceFormat: 'json',
  targetFormat: 'yaml',
  history: [],
  error: null,

  setSourceContent: (content) => {
    set({ sourceContent: content, error: null })
  },

  setTargetContent: (content) => {
    set({ targetContent: content })
  },

  setSourceFormat: (format) => {
    set({ sourceFormat: format, error: null })
  },

  setTargetFormat: (format) => {
    set({ targetFormat: format, error: null })
  },

  convert: () => {
    const { sourceContent, sourceFormat, targetFormat } = get()

    if (!sourceContent.trim()) {
      set({ error: 'Input is empty', targetContent: '' })
      return
    }

    try {
      let parsed: unknown

      if (sourceFormat === 'json') {
        parsed = JSON.parse(sourceContent)
      } else {
        parsed = fromYaml(sourceContent)
      }

      let result: string

      if (targetFormat === 'json') {
        result = JSON.stringify(parsed, null, 2)
      } else {
        result = toYaml(parsed)
      }

      const entry: ConversionHistory = {
        id: `conv-${Date.now()}`,
        sourceFormat,
        targetFormat,
        sourceContent,
        targetContent: result,
        createdAt: new Date().toISOString(),
      }

      set((state) => ({
        targetContent: result,
        error: null,
        history: [entry, ...state.history].slice(0, 10),
      }))

      putConversionHistory(entry).catch(() => {})
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Conversion failed'
      set({ error: message, targetContent: '' })
    }
  },

  swapFormats: () => {
    const { sourceFormat, targetFormat, sourceContent, targetContent } = get()
    set({
      sourceFormat: targetFormat,
      targetFormat: sourceFormat,
      sourceContent: targetContent,
      targetContent: sourceContent,
      error: null,
    })
  },

  formatSource: () => {
    const { sourceContent, sourceFormat } = get()

    try {
      if (sourceFormat === 'json') {
        const parsed = JSON.parse(sourceContent)
        set({ sourceContent: JSON.stringify(parsed, null, 2), error: null })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Format failed'
      set({ error: message })
    }
  },

  minifySource: () => {
    const { sourceContent, sourceFormat } = get()

    try {
      if (sourceFormat === 'json') {
        const parsed = JSON.parse(sourceContent)
        set({ sourceContent: JSON.stringify(parsed), error: null })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Minify failed'
      set({ error: message })
    }
  },

  clearAll: () => {
    set({
      sourceContent: '',
      targetContent: '',
      error: null,
    })
  },

  hydrate: async () => {
    try {
      const history = await getAllConversionHistory()
      set({ history: history.slice(0, 10) })
    } catch (error) {
      void error
    }
  },
}))
