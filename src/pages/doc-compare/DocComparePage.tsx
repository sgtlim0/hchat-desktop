// @ts-nocheck
import { useState, useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ArrowLeft, Plus, Trash2, FileDiff, GitCompare } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useDocCompareStore } from '@/entities/doc-compare/doc-compare.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'

function computeDiff(a: string, b: string): Array<{ type: 'same' | 'added' | 'removed' | 'changed'; lineA: string; lineB: string }> {
  const linesA = a.split('\n')
  const linesB = b.split('\n')
  const maxLen = Math.max(linesA.length, linesB.length)
  const result: Array<{ type: 'same' | 'added' | 'removed' | 'changed'; lineA: string; lineB: string }> = []

  for (let i = 0; i < maxLen; i++) {
    const la = linesA[i] ?? ''
    const lb = linesB[i] ?? ''
    if (i >= linesA.length) {
      result.push({ type: 'added', lineA: '', lineB: lb })
    } else if (i >= linesB.length) {
      result.push({ type: 'removed', lineA: la, lineB: '' })
    } else if (la === lb) {
      result.push({ type: 'same', lineA: la, lineB: lb })
    } else {
      result.push({ type: 'changed', lineA: la, lineB: lb })
    }
  }
  return result
}

const DIFF_COLORS = {
  same: '',
  added: 'bg-green-50 dark:bg-green-900/20',
  removed: 'bg-red-50 dark:bg-red-900/20',
  changed: 'bg-amber-50 dark:bg-amber-900/20',
} as const

const DIFF_TEXT_COLORS = {
  same: 'text-zinc-700 dark:text-zinc-300',
  added: 'text-green-700 dark:text-green-400',
  removed: 'text-red-700 dark:text-red-400 line-through',
  changed: 'text-amber-700 dark:text-amber-400',
} as const

