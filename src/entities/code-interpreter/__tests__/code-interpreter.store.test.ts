import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCodeInterpreterStore } from '../code-interpreter.store'

vi.mock('@/shared/lib/db', () => ({
  getAllNotebooks: vi.fn().mockResolvedValue([]),
  putNotebook: vi.fn().mockResolvedValue(undefined),
  deleteNotebookFromDb: vi.fn().mockResolvedValue(undefined),
}))

describe('CodeInterpreterStore', () => {
  beforeEach(() => {
    useCodeInterpreterStore.setState({ notebooks: [], currentNotebookId: null, pyodideReady: false })
  })

  it('should have empty initial state', () => {
    const s = useCodeInterpreterStore.getState()
    expect(s.notebooks).toEqual([])
    expect(s.currentNotebookId).toBeNull()
    expect(s.pyodideReady).toBe(false)
  })

  it('should create a notebook', async () => {
    const id = await useCodeInterpreterStore.getState().createNotebook('My Notebook')
    expect(id).toBeTruthy()
    expect(useCodeInterpreterStore.getState().notebooks).toHaveLength(1)
    expect(useCodeInterpreterStore.getState().notebooks[0].title).toBe('My Notebook')
    expect(useCodeInterpreterStore.getState().currentNotebookId).toBe(id)
  })

  it('should delete a notebook', async () => {
    const id = await useCodeInterpreterStore.getState().createNotebook('Test')
    await useCodeInterpreterStore.getState().deleteNotebook(id)
    expect(useCodeInterpreterStore.getState().notebooks).toHaveLength(0)
    expect(useCodeInterpreterStore.getState().currentNotebookId).toBeNull()
  })

  it('should add a cell', async () => {
    await useCodeInterpreterStore.getState().createNotebook('Test')
    await useCodeInterpreterStore.getState().addCell('javascript')
    const nb = useCodeInterpreterStore.getState().notebooks[0]
    expect(nb.cells).toHaveLength(1)
    expect(nb.cells[0].language).toBe('javascript')
    expect(nb.cells[0].status).toBe('idle')
  })

  it('should not add cell when no notebook selected', async () => {
    await useCodeInterpreterStore.getState().addCell('python')
    expect(useCodeInterpreterStore.getState().notebooks).toHaveLength(0)
  })

  it('should update cell code', async () => {
    await useCodeInterpreterStore.getState().createNotebook('Test')
    await useCodeInterpreterStore.getState().addCell('javascript')
    const cellId = useCodeInterpreterStore.getState().notebooks[0].cells[0].id
    await useCodeInterpreterStore.getState().updateCellCode(cellId, 'console.log("hello")')
    expect(useCodeInterpreterStore.getState().notebooks[0].cells[0].code).toBe('console.log("hello")')
  })

  it('should remove a cell', async () => {
    await useCodeInterpreterStore.getState().createNotebook('Test')
    await useCodeInterpreterStore.getState().addCell('javascript')
    const cellId = useCodeInterpreterStore.getState().notebooks[0].cells[0].id
    await useCodeInterpreterStore.getState().removeCell(cellId)
    expect(useCodeInterpreterStore.getState().notebooks[0].cells).toHaveLength(0)
  })

  it('should execute a javascript cell', async () => {
    await useCodeInterpreterStore.getState().createNotebook('Test')
    await useCodeInterpreterStore.getState().addCell('javascript')
    const cellId = useCodeInterpreterStore.getState().notebooks[0].cells[0].id
    await useCodeInterpreterStore.getState().updateCellCode(cellId, 'return 2 + 3')
    await useCodeInterpreterStore.getState().executeCell(cellId)
    const cell = useCodeInterpreterStore.getState().notebooks[0].cells[0]
    expect(cell.status).toBe('done')
    expect(cell.output).toBe('5')
  })

  it('should handle js execution error', async () => {
    await useCodeInterpreterStore.getState().createNotebook('Test')
    await useCodeInterpreterStore.getState().addCell('javascript')
    const cellId = useCodeInterpreterStore.getState().notebooks[0].cells[0].id
    await useCodeInterpreterStore.getState().updateCellCode(cellId, 'throw new Error("boom")')
    await useCodeInterpreterStore.getState().executeCell(cellId)
    const cell = useCodeInterpreterStore.getState().notebooks[0].cells[0]
    expect(cell.status).toBe('error')
    expect(cell.output).toContain('boom')
  })

  it('should handle python cell with message', async () => {
    await useCodeInterpreterStore.getState().createNotebook('Test')
    await useCodeInterpreterStore.getState().addCell('python')
    const cellId = useCodeInterpreterStore.getState().notebooks[0].cells[0].id
    await useCodeInterpreterStore.getState().updateCellCode(cellId, 'print("hello")')
    await useCodeInterpreterStore.getState().executeCell(cellId)
    const cell = useCodeInterpreterStore.getState().notebooks[0].cells[0]
    expect(cell.status).toBe('done')
    expect(cell.output).toContain('Pyodide')
  })

  it('should set pyodide ready', () => {
    useCodeInterpreterStore.getState().setPyodideReady(true)
    expect(useCodeInterpreterStore.getState().pyodideReady).toBe(true)
  })

  it('should select notebook', async () => {
    await useCodeInterpreterStore.getState().createNotebook('A')
    const id = useCodeInterpreterStore.getState().notebooks[0].id
    useCodeInterpreterStore.getState().selectNotebook('other')
    expect(useCodeInterpreterStore.getState().currentNotebookId).toBe('other')
    useCodeInterpreterStore.getState().selectNotebook(id)
    expect(useCodeInterpreterStore.getState().currentNotebookId).toBe(id)
  })
})
