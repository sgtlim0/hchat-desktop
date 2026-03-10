import { create } from 'zustand'
import type { Notebook, CodeCell, CodeLanguage, CellStatus } from '@/shared/types'
import { getAllNotebooks, putNotebook, deleteNotebookFromDb } from '@/shared/lib/db'

function executeInSandbox(code: string): Promise<string> {
  if (typeof Worker === 'undefined' || typeof Blob === 'undefined') {
    // Fallback for environments without Worker (e.g., test/SSR)
    return Promise.reject(new Error('Code execution requires a browser environment'))
  }

  return new Promise((resolve, reject) => {
    const workerCode = `
      "use strict";
      self.onmessage = function(e) {
        try {
          const fn = Function("use strict", e.data);
          const result = fn();
          self.postMessage({ ok: true, value: String(result ?? '(no output)') });
        } catch (err) {
          self.postMessage({ ok: false, value: err.message });
        }
      };
    `
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    const w = new Worker(url)

    const timer = setTimeout(() => {
      w.terminate()
      URL.revokeObjectURL(url)
      reject(new Error('Execution timeout (5s)'))
    }, 5000)

    w.onmessage = (e: MessageEvent<{ ok: boolean; value: string }>) => {
      clearTimeout(timer)
      w.terminate()
      URL.revokeObjectURL(url)
      if (e.data.ok) resolve(e.data.value)
      else reject(new Error(e.data.value))
    }

    w.onerror = (err) => {
      clearTimeout(timer)
      w.terminate()
      URL.revokeObjectURL(url)
      reject(new Error(err.message))
    }

    w.postMessage(code)
  })
}

interface CodeInterpreterState {
  notebooks: Notebook[]
  currentNotebookId: string | null
  pyodideReady: boolean

  hydrate: () => Promise<void>
  createNotebook: (title: string) => Promise<string>
  deleteNotebook: (id: string) => Promise<void>
  selectNotebook: (id: string) => void
  addCell: (language: CodeLanguage) => Promise<void>
  updateCellCode: (cellId: string, code: string) => Promise<void>
  updateCellOutput: (cellId: string, output: string, status: CellStatus) => Promise<void>
  removeCell: (cellId: string) => Promise<void>
  executeCell: (cellId: string) => Promise<void>
  setPyodideReady: (ready: boolean) => void
}

function getCurrentNotebook(state: CodeInterpreterState): Notebook | undefined {
  return state.notebooks.find((n) => n.id === state.currentNotebookId)
}

export const useCodeInterpreterStore = create<CodeInterpreterState>()((set, get) => ({
  notebooks: [],
  currentNotebookId: null,
  pyodideReady: false,

  hydrate: async () => {
    const notebooks = await getAllNotebooks()
    set({ notebooks })
  },

  createNotebook: async (title) => {
    const now = new Date().toISOString()
    const nb: Notebook = { id: crypto.randomUUID(), title, cells: [], createdAt: now, updatedAt: now }
    await putNotebook(nb)
    set((s) => ({ notebooks: [nb, ...s.notebooks], currentNotebookId: nb.id }))
    return nb.id
  },

  deleteNotebook: async (id) => {
    await deleteNotebookFromDb(id)
    set((s) => ({
      notebooks: s.notebooks.filter((n) => n.id !== id),
      currentNotebookId: s.currentNotebookId === id ? null : s.currentNotebookId,
    }))
  },

  selectNotebook: (id) => set({ currentNotebookId: id }),

  addCell: async (language) => {
    const nb = getCurrentNotebook(get())
    if (!nb) return
    const cell: CodeCell = { id: crypto.randomUUID(), language, code: '', output: '', status: 'idle' }
    const updated = { ...nb, cells: [...nb.cells, cell], updatedAt: new Date().toISOString() }
    await putNotebook(updated)
    set((s) => ({ notebooks: s.notebooks.map((n) => (n.id === nb.id ? updated : n)) }))
  },

  updateCellCode: async (cellId, code) => {
    const nb = getCurrentNotebook(get())
    if (!nb) return
    const cells = nb.cells.map((c) => (c.id === cellId ? { ...c, code } : c))
    const updated = { ...nb, cells, updatedAt: new Date().toISOString() }
    await putNotebook(updated)
    set((s) => ({ notebooks: s.notebooks.map((n) => (n.id === nb.id ? updated : n)) }))
  },

  updateCellOutput: async (cellId, output, status) => {
    const nb = getCurrentNotebook(get())
    if (!nb) return
    const cells = nb.cells.map((c) =>
      c.id === cellId ? { ...c, output, status, executedAt: new Date().toISOString() } : c,
    )
    const updated = { ...nb, cells, updatedAt: new Date().toISOString() }
    await putNotebook(updated)
    set((s) => ({ notebooks: s.notebooks.map((n) => (n.id === nb.id ? updated : n)) }))
  },

  removeCell: async (cellId) => {
    const nb = getCurrentNotebook(get())
    if (!nb) return
    const cells = nb.cells.filter((c) => c.id !== cellId)
    const updated = { ...nb, cells, updatedAt: new Date().toISOString() }
    await putNotebook(updated)
    set((s) => ({ notebooks: s.notebooks.map((n) => (n.id === nb.id ? updated : n)) }))
  },

  executeCell: async (cellId) => {
    const nb = getCurrentNotebook(get())
    if (!nb) return
    const cell = nb.cells.find((c) => c.id === cellId)
    if (!cell) return

    await get().updateCellOutput(cellId, '', 'running')

    try {
      if (cell.language === 'javascript') {
        const result = await executeInSandbox(cell.code)
        await get().updateCellOutput(cellId, result, 'done')
      } else {
        // Python — requires Pyodide (lazy loaded)
        await get().updateCellOutput(cellId, 'Python execution requires Pyodide (loading...)', 'done')
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Execution error'
      await get().updateCellOutput(cellId, `Error: ${msg}`, 'error')
    }
  },

  setPyodideReady: (pyodideReady) => set({ pyodideReady }),
}))
