// @ts-nocheck
import { useState, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ArrowLeft, Languages, Play, Square, Trash2, ChevronRight, Clock } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useLiveTranslateStore } from '@/entities/live-translate/live-translate.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'

const LANGUAGES = [
  { code: 'ko', label: 'Korean' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
]

export function LiveTranslatePage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)

  const {
    sessions,
    selectedSessionId,
    hydrate,
    createSession,
    deleteSession,
    selectSession,
    toggleActive,
    setSourceLang,
    setTargetLang,
    addTranscriptEntry,
  } = useLiveTranslateStore(
    useShallow((s) => ({
      sessions: s.sessions,
      selectedSessionId: s.selectedSessionId,
      hydrate: s.hydrate,
      createSession: s.createSession,
      deleteSession: s.deleteSession,
      selectSession: s.selectSession,
      toggleActive: s.toggleActive,
      setSourceLang: s.setSourceLang,
      setTargetLang: s.setTargetLang,
      addTranscriptEntry: s.addTranscriptEntry,
    }))
  )

  const [inputText, setInputText] = useState('')

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const selected = sessions.find((s) => s.id === selectedSessionId) ?? null

  function handleCreate() {
    createSession((t as any)('liveTranslate.newSession'))
  }

  function handleDelete(id: string) {
    if (confirm((t as any)('liveTranslate.deleteConfirm'))) {
      deleteSession(id)
    }
  }

  function handleSend() {
    if (!inputText.trim() || !selectedSessionId) return
    addTranscriptEntry(selectedSessionId, inputText.trim(), `[translated] ${inputText.trim()}`)
    setInputText('')
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-primary)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setView('home')}
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Languages className="w-5 h-5 text-[var(--color-accent)]" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {(t as any)('liveTranslate.title')}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {(t as any)('liveTranslate.subtitle')}
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-1">
          <Play className="w-4 h-4" />
          {(t as any)('liveTranslate.new')}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Session List */}
        <div className="w-80 border-r border-[var(--color-border)] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            {sessions.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center p-4">
                <div>
                  <Languages className="w-10 h-10 mx-auto mb-2 text-zinc-400" />
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {(t as any)('liveTranslate.empty')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => selectSession(session.id)}
                    className={`w-full text-left p-3 hover:bg-[var(--color-bg-secondary)] ${
                      selectedSessionId === session.id ? 'bg-[var(--color-bg-secondary)]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate flex-1">{session.name}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          session.isActive ? 'bg-green-500' : 'bg-zinc-400'
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                      <span>{session.sourceLang} → {session.targetLang}</span>
                      <span>{session.transcript.length} entries</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Detail */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Session Controls */}
              <div className="p-4 border-b border-[var(--color-border)] space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {selected.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(selected.id)}
                    >
                      {selected.isActive ? (
                        <><Square className="w-4 h-4 mr-1 text-red-500" />{(t as any)('liveTranslate.stop')}</>
                      ) : (
                        <><Play className="w-4 h-4 mr-1 text-green-500" />{(t as any)('liveTranslate.start')}</>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(selected.id)}
                      className="text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Language Selectors */}
                <div className="flex items-center gap-3">
                  <select
                    value={selected.sourceLang}
                    onChange={(e) => setSourceLang(selected.id, e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm"
                    aria-label="source language"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                  <ChevronRight className="w-4 h-4 text-[var(--color-text-secondary)]" />
                  <select
                    value={selected.targetLang}
                    onChange={(e) => setTargetLang(selected.id, e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm"
                    aria-label="target language"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Transcript Timeline */}
              <div className="flex-1 overflow-auto p-4 space-y-3">
                {selected.transcript.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {(t as any)('liveTranslate.noTranscript')}
                    </p>
                  </div>
                ) : (
                  selected.transcript.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]"
                    >
                      <div className="flex items-center gap-2 mb-2 text-xs text-[var(--color-text-secondary)]">
                        <Clock className="w-3 h-3" />
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                      <p className="text-sm text-[var(--color-text-primary)] mb-1">{entry.original}</p>
                      <p className="text-sm text-[var(--color-accent)] font-medium">{entry.translated}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-[var(--color-border)]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={(t as any)('liveTranslate.inputPlaceholder')}
                    className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm"
                    disabled={!selected.isActive}
                  />
                  <Button onClick={handleSend} disabled={!selected.isActive || !inputText.trim()}>
                    {(t as any)('liveTranslate.send')}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Languages className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                <p className="text-[var(--color-text-secondary)]">
                  {(t as any)('liveTranslate.selectSession')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