export function DocComparePage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const {
    comparisons,
    selectedComparisonId,
    hydrate,
    createComparison,
    deleteComparison,
    selectComparison,
    updateDocA,
    updateDocB,
  } = useDocCompareStore(
    useShallow((s) => ({
      comparisons: s.comparisons,
      selectedComparisonId: s.selectedComparisonId,
      hydrate: s.hydrate,
      createComparison: s.createComparison,
      deleteComparison: s.deleteComparison,
      selectComparison: s.selectComparison,
      updateDocA: s.updateDocA,
      updateDocB: s.updateDocB,
    }))
  )

  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [viewMode, setViewMode] = useState<'edit' | 'diff'>('edit')

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const selected = comparisons.find((c) => c.id === selectedComparisonId) ?? null

  const diffResult = useMemo(() => {
    if (!selected) return []
    return computeDiff(selected.docA, selected.docB)
  }, [selected?.docA, selected?.docB])

  function handleCreate() {
    if (!newName.trim()) return
    createComparison(newName.trim())
    setShowModal(false)
    setNewName('')
  }

  function handleDelete(id: string) {
    if (confirm(t('docCompare.deleteConfirm'))) {
      deleteComparison(id)
    }
  }

  const stats = useMemo(() => {
    const added = diffResult.filter((d) => d.type === 'added').length
    const removed = diffResult.filter((d) => d.type === 'removed').length
    const changed = diffResult.filter((d) => d.type === 'changed').length
    return { added, removed, changed }
  }, [diffResult])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b dark:border-zinc-700">
        <button
          onClick={() => setView('home')}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <GitCompare className="w-5 h-5" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{t('docCompare.title')}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('docCompare.subtitle')}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" />
          {t('docCompare.newComparison')}
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Comparison List */}
        <div className="w-64 border-r dark:border-zinc-700 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            {comparisons.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center p-4">
                <div>
                  <FileDiff className="w-10 h-10 mx-auto mb-2 text-zinc-400" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('docCompare.empty')}</p>
                </div>
              </div>
            ) : (
              <div className="divide-y dark:divide-zinc-700">
                {comparisons.map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => selectComparison(comp.id)}
                    className={`w-full text-left p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 group ${
                      selectedComparisonId === comp.id ? 'bg-zinc-100 dark:bg-zinc-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate flex-1">{comp.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(comp.id) }}
                        className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-xs text-zinc-400">{new Date(comp.createdAt).toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Diff View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Toolbar */}
              <div className="flex items-center gap-2 px-4 py-2 border-b dark:border-zinc-700">
                <div className="flex rounded overflow-hidden border dark:border-zinc-700">
                  <button
                    onClick={() => setViewMode('edit')}
                    className={`px-3 py-1 text-xs ${
                      viewMode === 'edit' ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'
                    }`}
                  >
                    {t('docCompare.editMode')}
                  </button>
                  <button
                    onClick={() => setViewMode('diff')}
                    className={`px-3 py-1 text-xs ${
                      viewMode === 'diff' ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'
                    }`}
                  >
                    {t('docCompare.diffMode')}
                  </button>
                </div>
                <div className="flex-1" />
                <span className="text-xs text-green-600">+{stats.added}</span>
                <span className="text-xs text-red-600">-{stats.removed}</span>
                <span className="text-xs text-amber-600">~{stats.changed}</span>
              </div>

              {viewMode === 'edit' ? (
                <div className="flex flex-1 overflow-hidden">
                  {/* Document A */}
                  <div className="flex-1 flex flex-col border-r dark:border-zinc-700">
                    <div className="px-3 py-1.5 border-b dark:border-zinc-700 text-xs font-medium text-zinc-500">
                      {t('docCompare.documentA')}
                    </div>
                    <textarea
                      value={selected.docA}
                      onChange={(e) => updateDocA(selected.id, e.target.value)}
                      placeholder={t('docCompare.enterDocA')}
                      className="flex-1 p-3 text-sm bg-transparent resize-none outline-none font-mono"
                    />
                  </div>
                  {/* Document B */}
                  <div className="flex-1 flex flex-col">
                    <div className="px-3 py-1.5 border-b dark:border-zinc-700 text-xs font-medium text-zinc-500">
                      {t('docCompare.documentB')}
                    </div>
                    <textarea
                      value={selected.docB}
                      onChange={(e) => updateDocB(selected.id, e.target.value)}
                      placeholder={t('docCompare.enterDocB')}
                      className="flex-1 p-3 text-sm bg-transparent resize-none outline-none font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-auto">
                  <div className="grid grid-cols-2">
                    {/* Header */}
                    <div className="px-3 py-1.5 border-b border-r dark:border-zinc-700 text-xs font-medium text-zinc-500 sticky top-0 bg-white dark:bg-zinc-900">
                      {t('docCompare.documentA')}
                    </div>
                    <div className="px-3 py-1.5 border-b dark:border-zinc-700 text-xs font-medium text-zinc-500 sticky top-0 bg-white dark:bg-zinc-900">
                      {t('docCompare.documentB')}
                    </div>
                    {/* Diff lines */}
                    {diffResult.map((line, idx) => (
                      <div key={idx} className="contents">
                        <div className={`px-3 py-0.5 border-r dark:border-zinc-700 font-mono text-xs ${DIFF_COLORS[line.type]}`}>
                          <span className="text-zinc-400 mr-2 select-none">{idx + 1}</span>
                          <span className={DIFF_TEXT_COLORS[line.type === 'added' ? 'same' : line.type]}>
                            {line.lineA || '\u00A0'}
                          </span>
                        </div>
                        <div className={`px-3 py-0.5 font-mono text-xs ${DIFF_COLORS[line.type]}`}>
                          <span className="text-zinc-400 mr-2 select-none">{idx + 1}</span>
                          <span className={DIFF_TEXT_COLORS[line.type === 'removed' ? 'same' : line.type]}>
                            {line.lineB || '\u00A0'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <FileDiff className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                <p className="text-zinc-500 dark:text-zinc-400">{t('docCompare.selectComparison')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Comparison Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md p-6 m-4">
            <h2 className="text-lg font-semibold mb-4">{t('docCompare.newComparison')}</h2>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('docCompare.namePlaceholder')}
              className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => { setShowModal(false); setNewName('') }}>
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
