import { create } from 'zustand'
import type { PageIntelligence, Section, TableData } from '@ext/shared/types'

interface SelectedContext {
  readonly sections: ReadonlyArray<number>
  readonly tables: ReadonlyArray<number>
  readonly includeMetadata: boolean
  readonly includeLinks: boolean
}

interface PageIntelligenceState {
  intelligence: PageIntelligence | null
  isLoading: boolean
  error: string | null
  selected: SelectedContext

  // Actions
  extract: () => Promise<void>
  clear: () => void
  toggleSection: (index: number) => void
  toggleTable: (index: number) => void
  toggleMetadata: () => void
  toggleLinks: () => void
  selectAll: () => void
  deselectAll: () => void
  getSelectedSections: () => ReadonlyArray<Section>
  getSelectedTables: () => ReadonlyArray<TableData>
  buildContextPrompt: () => string
}

const DEFAULT_SELECTED: SelectedContext = {
  sections: [],
  tables: [],
  includeMetadata: true,
  includeLinks: false,
}

export const usePageIntelligenceStore = create<PageIntelligenceState>((set, get) => ({
  intelligence: null,
  isLoading: false,
  error: null,
  selected: { ...DEFAULT_SELECTED },

  extract: async () => {
    set({ isLoading: true, error: null })
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) throw new Error('No active tab')

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'EXTRACT_PAGE_INTELLIGENCE',
      })

      if (response?.error) throw new Error(response.error)

      const intel = response.data as PageIntelligence

      // Auto-select all sections and tables
      const sectionIndices = intel.sections.map((_, i) => i)
      const tableIndices = intel.tables.map((_, i) => i)

      set({
        intelligence: intel,
        isLoading: false,
        selected: {
          sections: sectionIndices,
          tables: tableIndices,
          includeMetadata: true,
          includeLinks: false,
        },
      })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Extraction failed',
      })
    }
  },

  clear: () => set({ intelligence: null, error: null, selected: { ...DEFAULT_SELECTED } }),

  toggleSection: (index) =>
    set((s) => {
      const sections = s.selected.sections.includes(index)
        ? s.selected.sections.filter((i) => i !== index)
        : [...s.selected.sections, index]
      return { selected: { ...s.selected, sections } }
    }),

  toggleTable: (index) =>
    set((s) => {
      const tables = s.selected.tables.includes(index)
        ? s.selected.tables.filter((i) => i !== index)
        : [...s.selected.tables, index]
      return { selected: { ...s.selected, tables } }
    }),

  toggleMetadata: () =>
    set((s) => ({
      selected: { ...s.selected, includeMetadata: !s.selected.includeMetadata },
    })),

  toggleLinks: () =>
    set((s) => ({
      selected: { ...s.selected, includeLinks: !s.selected.includeLinks },
    })),

  selectAll: () => {
    const intel = get().intelligence
    if (!intel) return
    set({
      selected: {
        sections: intel.sections.map((_, i) => i),
        tables: intel.tables.map((_, i) => i),
        includeMetadata: true,
        includeLinks: true,
      },
    })
  },

  deselectAll: () => set({ selected: { ...DEFAULT_SELECTED } }),

  getSelectedSections: () => {
    const { intelligence, selected } = get()
    if (!intelligence) return []
    return selected.sections.map((i) => intelligence.sections[i]).filter(Boolean)
  },

  getSelectedTables: () => {
    const { intelligence, selected } = get()
    if (!intelligence) return []
    return selected.tables.map((i) => intelligence.tables[i]).filter(Boolean)
  },

  buildContextPrompt: () => {
    const { intelligence, selected } = get()
    if (!intelligence) return ''

    const parts: string[] = []

    parts.push(`# ${intelligence.title}`)
    parts.push(`URL: ${intelligence.url}`)

    if (selected.includeMetadata) {
      if (intelligence.metadata.author) parts.push(`Author: ${intelligence.metadata.author}`)
      if (intelligence.metadata.publishedDate) parts.push(`Published: ${intelligence.metadata.publishedDate}`)
      parts.push(`Reading time: ~${intelligence.readingTime} min`)
    }
    parts.push('')

    // Selected sections
    const sections = selected.sections
      .map((i) => intelligence.sections[i])
      .filter(Boolean)
    if (sections.length > 0) {
      parts.push('## Content')
      for (const section of sections) {
        if (section.heading) parts.push(`### ${section.heading}`)
        if (section.content) parts.push(section.content.slice(0, 2000))
        parts.push('')
      }
    }

    // Selected tables
    const tables = selected.tables
      .map((i) => intelligence.tables[i])
      .filter(Boolean)
    if (tables.length > 0) {
      parts.push('## Tables')
      for (const table of tables) {
        if (table.caption) parts.push(`**${table.caption}**`)
        parts.push(`| ${table.headers.join(' | ')} |`)
        parts.push(`| ${table.headers.map(() => '---').join(' | ')} |`)
        for (const row of table.rows.slice(0, 20)) {
          parts.push(`| ${row.join(' | ')} |`)
        }
        if (table.rows.length > 20) parts.push(`... (${table.rows.length - 20} more rows)`)
        parts.push('')
      }
    }

    // Links
    if (selected.includeLinks && intelligence.links.length > 0) {
      parts.push('## Links')
      for (const link of intelligence.links.slice(0, 20)) {
        parts.push(`- [${link.text}](${link.href})`)
      }
    }

    return parts.join('\n')
  },
}))
