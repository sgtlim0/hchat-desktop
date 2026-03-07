// @ts-nocheck
import { useState, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pen,
  Square,
  Circle,
  Type,
  StickyNote,
  Eraser,
  Layout,
  MousePointer,
} from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useWhiteboardStore } from '@/entities/whiteboard/whiteboard.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'

const TOOLS = [
  { id: 'select', icon: MousePointer },
  { id: 'pen', icon: Pen },
  { id: 'rect', icon: Square },
  { id: 'circle', icon: Circle },
  { id: 'text', icon: Type },
  { id: 'sticker', icon: StickyNote },
  { id: 'eraser', icon: Eraser },
] as const

const TEMPLATES = ['blank', 'flowchart', 'mindmap', 'kanban', 'wireframe'] as const

export function WhiteboardPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const {
    boards,
    selectedBoardId,
    activeTool,
    hydrate,
    addBoard,
    deleteBoard,
    selectBoard,
    setActiveTool,
    addElement,
    deleteElement,
  } = useWhiteboardStore(
    useShallow((s) => ({
      boards: s.boards,
      selectedBoardId: s.selectedBoardId,
      activeTool: s.activeTool,
      hydrate: s.hydrate,
      addBoard: s.addBoard,
      deleteBoard: s.deleteBoard,
      selectBoard: s.selectBoard,
      setActiveTool: s.setActiveTool,
      addElement: s.addElement,
      deleteElement: s.deleteElement,
    }))
  )

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTemplate, setNewTemplate] = useState<string>('blank')

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const selectedBoard = boards.find((b) => b.id === selectedBoardId) ?? null

  function handleCreate() {
    if (!newName.trim()) return
    addBoard(newName.trim(), newTemplate)
    setShowCreate(false)
    setNewName('')
    setNewTemplate('blank')
  }

  function handleDelete(id: string) {
    if (confirm((t as any)('whiteboard.deleteConfirm'))) {
      deleteBoard(id)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3 border-b dark:border-zinc-700">
        <button
          onClick={() => setView('home')}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Layout className="w-5 h-5" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{(t as any)('whiteboard.title')}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{(t as any)('whiteboard.subtitle')}</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" />
          {(t as any)('whiteboard.newBoard')}
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Board List */}
        <div className="w-64 border-r dark:border-zinc-700 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto divide-y dark:divide-zinc-700">
            {boards.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center p-4">
                <div>
                  <Layout className="w-10 h-10 mx-auto mb-2 text-zinc-400" />
                  <p className="text-sm text-zinc-500">{(t as any)('whiteboard.empty')}</p>
                </div>
              </div>
            ) : (
              boards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => selectBoard(board.id)}
                  className={`w-full text-left p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                    selectedBoardId === board.id ? 'bg-zinc-100 dark:bg-zinc-800' : ''
                  }`}
                >
                  <p className="text-sm font-medium truncate">{board.name}</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {board.elements?.length ?? 0} {(t as any)('whiteboard.elements')}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedBoard ? (
            <>
              {/* Toolbar */}
              <div className="flex items-center gap-1 px-4 py-2 border-b dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
                {TOOLS.map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTool(id)}
                    className={`p-2 rounded ${
                      activeTool === id
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                    title={(t as any)(`whiteboard.tool.${id}`)}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>

              {/* Canvas */}
              <div className="flex-1 relative bg-zinc-50 dark:bg-zinc-900 overflow-auto">
                <div className="min-h-full min-w-full p-8">
                  {(selectedBoard.elements ?? []).length === 0 ? (
                    <div className="flex items-center justify-center h-96 text-zinc-400 text-sm">
                      {(t as any)('whiteboard.canvasEmpty')}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedBoard.elements.map((el) => (
                        <div
                          key={el.id}
                          className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-800 rounded border dark:border-zinc-700"
                        >
                          <span className="px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                            {el.type}
                          </span>
                          <span className="text-sm flex-1 truncate">{el.content || el.type}</span>
                          <button
                            onClick={() => deleteElement(selectedBoard.id, el.id)}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Layout className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                <p className="text-zinc-500">{(t as any)('whiteboard.selectBoard')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md p-6 m-4">
            <h2 className="text-lg font-semibold mb-4">{(t as any)('whiteboard.newBoard')}</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={(t as any)('whiteboard.namePlaceholder')}
                className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
              />
              <div>
                <label className="text-sm font-medium mb-1 block">{(t as any)('whiteboard.template')}</label>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map((tpl) => (
                    <button
                      key={tpl}
                      onClick={() => setNewTemplate(tpl)}
                      className={`px-3 py-1.5 text-xs rounded ${
                        newTemplate === tpl
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {(t as any)(`whiteboard.tpl.${tpl}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                onClick={() => { setShowCreate(false); setNewName(''); }}
                className="bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
              >
                {t('common.cancel')}
              </Button>
              <Button onClick={handleCreate}>{t('common.save')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
