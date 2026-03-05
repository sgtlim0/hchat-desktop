import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDiagramEditorStore } from '../diagram-editor.store'

vi.mock('@/shared/lib/db', () => ({
  getAllDiagrams: vi.fn(() => Promise.resolve([])),
  putDiagram: vi.fn(() => Promise.resolve()),
  deleteDiagramFromDb: vi.fn(() => Promise.resolve()),
}))

describe('DiagramEditorStore', () => {
  beforeEach(() => {
    useDiagramEditorStore.setState({
      diagrams: [],
      selectedDiagramId: null,
      searchQuery: '',
    })
  })

  it('should add a diagram', () => {
    const { addDiagram } = useDiagramEditorStore.getState()

    addDiagram('Test Diagram', 'flowchart', 'graph TD\n  A-->B')

    const { diagrams, selectedDiagramId } = useDiagramEditorStore.getState()
    expect(diagrams).toHaveLength(1)
    expect(diagrams[0].title).toBe('Test Diagram')
    expect(diagrams[0].type).toBe('flowchart')
    expect(diagrams[0].code).toBe('graph TD\n  A-->B')
    expect(diagrams[0].isFavorite).toBe(false)
    expect(diagrams[0].id).toMatch(/^diagram-\d+$/)
    expect(selectedDiagramId).toBe(diagrams[0].id)
  })

  it('should update a diagram immutably', () => {
    const { addDiagram } = useDiagramEditorStore.getState()

    addDiagram('Original', 'flowchart', 'graph TD\n  A-->B')

    const original = useDiagramEditorStore.getState().diagrams[0]
    const { updateDiagram } = useDiagramEditorStore.getState()

    updateDiagram(original.id, { title: 'Updated', code: 'graph LR\n  A-->B' })

    const updated = useDiagramEditorStore.getState().diagrams[0]
    expect(updated.title).toBe('Updated')
    expect(updated.code).toBe('graph LR\n  A-->B')
    expect(updated).not.toBe(original)
  })

  it('should delete a diagram', () => {
    const { addDiagram } = useDiagramEditorStore.getState()

    let now = 1000
    vi.spyOn(Date, 'now').mockImplementation(() => ++now)

    addDiagram('Diagram 1', 'flowchart', 'code1')
    const id1 = useDiagramEditorStore.getState().diagrams[0].id

    addDiagram('Diagram 2', 'sequence', 'code2')

    expect(useDiagramEditorStore.getState().diagrams).toHaveLength(2)

    const { deleteDiagram } = useDiagramEditorStore.getState()
    deleteDiagram(id1)

    const { diagrams } = useDiagramEditorStore.getState()
    expect(diagrams).toHaveLength(1)
    expect(diagrams[0].title).toBe('Diagram 2')

    vi.restoreAllMocks()
  })

  it('should clear selectedDiagramId when deleting selected diagram', () => {
    const { addDiagram } = useDiagramEditorStore.getState()

    addDiagram('To Delete', 'flowchart', 'code')

    const { selectedDiagramId, diagrams } = useDiagramEditorStore.getState()
    expect(selectedDiagramId).toBe(diagrams[0].id)

    const { deleteDiagram } = useDiagramEditorStore.getState()
    deleteDiagram(diagrams[0].id)

    expect(useDiagramEditorStore.getState().selectedDiagramId).toBeNull()
  })

  it('should toggle favorite', () => {
    const { addDiagram } = useDiagramEditorStore.getState()

    addDiagram('Fav Test', 'pie', 'pie')

    const id = useDiagramEditorStore.getState().diagrams[0].id
    const { toggleFavorite } = useDiagramEditorStore.getState()

    expect(useDiagramEditorStore.getState().diagrams[0].isFavorite).toBe(false)

    toggleFavorite(id)
    expect(useDiagramEditorStore.getState().diagrams[0].isFavorite).toBe(true)

    toggleFavorite(id)
    expect(useDiagramEditorStore.getState().diagrams[0].isFavorite).toBe(false)
  })

  it('should select a diagram', () => {
    const { addDiagram } = useDiagramEditorStore.getState()

    addDiagram('Diagram A', 'flowchart', 'code')

    const id = useDiagramEditorStore.getState().diagrams[0].id
    const { selectDiagram } = useDiagramEditorStore.getState()

    selectDiagram(null)
    expect(useDiagramEditorStore.getState().selectedDiagramId).toBeNull()

    selectDiagram(id)
    expect(useDiagramEditorStore.getState().selectedDiagramId).toBe(id)
  })

  it('should filter diagrams by search query', () => {
    const { addDiagram } = useDiagramEditorStore.getState()

    addDiagram('Flowchart Diagram', 'flowchart', 'code')
    addDiagram('Sequence Diagram', 'sequence', 'code')
    addDiagram('ER Model', 'er', 'code')

    const { setSearchQuery, getFilteredDiagrams } = useDiagramEditorStore.getState()

    setSearchQuery('diagram')

    const filtered = useDiagramEditorStore.getState().getFilteredDiagrams()
    expect(filtered).toHaveLength(2)
    expect(filtered.every((d) => d.title.toLowerCase().includes('diagram'))).toBe(true)
  })

  it('should return all diagrams when search is empty', () => {
    const { addDiagram } = useDiagramEditorStore.getState()

    addDiagram('A', 'flowchart', 'code')
    addDiagram('B', 'sequence', 'code')

    const { setSearchQuery } = useDiagramEditorStore.getState()
    setSearchQuery('')

    const filtered = useDiagramEditorStore.getState().getFilteredDiagrams()
    expect(filtered).toHaveLength(2)
  })

  it('should get selected diagram', () => {
    const { addDiagram } = useDiagramEditorStore.getState()

    addDiagram('Selected', 'flowchart', 'code')

    const { getSelectedDiagram, diagrams } = useDiagramEditorStore.getState()
    const selected = getSelectedDiagram()
    expect(selected).not.toBeNull()
    expect(selected?.title).toBe('Selected')

    useDiagramEditorStore.setState({ selectedDiagramId: null })

    const none = useDiagramEditorStore.getState().getSelectedDiagram()
    expect(none).toBeNull()
  })

  it('should hydrate from db', async () => {
    const { getAllDiagrams } = await import('@/shared/lib/db')
    const mockDiagrams = [
      {
        id: 'diagram-1',
        title: 'DB Diagram',
        type: 'flowchart' as const,
        code: 'graph TD',
        isFavorite: false,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]

    vi.mocked(getAllDiagrams).mockResolvedValueOnce(mockDiagrams)

    const { hydrate } = useDiagramEditorStore.getState()
    await hydrate()

    const { diagrams } = useDiagramEditorStore.getState()
    expect(diagrams).toHaveLength(1)
    expect(diagrams[0].title).toBe('DB Diagram')
  })
})
