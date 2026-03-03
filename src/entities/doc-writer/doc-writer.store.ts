import { create } from 'zustand'
import { createStream, getProviderConfig } from '@/shared/lib/providers/factory'
import type { ProviderConfig, StreamParams } from '@/shared/lib/providers/types'

export type DocType = 'report' | 'proposal' | 'presentation' | 'manual'

export interface OutlineSection {
  id: string
  level: number
  title: string
  content?: string
}

export interface DocProject {
  id: string
  name: string
  type: DocType
  modelId: string
  context: string
  outline: OutlineSection[]
  createdAt: number
  updatedAt: number
}

interface DocWriterState {
  currentProject: DocProject | null
  step: number
  isGenerating: boolean

  createProject: (name: string, type: DocType, modelId: string) => string
  setContext: (context: string) => void
  generateOutline: (credentials: any, openaiApiKey?: string | null, geminiApiKey?: string | null) => Promise<void>
  updateOutlineSection: (id: string, patch: Partial<OutlineSection>) => void
  addOutlineSection: (title: string, level: number) => void
  removeOutlineSection: (id: string) => void
  generateSectionContent: (sectionId: string, credentials: any, openaiApiKey?: string | null, geminiApiKey?: string | null) => Promise<void>
  updateSectionContent: (sectionId: string, content: string) => void
  exportMarkdown: () => string
  exportText: () => string
  setStep: (step: number) => void
  reset: () => void
}

