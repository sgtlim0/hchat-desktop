import { useState, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ArrowLeft, Save, Trash2, Star, BookOpen, Search } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useRegexBuilderStore } from '@/entities/regex-builder/regex-builder.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'

const FLAG_OPTIONS = [
  { flag: 'g', label: 'Global' },
  { flag: 'i', label: 'Case Insensitive' },
  { flag: 'm', label: 'Multiline' },
  { flag: 's', label: 'Dotall' },
] as const

const CHEATSHEET = [
  { syntax: '.', desc: 'Any character except newline' },
  { syntax: '*', desc: 'Zero or more' },
  { syntax: '+', desc: 'One or more' },
  { syntax: '?', desc: 'Zero or one' },
  { syntax: '\\d', desc: 'Digit [0-9]' },
  { syntax: '\\w', desc: 'Word character [a-zA-Z0-9_]' },
  { syntax: '\\s', desc: 'Whitespace' },
  { syntax: '[abc]', desc: 'Character set' },
  { syntax: '[^abc]', desc: 'Negated set' },
  { syntax: '(abc)', desc: 'Capture group' },
  { syntax: 'a|b', desc: 'Alternation' },
  { syntax: '^', desc: 'Start of string' },
  { syntax: '$', desc: 'End of string' },
  { syntax: '{n,m}', desc: 'Between n and m times' },
  { syntax: '(?=...)', desc: 'Positive lookahead' },
  { syntax: '(?!...)', desc: 'Negative lookahead' },
] as const

