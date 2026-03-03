import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDocWriterStore } from '../doc-writer.store'

// Mock the providers factory
vi.mock('@/shared/lib/providers/factory', () => ({
  createStream: vi.fn(),
  getProviderConfig: vi.fn(() => ({ provider: 'mock' })),
}))

import { createStream, getProviderConfig } from '@/shared/lib/providers/factory'

const mockCreateStream = vi.mocked(createStream)
const mockGetProviderConfig = vi.mocked(getProviderConfig)

// Helper to create a mock async generator
async function* mockStream(texts: string[]) {
  for (const text of texts) {
    yield { type: 'text' as const, content: text }
  }
  yield { type: 'done' as const }
}

describe('DocWriterStore', () => {
  beforeEach(() => {
    // Reset store state
    useDocWriterStore.setState({
      currentProject: null,
      step: 1,
      isGenerating: false,
    })
    vi.clearAllMocks()
  })

  describe('createProject', () => {
    it('should create a new project with correct fields', () => {
      const store = useDocWriterStore.getState()
      const projectId = store.createProject('My Report', 'report', 'claude-3-5-sonnet-20241022')

      expect(projectId).toMatch(/^dw-\d+-[a-z0-9]{6}$/)

      const { currentProject } = useDocWriterStore.getState()
      expect(currentProject).toBeTruthy()
      expect(currentProject?.name).toBe('My Report')
      expect(currentProject?.type).toBe('report')
      expect(currentProject?.modelId).toBe('claude-3-5-sonnet-20241022')
      expect(currentProject?.context).toBe('')
      expect(currentProject?.outline).toEqual([])
      expect(currentProject?.createdAt).toBeGreaterThan(0)
      expect(currentProject?.updatedAt).toBeGreaterThan(0)
    })

    it('should set step to 1', () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'proposal', 'gpt-4-turbo')

      expect(useDocWriterStore.getState().step).toBe(1)
    })

    it('should generate unique project IDs', () => {
      const store = useDocWriterStore.getState()
      const id1 = store.createProject('Doc 1', 'report', 'claude')
      const id2 = store.createProject('Doc 2', 'proposal', 'gpt')

      expect(id1).not.toBe(id2)
    })
  })

  describe('setContext', () => {
    it('should update context on current project', () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      store.setContext('This is background information.')

      const { currentProject } = useDocWriterStore.getState()
      expect(currentProject?.context).toBe('This is background information.')
    })

    it('should update updatedAt timestamp', () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      store.setContext('New context')

      const afterUpdate = useDocWriterStore.getState().currentProject?.updatedAt || 0
      expect(afterUpdate).toBeGreaterThan(0)
    })

    it('should do nothing if no current project', () => {
      const store = useDocWriterStore.getState()
      store.setContext('Context')

      expect(useDocWriterStore.getState().currentProject).toBeNull()
    })
  })

  describe('generateOutline', () => {
    it('should call createStream with correct parameters', async () => {
      const store = useDocWriterStore.getState()
      store.createProject('My Report', 'report', 'claude-3-5-sonnet-20241022')

      const outlineJson = JSON.stringify([
        { id: 's1', level: 1, title: 'Introduction' },
        { id: 's2', level: 1, title: 'Methodology' },
      ])
      mockCreateStream.mockReturnValueOnce(mockStream([outlineJson]))

      await store.generateOutline({ accessKeyId: 'key', secretAccessKey: 'secret' })

      expect(mockGetProviderConfig).toHaveBeenCalledWith(
        'claude-3-5-sonnet-20241022',
        expect.objectContaining({
          credentials: { accessKeyId: 'key', secretAccessKey: 'secret' },
        })
      )
      expect(mockCreateStream).toHaveBeenCalled()
    })

    it('should parse JSON array response and set outline', async () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      const outlineJson = JSON.stringify([
        { id: 's1', level: 1, title: 'Introduction' },
        { id: 's1.1', level: 2, title: 'Background' },
        { id: 's2', level: 1, title: 'Conclusion' },
      ])
      mockCreateStream.mockReturnValueOnce(mockStream([outlineJson]))

      await store.generateOutline({})

      const { currentProject } = useDocWriterStore.getState()
      expect(currentProject?.outline).toHaveLength(3)
      expect(currentProject?.outline[0].title).toBe('Introduction')
      expect(currentProject?.outline[1].title).toBe('Background')
      expect(currentProject?.outline[1].level).toBe(2)
      expect(currentProject?.outline[2].title).toBe('Conclusion')
    })

    it('should handle JSON embedded in text', async () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      const response = `Sure! Here's your outline:\n\n[{"id":"s1","level":1,"title":"Chapter 1"}]\n\nHope this helps!`
      mockCreateStream.mockReturnValueOnce(mockStream([response]))

      await store.generateOutline({})

      const { currentProject } = useDocWriterStore.getState()
      expect(currentProject?.outline).toHaveLength(1)
      expect(currentProject?.outline[0].title).toBe('Chapter 1')
    })

    it('should generate IDs if missing in response', async () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      const outlineJson = JSON.stringify([
        { level: 1, title: 'Section without ID' },
      ])
      mockCreateStream.mockReturnValueOnce(mockStream([outlineJson]))

      await store.generateOutline({})

      const { currentProject } = useDocWriterStore.getState()
      expect(currentProject?.outline[0].id).toMatch(/^dw-/)
    })

    it('should set isGenerating to true during generation', async () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      let isGeneratingDuringStream = false
      mockCreateStream.mockImplementationOnce(async function* () {
        isGeneratingDuringStream = useDocWriterStore.getState().isGenerating
        yield { type: 'text' as const, content: '[{"id":"s1","level":1,"title":"Test"}]' }
        yield { type: 'done' as const }
      })

      await store.generateOutline({})

      expect(isGeneratingDuringStream).toBe(true)
      expect(useDocWriterStore.getState().isGenerating).toBe(false)
    })

    it('should throw error if JSON parsing fails', async () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      mockCreateStream.mockReturnValueOnce(mockStream(['Not a JSON array']))

      await expect(store.generateOutline({})).rejects.toThrow('Failed to parse outline JSON')
      expect(useDocWriterStore.getState().isGenerating).toBe(false)
    })

    it('should throw error if invalid JSON format', async () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      mockCreateStream.mockReturnValueOnce(mockStream(['[{invalid json}]']))

      await expect(store.generateOutline({})).rejects.toThrow()
      expect(useDocWriterStore.getState().isGenerating).toBe(false)
    })

    it('should handle stream error events', async () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      mockCreateStream.mockImplementationOnce(async function* () {
        yield { type: 'error' as const, error: 'API error occurred' }
      })

      await expect(store.generateOutline({})).rejects.toThrow('API error occurred')
      expect(useDocWriterStore.getState().isGenerating).toBe(false)
    })

    it('should do nothing if no current project', async () => {
      const store = useDocWriterStore.getState()
      await store.generateOutline({})

      expect(mockCreateStream).not.toHaveBeenCalled()
    })
  })

  describe('updateOutlineSection', () => {
    it('should update specific section by id', () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      useDocWriterStore.setState({
        currentProject: {
          ...useDocWriterStore.getState().currentProject!,
          outline: [
            { id: 's1', level: 1, title: 'Old Title' },
            { id: 's2', level: 1, title: 'Keep This' },
          ],
        },
      })

      store.updateOutlineSection('s1', { title: 'New Title', level: 2 })

      const { currentProject } = useDocWriterStore.getState()
      expect(currentProject?.outline[0].title).toBe('New Title')
      expect(currentProject?.outline[0].level).toBe(2)
      expect(currentProject?.outline[1].title).toBe('Keep This')
    })

    it('should update content field', () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      useDocWriterStore.setState({
        currentProject: {
          ...useDocWriterStore.getState().currentProject!,
          outline: [{ id: 's1', level: 1, title: 'Test' }],
        },
      })

      store.updateOutlineSection('s1', { content: 'New content here' })

      const { currentProject } = useDocWriterStore.getState()
      expect(currentProject?.outline[0].content).toBe('New content here')
    })

    it('should not modify other sections', () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      useDocWriterStore.setState({
        currentProject: {
          ...useDocWriterStore.getState().currentProject!,
          outline: [
            { id: 's1', level: 1, title: 'Section 1' },
            { id: 's2', level: 2, title: 'Section 2' },
          ],
        },
      })

      store.updateOutlineSection('s1', { title: 'Updated' })

      const { currentProject } = useDocWriterStore.getState()
      expect(currentProject?.outline[1]).toEqual({ id: 's2', level: 2, title: 'Section 2' })
    })

    it('should do nothing if section id not found', () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      const outline = [{ id: 's1', level: 1, title: 'Test' }]
      useDocWriterStore.setState({
        currentProject: { ...useDocWriterStore.getState().currentProject!, outline },
      })

      store.updateOutlineSection('nonexistent', { title: 'New' })

      const { currentProject } = useDocWriterStore.getState()
      expect(currentProject?.outline).toEqual(outline)
    })

    it('should do nothing if no current project', () => {
      const store = useDocWriterStore.getState()
      store.updateOutlineSection('s1', { title: 'Test' })

      expect(useDocWriterStore.getState().currentProject).toBeNull()
    })
  })

  describe('addOutlineSection', () => {
    it('should add new section to outline', () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      store.addOutlineSection('New Section', 2)

      const { currentProject } = useDocWriterStore.getState()
      expect(currentProject?.outline).toHaveLength(1)
      expect(currentProject?.outline[0].title).toBe('New Section')
      expect(currentProject?.outline[0].level).toBe(2)
      expect(currentProject?.outline[0].id).toMatch(/^dw-/)
    })

    it('should append to existing sections', () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      useDocWriterStore.setState({
        currentProject: {
          ...useDocWriterStore.getState().currentProject!,
          outline: [{ id: 's1', level: 1, title: 'First' }],
        },
      })

      store.addOutlineSection('Second', 1)

      const { currentProject } = useDocWriterStore.getState()
      expect(currentProject?.outline).toHaveLength(2)
      expect(currentProject?.outline[1].title).toBe('Second')
    })

    it('should generate unique IDs for each section', () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      store.addOutlineSection('Section 1', 1)
      store.addOutlineSection('Section 2', 1)

      const { currentProject } = useDocWriterStore.getState()
      expect(currentProject?.outline[0].id).not.toBe(currentProject?.outline[1].id)
    })

    it('should do nothing if no current project', () => {
      const store = useDocWriterStore.getState()
      store.addOutlineSection('Test', 1)

      expect(useDocWriterStore.getState().currentProject).toBeNull()
    })
  })

  describe('removeOutlineSection', () => {
    it('should remove section by id', () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      useDocWriterStore.setState({
        currentProject: {
          ...useDocWriterStore.getState().currentProject!,
          outline: [
            { id: 's1', level: 1, title: 'Remove Me' },
            { id: 's2', level: 1, title: 'Keep Me' },
          ],
        },
      })

      store.removeOutlineSection('s1')

      const { currentProject } = useDocWriterStore.getState()
      expect(currentProject?.outline).toHaveLength(1)
      expect(currentProject?.outline[0].id).toBe('s2')
    })

    it('should do nothing if section id not found', () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      const outline = [{ id: 's1', level: 1, title: 'Test' }]
      useDocWriterStore.setState({
        currentProject: { ...useDocWriterStore.getState().currentProject!, outline },
      })

      store.removeOutlineSection('nonexistent')

      const { currentProject } = useDocWriterStore.getState()
      expect(currentProject?.outline).toEqual(outline)
    })

    it('should do nothing if no current project', () => {
      const store = useDocWriterStore.getState()
      store.removeOutlineSection('s1')

      expect(useDocWriterStore.getState().currentProject).toBeNull()
    })
  })

  describe('generateSectionContent', () => {
    it('should stream content into section', async () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      useDocWriterStore.setState({
        currentProject: {
          ...useDocWriterStore.getState().currentProject!,
          outline: [{ id: 's1', level: 1, title: 'Introduction' }],
        },
      })

      mockCreateStream.mockReturnValueOnce(mockStream(['This is ', 'the content.']))

      await store.generateSectionContent('s1', {})

      const { currentProject } = useDocWriterStore.getState()
      expect(currentProject?.outline[0].content).toBe('This is the content.')
    })

    it('should update content incrementally during streaming', async () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      useDocWriterStore.setState({
        currentProject: {
          ...useDocWriterStore.getState().currentProject!,
          outline: [{ id: 's1', level: 1, title: 'Test' }],
        },
      })

      const contentSnapshots: string[] = []
      mockCreateStream.mockImplementationOnce(async function* () {
        yield { type: 'text' as const, content: 'Part 1 ' }
        contentSnapshots.push(useDocWriterStore.getState().currentProject?.outline[0].content || '')
        yield { type: 'text' as const, content: 'Part 2' }
        contentSnapshots.push(useDocWriterStore.getState().currentProject?.outline[0].content || '')
        yield { type: 'done' as const }
      })

      await store.generateSectionContent('s1', {})

      expect(contentSnapshots[0]).toBe('Part 1 ')
      expect(contentSnapshots[1]).toBe('Part 1 Part 2')
    })

    it('should set isGenerating during generation', async () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      useDocWriterStore.setState({
        currentProject: {
          ...useDocWriterStore.getState().currentProject!,
          outline: [{ id: 's1', level: 1, title: 'Test' }],
        },
      })

      let isGeneratingDuringStream = false
      mockCreateStream.mockImplementationOnce(async function* () {
        isGeneratingDuringStream = useDocWriterStore.getState().isGenerating
        yield { type: 'text' as const, content: 'Content' }
        yield { type: 'done' as const }
      })

      await store.generateSectionContent('s1', {})

      expect(isGeneratingDuringStream).toBe(true)
      expect(useDocWriterStore.getState().isGenerating).toBe(false)
    })

    it('should handle stream error events', async () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      useDocWriterStore.setState({
        currentProject: {
          ...useDocWriterStore.getState().currentProject!,
          outline: [{ id: 's1', level: 1, title: 'Test' }],
        },
      })

      mockCreateStream.mockImplementationOnce(async function* () {
        yield { type: 'error' as const, error: 'Content generation failed' }
      })

      await expect(store.generateSectionContent('s1', {})).rejects.toThrow('Content generation failed')
      expect(useDocWriterStore.getState().isGenerating).toBe(false)
    })

    it('should do nothing if section not found', async () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      useDocWriterStore.setState({
        currentProject: {
          ...useDocWriterStore.getState().currentProject!,
          outline: [{ id: 's1', level: 1, title: 'Test' }],
        },
      })

      await store.generateSectionContent('nonexistent', {})

      expect(mockCreateStream).not.toHaveBeenCalled()
    })

    it('should do nothing if no current project', async () => {
      const store = useDocWriterStore.getState()
      await store.generateSectionContent('s1', {})

      expect(mockCreateStream).not.toHaveBeenCalled()
    })

    it('should call createStream with credentials and API keys', async () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'gpt-4')

      useDocWriterStore.setState({
        currentProject: {
          ...useDocWriterStore.getState().currentProject!,
          outline: [{ id: 's1', level: 1, title: 'Test' }],
        },
      })

      mockCreateStream.mockReturnValueOnce(mockStream(['Content']))

      await store.generateSectionContent('s1', { key: 'value' }, 'openai-key', 'gemini-key')

      expect(mockGetProviderConfig).toHaveBeenCalledWith(
        'gpt-4',
        {
          credentials: { key: 'value' },
          openaiApiKey: 'openai-key',
          geminiApiKey: 'gemini-key',
        }
      )
    })
  })

  describe('updateSectionContent', () => {
    it('should manually update section content', () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      useDocWriterStore.setState({
        currentProject: {
          ...useDocWriterStore.getState().currentProject!,
          outline: [{ id: 's1', level: 1, title: 'Test' }],
        },
      })

      store.updateSectionContent('s1', 'Manually edited content')

      const { currentProject } = useDocWriterStore.getState()
      expect(currentProject?.outline[0].content).toBe('Manually edited content')
    })

    it('should only update the specified section', () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      useDocWriterStore.setState({
        currentProject: {
          ...useDocWriterStore.getState().currentProject!,
          outline: [
            { id: 's1', level: 1, title: 'First', content: 'Original' },
            { id: 's2', level: 1, title: 'Second', content: 'Keep me' },
          ],
        },
      })

      store.updateSectionContent('s1', 'Updated')

      const { currentProject } = useDocWriterStore.getState()
      expect(currentProject?.outline[0].content).toBe('Updated')
      expect(currentProject?.outline[1].content).toBe('Keep me')
    })

    it('should do nothing if section not found', () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      const outline = [{ id: 's1', level: 1, title: 'Test', content: 'Original' }]
      useDocWriterStore.setState({
        currentProject: { ...useDocWriterStore.getState().currentProject!, outline },
      })

      store.updateSectionContent('nonexistent', 'New')

      const { currentProject } = useDocWriterStore.getState()
      expect(currentProject?.outline[0].content).toBe('Original')
    })

    it('should do nothing if no current project', () => {
      const store = useDocWriterStore.getState()
      store.updateSectionContent('s1', 'Content')

      expect(useDocWriterStore.getState().currentProject).toBeNull()
    })
  })

  describe('exportMarkdown', () => {
    it('should return markdown with # headers', () => {
      const store = useDocWriterStore.getState()
      store.createProject('My Document', 'report', 'claude')

      useDocWriterStore.setState({
        currentProject: {
          ...useDocWriterStore.getState().currentProject!,
          outline: [
            { id: 's1', level: 1, title: 'Introduction', content: 'Intro content here.' },
            { id: 's2', level: 2, title: 'Background', content: 'Background info.' },
            { id: 's3', level: 1, title: 'Conclusion' },
          ],
        },
      })

      const markdown = store.exportMarkdown()

      expect(markdown).toContain('# My Document')
      expect(markdown).toContain('## Introduction')
      expect(markdown).toContain('Intro content here.')
      expect(markdown).toContain('### Background')
      expect(markdown).toContain('Background info.')
      expect(markdown).toContain('## Conclusion')
    })

    it('should handle nested levels correctly', () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      useDocWriterStore.setState({
        currentProject: {
          ...useDocWriterStore.getState().currentProject!,
          outline: [
            { id: 's1', level: 1, title: 'Level 1' },
            { id: 's2', level: 2, title: 'Level 2' },
            { id: 's3', level: 3, title: 'Level 3' },
            { id: 's4', level: 4, title: 'Level 4' },
          ],
        },
      })

      const markdown = store.exportMarkdown()

      expect(markdown).toContain('## Level 1')
      expect(markdown).toContain('### Level 2')
      expect(markdown).toContain('#### Level 3')
      expect(markdown).toContain('#### Level 4') // Capped at ####
    })

    it('should return empty string if no current project', () => {
      const store = useDocWriterStore.getState()
      const markdown = store.exportMarkdown()

      expect(markdown).toBe('')
    })

    it('should handle sections without content', () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      useDocWriterStore.setState({
        currentProject: {
          ...useDocWriterStore.getState().currentProject!,
          outline: [
            { id: 's1', level: 1, title: 'With Content', content: 'Some content' },
            { id: 's2', level: 1, title: 'Without Content' },
          ],
        },
      })

      const markdown = store.exportMarkdown()

      expect(markdown).toContain('## With Content')
      expect(markdown).toContain('Some content')
      expect(markdown).toContain('## Without Content')
      expect(markdown).not.toContain('undefined')
    })
  })

  describe('exportText', () => {
    it('should return plain text with indentation', () => {
      const store = useDocWriterStore.getState()
      store.createProject('My Document', 'report', 'claude')

      useDocWriterStore.setState({
        currentProject: {
          ...useDocWriterStore.getState().currentProject!,
          outline: [
            { id: 's1', level: 1, title: 'Introduction', content: 'Intro content.' },
            { id: 's2', level: 2, title: 'Background', content: 'Background.' },
            { id: 's3', level: 1, title: 'Conclusion' },
          ],
        },
      })

      const text = store.exportText()

      expect(text).toContain('My Document')
      expect(text).toContain('='.repeat('My Document'.length))
      expect(text).toContain('Introduction')
      expect(text).toContain('Intro content.')
      expect(text).toContain('  Background')
      expect(text).toContain('Background.')
      expect(text).toContain('Conclusion')
    })

    it('should indent based on level', () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      useDocWriterStore.setState({
        currentProject: {
          ...useDocWriterStore.getState().currentProject!,
          outline: [
            { id: 's1', level: 1, title: 'Level 1' },
            { id: 's2', level: 2, title: 'Level 2' },
            { id: 's3', level: 3, title: 'Level 3' },
          ],
        },
      })

      const text = store.exportText()

      expect(text).toMatch(/^Level 1$/m)
      expect(text).toMatch(/^  Level 2$/m)
      expect(text).toMatch(/^    Level 3$/m)
    })

    it('should return empty string if no current project', () => {
      const store = useDocWriterStore.getState()
      const text = store.exportText()

      expect(text).toBe('')
    })

    it('should handle sections without content', () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')

      useDocWriterStore.setState({
        currentProject: {
          ...useDocWriterStore.getState().currentProject!,
          outline: [{ id: 's1', level: 1, title: 'No Content' }],
        },
      })

      const text = store.exportText()

      expect(text).toContain('No Content')
      expect(text).not.toContain('undefined')
    })
  })

  describe('setStep', () => {
    it('should change step number', () => {
      const store = useDocWriterStore.getState()
      store.setStep(3)

      expect(useDocWriterStore.getState().step).toBe(3)
    })

    it('should allow setting to 1', () => {
      const store = useDocWriterStore.getState()
      store.setStep(5)
      store.setStep(1)

      expect(useDocWriterStore.getState().step).toBe(1)
    })
  })

  describe('reset', () => {
    it('should clear all state', () => {
      const store = useDocWriterStore.getState()
      store.createProject('Test', 'report', 'claude')
      store.setStep(3)

      useDocWriterStore.setState({ isGenerating: true })

      store.reset()

      const state = useDocWriterStore.getState()
      expect(state.currentProject).toBeNull()
      expect(state.step).toBe(1)
      expect(state.isGenerating).toBe(false)
    })

    it('should be idempotent', () => {
      const store = useDocWriterStore.getState()
      store.reset()
      const state1 = useDocWriterStore.getState()
      store.reset()
      const state2 = useDocWriterStore.getState()

      expect(state1).toEqual(state2)
    })
  })
})