function generateId(): string {
  return `dw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function buildOutlinePrompt(project: DocProject): string {
  return `You are a professional document writer. Generate a detailed outline for a ${project.type} titled "${project.name}".
${project.context ? `\nContext/Background:\n${project.context}` : ''}

Return ONLY a JSON array of objects with these fields:
- id: unique string (like "s1", "s1.1", etc.)
- level: number (1 for main sections, 2 for subsections, 3 for sub-subsections)
- title: string (section title)

Example: [{"id":"s1","level":1,"title":"Introduction"},{"id":"s1.1","level":2,"title":"Purpose"}]

Generate 5-10 sections with appropriate subsections. Return ONLY the JSON array, no other text.`
}

function buildContentPrompt(project: DocProject, section: OutlineSection): string {
  const outlineSummary = project.outline.map((s) => `${'  '.repeat(s.level - 1)}${s.title}`).join('\n')
  return `You are a professional document writer. Write the content for section "${section.title}" of a ${project.type} titled "${project.name}".

Full outline:
${outlineSummary}

${project.context ? `Context/Background:\n${project.context}\n` : ''}

Write detailed, professional content for this section. Use appropriate formatting. Output ONLY the section content, no headers.`
}

export const useDocWriterStore = create<DocWriterState>((set, get) => ({
  currentProject: null,
  step: 1,
  isGenerating: false,

  createProject: (name, type, modelId) => {
    const id = generateId()
    const project: DocProject = {
      id,
      name,
      type,
      modelId,
      context: '',
      outline: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    set({ currentProject: project, step: 1 })
    return id
  },

  setContext: (context) => {
    const { currentProject } = get()
    if (!currentProject) return
    set({
      currentProject: { ...currentProject, context, updatedAt: Date.now() },
    })
  },

  generateOutline: async (credentials, openaiApiKey, geminiApiKey) => {
    const { currentProject } = get()
    if (!currentProject) return

    set({ isGenerating: true })
    try {
      const config: ProviderConfig = getProviderConfig(currentProject.modelId, {
        credentials, openaiApiKey, geminiApiKey,
      })
      const params: StreamParams = {
        modelId: currentProject.modelId,
        messages: [{ role: 'user' as const, content: buildOutlinePrompt(currentProject) }],
      }
      const stream = createStream(config, params)
      let fullText = ''

      for await (const event of stream) {
        if (event.type === 'text' && event.content) {
          fullText += event.content
        } else if (event.type === 'error') {
          throw new Error(event.error)
        }
      }

      const jsonMatch = fullText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('Failed to parse outline JSON')

      const parsed = JSON.parse(jsonMatch[0]) as Array<{ id: string; level: number; title: string }>
      const outline: OutlineSection[] = parsed.map((item) => ({
        id: item.id || generateId(),
        level: item.level,
        title: item.title,
      }))

      set({
        currentProject: { ...currentProject, outline, updatedAt: Date.now() },
        isGenerating: false,
      })
    } catch (error) {
      set({ isGenerating: false })
      throw error
    }
  },

  updateOutlineSection: (id, patch) => {
    const { currentProject } = get()
    if (!currentProject) return
    set({
      currentProject: {
        ...currentProject,
        outline: currentProject.outline.map((s) =>
          s.id === id ? { ...s, ...patch } : s
        ),
        updatedAt: Date.now(),
      },
    })
  },

  addOutlineSection: (title, level) => {
    const { currentProject } = get()
    if (!currentProject) return
    const newSection: OutlineSection = {
      id: generateId(),
      level,
      title,
    }
    set({
      currentProject: {
        ...currentProject,
        outline: [...currentProject.outline, newSection],
        updatedAt: Date.now(),
      },
    })
  },

  removeOutlineSection: (id) => {
    const { currentProject } = get()
    if (!currentProject) return
    set({
      currentProject: {
        ...currentProject,
        outline: currentProject.outline.filter((s) => s.id !== id),
        updatedAt: Date.now(),
      },
    })
  },

  generateSectionContent: async (sectionId, credentials, openaiApiKey, geminiApiKey) => {
    const { currentProject } = get()
    if (!currentProject) return

    const section = currentProject.outline.find((s) => s.id === sectionId)
    if (!section) return

    set({ isGenerating: true })
    try {
      const config: ProviderConfig = getProviderConfig(currentProject.modelId, {
        credentials, openaiApiKey, geminiApiKey,
      })
      const params: StreamParams = {
        modelId: currentProject.modelId,
        messages: [{ role: 'user' as const, content: buildContentPrompt(currentProject, section) }],
      }
      const stream = createStream(config, params)
      let content = ''

      for await (const event of stream) {
        if (event.type === 'text' && event.content) {
          content += event.content
          const proj = get().currentProject
          if (proj) {
            set({
              currentProject: {
                ...proj,
                outline: proj.outline.map((s) =>
                  s.id === sectionId ? { ...s, content } : s
                ),
              },
            })
          }
        } else if (event.type === 'error') {
          throw new Error(event.error)
        }
      }

      set({ isGenerating: false })
    } catch (error) {
      set({ isGenerating: false })
      throw error
    }
  },

  updateSectionContent: (sectionId, content) => {
    const { currentProject } = get()
    if (!currentProject) return
    set({
      currentProject: {
        ...currentProject,
        outline: currentProject.outline.map((s) =>
          s.id === sectionId ? { ...s, content } : s
        ),
        updatedAt: Date.now(),
      },
    })
  },

  exportMarkdown: () => {
    const { currentProject } = get()
    if (!currentProject) return ''

    const lines: string[] = [`# ${currentProject.name}`, '']
    for (const section of currentProject.outline) {
      const prefix = '#'.repeat(Math.min(section.level + 1, 4))
      lines.push(`${prefix} ${section.title}`, '')
      if (section.content) {
        lines.push(section.content, '')
      }
    }
    return lines.join('\n')
  },

  exportText: () => {
    const { currentProject } = get()
    if (!currentProject) return ''

    const lines: string[] = [currentProject.name, '='.repeat(currentProject.name.length), '']
    for (const section of currentProject.outline) {
      const indent = '  '.repeat(section.level - 1)
      lines.push(`${indent}${section.title}`, '')
      if (section.content) {
        lines.push(section.content, '')
      }
    }
    return lines.join('\n')
  },

  setStep: (step) => set({ step }),

  reset: () => set({ currentProject: null, step: 1, isGenerating: false }),
}))
