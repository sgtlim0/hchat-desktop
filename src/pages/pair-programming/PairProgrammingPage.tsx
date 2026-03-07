// @ts-nocheck
import { useState, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ArrowLeft, Plus, Play, Check, X, Code, Users, Trash2 } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { usePairProgrammingStore } from '@/entities/pair-programming/pair-programming.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'go', 'rust',
  'html', 'css', 'sql', 'bash', 'other',
]

export function PairProgrammingPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const {
    sessions,
    selectedSessionId,
    hydrate,
    createSession,
    deleteSession,
    selectSession,
    updateCode,
    requestSuggestion,
    acceptSuggestion,
    rejectSuggestion,
  } = usePairProgrammingStore(
    useShallow((s) => ({
      sessions: s.sessions,
      selectedSessionId: s.selectedSessionId,
      hydrate: s.hydrate,
      createSession: s.createSession,
      deleteSession: s.deleteSession,
      selectSession: s.selectSession,
      updateCode: s.updateCode,
      requestSuggestion: s.requestSuggestion,
      acceptSuggestion: s.acceptSuggestion,
      rejectSuggestion: s.rejectSuggestion,
    }))
  )

  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newLanguage, setNewLanguage] = useState('typescript')

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const selected = sessions.find((s) => s.id === selectedSessionId) ?? null

  function handleCreate() {
    if (!newName.trim()) return
    createSession(newName.trim(), newLanguage)
    setShowModal(false)
    setNewName('')
    setNewLanguage('typescript')
  }

  function handleDelete(id: string) {
    if (confirm(t('pairProgramming.deleteConfirm'))) {
      deleteSession(id)
    }
  }

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
        <Users className="w-5 h-5" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{t('pairProgramming.title')}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('pairProgramming.subtitle')}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" />
          {t('pairProgramming.newSession')}
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Session List */}
        <div className="w-72 border-r dark:border-zinc-700 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            {sessions.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center p-4">
                <div>
                  <Code className="w-10 h-10 mx-auto mb-2 text-zinc-400" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('pairProgramming.empty')}</p>
                </div>
              </div>
            ) : (
              <div className="divide-y dark:divide-zinc-700">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => selectSession(session.id)}
                    className={`w-full text-left p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 group ${
                      selectedSessionId === session.id ? 'bg-zinc-100 dark:bg-zinc-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate flex-1">{session.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(session.id) }}
                        className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="px-1.5 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      {session.language}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Code Editor + Suggestions */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Language badge + request AI */}
              <div className="flex items-center gap-2 px-4 py-2 border-b dark:border-zinc-700">
                <span className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  {selected.language}
                </span>
                <div className="flex-1" />
                <Button size="sm" onClick={() => requestSuggestion(selected.id)}>
                  <Play className="w-4 h-4 mr-1" />
                  {t('pairProgramming.requestAI')}
                </Button>
              </div>

              {/* Code textarea */}
              <div className="flex-1 overflow-hidden flex">
                <textarea
                  value={selected.code}
                  onChange={(e) => updateCode(selected.id, e.target.value)}
                  placeholder={t('pairProgramming.codePlaceholder')}
                  spellCheck={false}
                  className="flex-1 p-4 font-mono text-sm bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 resize-none outline-none border-r dark:border-zinc-700"
                />

                {/* Suggestions Panel */}
                <div className="w-80 flex flex-col overflow-hidden">
                  <div className="px-3 py-2 border-b dark:border-zinc-700 text-sm font-medium">
                    {t('pairProgramming.suggestions')}
                    {selected.suggestions.length > 0 && (
                      <span className="ml-1 text-xs text-zinc-400">({selected.suggestions.length})</span>
                    )}
                  </div>
                  <div className="flex-1 overflow-auto">
                    {selected.suggestions.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-center p-4">
                        <p className="text-xs text-zinc-400">{t('pairProgramming.noSuggestions')}</p>
                      </div>
                    ) : (
                      <div className="divide-y dark:divide-zinc-700">
                        {selected.suggestions.map((suggestion) => (
                          <div key={suggestion.id} className="p-3">
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                              {(t as any)(`pairProgramming.type.${suggestion.type}`)}
                            </p>
                            <pre className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 p-2 rounded mb-2 overflow-auto max-h-24">
                              {suggestion.code}
                            </pre>
                            <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-2">{suggestion.description}</p>
                            {suggestion.status === 'pending' && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => acceptSuggestion(selected.id, suggestion.id)}
                                  className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                                >
                                  <Check className="w-3 h-3" />
                                  {t('pairProgramming.accept')}
                                </button>
                                <button
                                  onClick={() => rejectSuggestion(selected.id, suggestion.id)}
                                  className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                                >
                                  <X className="w-3 h-3" />
                                  {t('pairProgramming.reject')}
                                </button>
                              </div>
                            )}
                            {suggestion.status !== 'pending' && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                suggestion.status === 'accepted'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              }`}>
                                {(t as any)(`pairProgramming.status.${suggestion.status}`)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Code className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                <p className="text-zinc-500 dark:text-zinc-400">{t('pairProgramming.selectSession')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Session Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md p-6 m-4">
            <h2 className="text-lg font-semibold mb-4">{t('pairProgramming.newSession')}</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('pairProgramming.sessionName')}
                className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
              />
              <select
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
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
