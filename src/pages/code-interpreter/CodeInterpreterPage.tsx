import { useEffect } from 'react'
import { Plus, Trash2, Play, FileCode, BookOpen, Code } from 'lucide-react'
import { useCodeInterpreterStore } from '@/entities/code-interpreter/code-interpreter.store'
import { useTranslation } from '@/shared/i18n'
import type { CodeLanguage } from '@/shared/types'

const LANG_COLORS: Record<CodeLanguage, string> = { python: 'text-blue-500', javascript: 'text-yellow-500' }

export function CodeInterpreterPage() {
  const { t } = useTranslation()
  const notebooks = useCodeInterpreterStore((s) => s.notebooks)
  const currentNotebookId = useCodeInterpreterStore((s) => s.currentNotebookId)
  const hydrate = useCodeInterpreterStore((s) => s.hydrate)
  const createNotebook = useCodeInterpreterStore((s) => s.createNotebook)
  const deleteNotebook = useCodeInterpreterStore((s) => s.deleteNotebook)
  const selectNotebook = useCodeInterpreterStore((s) => s.selectNotebook)
  const addCell = useCodeInterpreterStore((s) => s.addCell)
  const updateCellCode = useCodeInterpreterStore((s) => s.updateCellCode)
  const executeCell = useCodeInterpreterStore((s) => s.executeCell)
  const removeCell = useCodeInterpreterStore((s) => s.removeCell)

  useEffect(() => { hydrate() }, [hydrate])

  const currentNb = notebooks.find((n) => n.id === currentNotebookId)

  // Notebook list
  if (!currentNb) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <FileCode className="w-6 h-6 text-primary" />{t('codeInterpreter.title')}
        </h1>
        <p className="text-text-secondary text-sm">{t('codeInterpreter.description')}</p>
        <button onClick={() => createNotebook(t('codeInterpreter.untitled'))} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg">
          <Plus className="w-4 h-4" />{t('codeInterpreter.newNotebook')}
        </button>
        {notebooks.length > 0 && (
          <div className="w-full max-w-md space-y-2 mt-4">
            {notebooks.map((nb) => (
              <div key={nb.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary hover:bg-surface-tertiary cursor-pointer" onClick={() => selectNotebook(nb.id)}>
                <div>
                  <span className="text-sm text-text-primary">{nb.title}</span>
                  <span className="text-xs text-text-tertiary ml-2">{nb.cells.length} cells</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteNotebook(nb.id) }} className="p-1 hover:bg-red-500/10 rounded">
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <button onClick={() => useCodeInterpreterStore.setState({ currentNotebookId: null })} className="text-sm text-text-secondary hover:text-text-primary">&larr;</button>
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-text-primary">{currentNb.title}</span>
          <span className="text-xs text-text-tertiary">{currentNb.cells.length} cells</span>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => addCell('javascript')} className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-500/10 text-yellow-600 rounded hover:bg-yellow-500/20">
            <Code className="w-3 h-3" />JS
          </button>
          <button onClick={() => addCell('python')} className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500/10 text-blue-600 rounded hover:bg-blue-500/20">
            <Code className="w-3 h-3" />Python
          </button>
        </div>
      </div>

      {/* Cells */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentNb.cells.length === 0 && (
          <div className="flex items-center justify-center h-40 text-text-tertiary text-sm">{t('codeInterpreter.emptyCells')}</div>
        )}
        {currentNb.cells.map((cell, i) => (
          <div key={cell.id} className="border border-border rounded-lg overflow-hidden">
            {/* Cell header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-surface-secondary/50 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-text-tertiary">In [{i + 1}]</span>
                <span className={`text-[10px] font-medium ${LANG_COLORS[cell.language]}`}>{cell.language}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => executeCell(cell.id)} className="p-1 rounded hover:bg-green-500/10" aria-label="Run">
                  <Play className="w-3.5 h-3.5 text-green-500" />
                </button>
                <button onClick={() => removeCell(cell.id)} className="p-1 rounded hover:bg-red-500/10" aria-label={t('common.delete')}>
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
            {/* Code input */}
            <textarea
              value={cell.code}
              onChange={(e) => updateCellCode(cell.id, e.target.value)}
              placeholder={cell.language === 'python' ? 'print("Hello")' : 'return 2 + 3'}
              className="w-full px-3 py-2 text-sm font-mono bg-[#1e1e1e] text-[#d4d4d4] resize-none focus:outline-none min-h-[60px]"
              rows={Math.max(3, cell.code.split('\n').length)}
              spellCheck={false}
            />
            {/* Output */}
            {cell.output && (
              <div className={`px-3 py-2 text-xs font-mono border-t border-border ${cell.status === 'error' ? 'bg-red-500/5 text-red-500' : 'bg-surface-secondary text-text-primary'}`}>
                <span className="text-[10px] text-text-tertiary">Out [{i + 1}]: </span>
                <pre className="whitespace-pre-wrap mt-0.5">{cell.output}</pre>
              </div>
            )}
            {cell.status === 'running' && (
              <div className="px-3 py-2 border-t border-border bg-amber-500/5">
                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