export function RegexBuilderPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const {
    patterns,
    currentPattern,
    currentFlags,
    testInput,
    selectedPatternId,
    setPattern,
    setFlags,
    setTestInput,
    savePattern,
    deletePattern,
    selectPattern,
    toggleFavorite,
    getMatches,
  } = useRegexBuilderStore(
    useShallow((s) => ({
      patterns: s.patterns,
      currentPattern: s.currentPattern,
      currentFlags: s.currentFlags,
      testInput: s.testInput,
      selectedPatternId: s.selectedPatternId,
      setPattern: s.setPattern,
      setFlags: s.setFlags,
      setTestInput: s.setTestInput,
      savePattern: s.savePattern,
      deletePattern: s.deletePattern,
      selectPattern: s.selectPattern,
      toggleFavorite: s.toggleFavorite,
      getMatches: s.getMatches,
    }))
  )

  const [showCheatsheet, setShowCheatsheet] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)

  const matches = useMemo(() => getMatches(), [getMatches, currentPattern, currentFlags, testInput])

  function handleToggleFlag(flag: string) {
    if (currentFlags.includes(flag)) {
      setFlags(currentFlags.replace(flag, ''))
    } else {
      setFlags(currentFlags + flag)
    }
  }

  function handleSave() {
    if (!showSaveInput) {
      setShowSaveInput(true)
      return
    }
    if (!saveName.trim() || !currentPattern) return
    savePattern(saveName.trim())
    setSaveName('')
    setShowSaveInput(false)
  }

  function handleDelete(id: string) {
    if (confirm(t('regex.deleteConfirm'))) {
      deletePattern(id)
    }
  }

  function buildHighlightedText(): React.ReactNode[] {
    if (!testInput || matches.length === 0) {
      return [<span key="no-match">{testInput}</span>]
    }

    const result: React.ReactNode[] = []
    let lastIndex = 0

    const sortedMatches = [...matches].sort((a, b) => a.index - b.index)

    for (const match of sortedMatches) {
      if (match.index > lastIndex) {
        result.push(
          <span key={`text-${lastIndex}`}>
            {testInput.slice(lastIndex, match.index)}
          </span>
        )
      }
      result.push(
        <span
          key={`match-${match.index}`}
          className="bg-yellow-200 dark:bg-yellow-700 rounded px-0.5"
        >
          {match.text}
        </span>
      )
      lastIndex = match.index + match.text.length
    }

    if (lastIndex < testInput.length) {
      result.push(
        <span key={`text-${lastIndex}`}>
          {testInput.slice(lastIndex)}
        </span>
      )
    }

    return result
  }

  const isRegexValid = useMemo(() => {
    if (!currentPattern) return true
    try {
      new RegExp(currentPattern, currentFlags)
      return true
    } catch {
      return false
    }
  }, [currentPattern, currentFlags])

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
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{t('regex.title')}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('regex.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowCheatsheet(!showCheatsheet)}
          className={`p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${showCheatsheet ? 'bg-zinc-200 dark:bg-zinc-700' : ''}`}
          title={t('regex.cheatsheet')}
        >
          <BookOpen className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 overflow-auto">
        {/* Pattern Input */}
        <div className="p-4 border-b dark:border-zinc-700">
          <label className="block text-sm font-medium mb-2">{t('regex.pattern')}</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono">/</span>
              <input
                type="text"
                value={currentPattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder={t('regex.patternPlaceholder')}
                className={`w-full pl-7 pr-3 py-2 font-mono border rounded dark:bg-zinc-800 ${
                  !isRegexValid
                    ? 'border-red-500 dark:border-red-500'
                    : 'dark:border-zinc-700'
                }`}
                data-testid="pattern-input"
              />
            </div>
            <span className="text-zinc-400 font-mono">/</span>
            <span className="font-mono text-sm text-zinc-500">{currentFlags}</span>
          </div>

          {/* Flags */}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{t('regex.flags')}:</span>
            {FLAG_OPTIONS.map(({ flag, label }) => (
              <label key={flag} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentFlags.includes(flag)}
                  onChange={() => handleToggleFlag(flag)}
                  className="rounded"
                  data-testid={`flag-${flag}`}
                />
                <span className="text-sm font-mono">{flag}</span>
                <span className="text-xs text-zinc-400 hidden sm:inline">({label})</span>
              </label>
            ))}
          </div>

          {/* Save */}
          <div className="flex items-center gap-2 mt-3">
            {showSaveInput && (
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder={t('regex.namePlaceholder')}
                className="flex-1 px-3 py-1.5 text-sm border dark:border-zinc-700 rounded dark:bg-zinc-800"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                data-testid="save-name-input"
              />
            )}
            <Button
              onClick={handleSave}
              disabled={!currentPattern || (showSaveInput && !saveName.trim())}
              className="flex items-center gap-1 text-sm"
            >
              <Save className="w-4 h-4" />
              {t('regex.save')}
            </Button>
          </div>
        </div>

        {/* Cheatsheet */}
        {showCheatsheet && (
          <div className="p-4 border-b dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
            <h3 className="text-sm font-semibold mb-2">{t('regex.cheatsheet')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CHEATSHEET.map(({ syntax, desc }) => (
                <div key={syntax} className="text-xs">
                  <code className="font-mono text-blue-600 dark:text-blue-400">{syntax}</code>
                  <span className="text-zinc-500 dark:text-zinc-400 ml-1">- {desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Input with Highlights */}
        <div className="p-4 border-b dark:border-zinc-700">
          <label className="block text-sm font-medium mb-2">{t('regex.testInput')}</label>
          <textarea
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder={t('regex.testInputPlaceholder')}
            rows={4}
            className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800 font-mono text-sm resize-y"
            data-testid="test-input"
          />

          {/* Highlighted preview */}
          {testInput && currentPattern && isRegexValid && (
            <div className="mt-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded border dark:border-zinc-700 font-mono text-sm whitespace-pre-wrap break-all">
              {buildHighlightedText()}
            </div>
          )}
        </div>

        {/* Bottom: Matches + Saved Patterns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-0">
          {/* Match Results */}
          <div className="p-4 border-b md:border-b-0 md:border-r dark:border-zinc-700">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Search className="w-4 h-4" />
              {t('regex.matches')}
              {matches.length > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  {t('regex.matchCount').replace('{count}', String(matches.length))}
                </span>
              )}
            </h3>

            {matches.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('regex.noMatches')}</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-auto">
                {matches.map((match, idx) => (
                  <div
                    key={`${match.index}-${idx}`}
                    className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded border dark:border-zinc-700 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <code className="font-mono text-blue-600 dark:text-blue-400">
                        &quot;{match.text}&quot;
                      </code>
                      <span className="text-xs text-zinc-400">index: {match.index}</span>
                    </div>
                    {match.groups && Object.keys(match.groups).length > 0 && (
                      <div className="mt-1 text-xs text-zinc-500">
                        {t('regex.groups')}: {JSON.stringify(match.groups)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Saved Patterns */}
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-2">{t('regex.savedPatterns')}</h3>

            {patterns.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('regex.empty')}</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-auto">
                {patterns.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => selectPattern(p.id)}
                    className={`p-2 rounded border cursor-pointer transition-colors ${
                      selectedPatternId === p.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{p.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(p.id)
                          }}
                          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
                          title="Favorite"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              p.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-400'
                            }`}
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(p.id)
                          }}
                          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
                        </button>
                      </div>
                    </div>
                    <code className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                      /{p.pattern}/{p.flags}
                    </code>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
