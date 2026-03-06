import { useState, useEffect, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ArrowLeft, ArrowRightLeft, Copy, Check, X, RotateCcw } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useDataConverterStore } from '@/entities/data-converter/data-converter.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'
import type { DataFormat } from '@/shared/types'

const FORMAT_OPTIONS: DataFormat[] = ['json', 'yaml']

export function DataConverterPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)

  const {
    sourceContent,
    targetContent,
    sourceFormat,
    targetFormat,
    history,
    error,
    setSourceContent,
    setSourceFormat,
    setTargetFormat,
    convert,
    swapFormats,
    formatSource,
    minifySource,
    clearAll,
    hydrate,
  } = useDataConverterStore(
    useShallow((s) => ({
      sourceContent: s.sourceContent,
      targetContent: s.targetContent,
      sourceFormat: s.sourceFormat,
      targetFormat: s.targetFormat,
      history: s.history,
      error: s.error,
      setSourceContent: s.setSourceContent,
      setSourceFormat: s.setSourceFormat,
      setTargetFormat: s.setTargetFormat,
      convert: s.convert,
      swapFormats: s.swapFormats,
      formatSource: s.formatSource,
      minifySource: s.minifySource,
      clearAll: s.clearAll,
      hydrate: s.hydrate,
    }))
  )

  const [copied, setCopied] = useState(false)
  const [validation, setValidation] = useState<'valid' | 'invalid' | null>(null)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const handleCopy = useCallback(async () => {
    if (!targetContent) return
    try {
      await navigator.clipboard.writeText(targetContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }, [targetContent])

  const handleValidate = useCallback(() => {
    if (!sourceContent.trim()) {
      setValidation(null)
      return
    }
    if (sourceFormat === 'json') {
      try {
        JSON.parse(sourceContent)
        setValidation('valid')
      } catch {
        setValidation('invalid')
      }
    } else {
      setValidation(sourceContent.trim() ? 'valid' : 'invalid')
    }
    setTimeout(() => setValidation(null), 3000)
  }, [sourceContent, sourceFormat])

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
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {t('dataConverter.title')}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {t('dataConverter.subtitle')}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Format selectors */}
        <div className="flex items-center justify-center gap-4">
          <select
            value={sourceFormat}
            onChange={(e) => setSourceFormat(e.target.value as DataFormat)}
            className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] uppercase font-medium"
            aria-label="source format"
          >
            {FORMAT_OPTIONS.map((f) => (
              <option key={f} value={f}>{f.toUpperCase()}</option>
            ))}
          </select>

          <Button variant="ghost" size="sm" onClick={swapFormats}>
            <ArrowRightLeft className="w-5 h-5" />
          </Button>

          <select
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value as DataFormat)}
            className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] uppercase font-medium"
            aria-label="target format"
          >
            {FORMAT_OPTIONS.map((f) => (
              <option key={f} value={f}>{f.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Editor panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Source panel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                {t('dataConverter.source')} ({sourceFormat.toUpperCase()})
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={formatSource}>
                  {t('dataConverter.format')}
                </Button>
                <Button variant="ghost" size="sm" onClick={minifySource}>
                  {t('dataConverter.minify')}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleValidate}>
                  {t('dataConverter.validate')}
                </Button>
              </div>
            </div>
            <textarea
              value={sourceContent}
              onChange={(e) => setSourceContent(e.target.value)}
              placeholder={t('dataConverter.sourcePlaceholder')}
              className="w-full h-64 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              aria-label="source input"
            />
            {validation && (
              <div className={`flex items-center gap-1 text-sm ${validation === 'valid' ? 'text-green-500' : 'text-red-500'}`}>
                {validation === 'valid' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {validation === 'valid' ? t('dataConverter.valid') : t('dataConverter.invalid')}
              </div>
            )}
          </div>

          {/* Target panel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                {t('dataConverter.target')} ({targetFormat.toUpperCase()})
              </span>
              <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!targetContent}>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                <span className="ml-1">{t('dataConverter.copy')}</span>
              </Button>
            </div>
            <textarea
              value={targetContent}
              readOnly
              className="w-full h-64 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary,var(--color-bg-secondary))] text-[var(--color-text-primary)] font-mono text-sm resize-none"
              aria-label="target output"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
            <X className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="primary" onClick={convert}>
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            {t('dataConverter.convert')}
          </Button>
          <Button variant="ghost" onClick={clearAll}>
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('dataConverter.clear')}
          </Button>
        </div>

        {/* History */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-[var(--color-text-secondary)]">
            {t('dataConverter.history')}
          </h2>
          {history.length === 0 ? (
            <p className="text-sm text-[var(--color-text-tertiary,var(--color-text-secondary))]">
              {t('dataConverter.noHistory')}
            </p>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-mono font-medium uppercase">
                      {entry.sourceFormat}
                    </span>
                    <ArrowRightLeft className="w-3 h-3 text-[var(--color-text-secondary)]" />
                    <span className="font-mono font-medium uppercase">
                      {entry.targetFormat}
                    </span>
                    <span className="text-[var(--color-text-secondary)]">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSourceContent(entry.sourceContent)
                      setSourceFormat(entry.sourceFormat)
                      setTargetFormat(entry.targetFormat)
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
