import { useState, useRef, useCallback } from 'react'
import { ArrowLeft, Upload, X, Download, Copy, Loader2, RotateCcw, FileText, StopCircle } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useTranslateStore } from '@/entities/translate/translate.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'
import { extractFileText, splitIntoChunks, translateChunk, buildTranslateSystemPrompt } from '@/shared/lib/translate'
import { getProviderConfig } from '@/shared/lib/providers/factory'
import type { TranslateEngine } from '@/entities/translate/translate.store'

const LANG_OPTIONS = [
  { value: 'auto', key: 'translate.langAuto' },
  { value: 'ko', key: 'translate.langKo' },
  { value: 'en', key: 'translate.langEn' },
  { value: 'ja', key: 'translate.langJa' },
  { value: 'zh', key: 'translate.langZh' },
  { value: 'es', key: 'translate.langEs' },
  { value: 'fr', key: 'translate.langFr' },
  { value: 'de', key: 'translate.langDe' },
] as const

const TARGET_LANG_OPTIONS = LANG_OPTIONS.filter((o) => o.value !== 'auto')

const ACCEPT_TYPES = '.pdf,.txt,.md,.markdown,.text'

export function TranslatePage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const selectedModel = useSettingsStore((s) => s.selectedModel)
  const credentials = useSettingsStore((s) => s.credentials)
  const openaiApiKey = useSettingsStore((s) => s.openaiApiKey)
  const geminiApiKey = useSettingsStore((s) => s.geminiApiKey)

  const {
    engine, sourceLang, targetLang, files, isProcessing,
    setEngine, setSourceLang, setTargetLang,
    addFiles, removeFile, updateFile, setProcessing, clearAll,
  } = useTranslateStore()

  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const selectedFile = files.find((f) => f.id === selectedFileId)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  function processFileList(fileList: FileList) {
    const validFiles = Array.from(fileList).filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
      return ['pdf', 'txt', 'md', 'markdown', 'text'].includes(ext)
    })
    if (validFiles.length > 0) {
      addFiles(validFiles.map((f) => ({ name: f.name, size: f.size, type: f.type })))
      // Store actual File objects for later extraction
      validFiles.forEach((f) => {
        const storeFiles = useTranslateStore.getState().files
        const storeFile = storeFiles[storeFiles.length - validFiles.length + validFiles.indexOf(f)]
        if (storeFile) {
          fileObjectMap.current.set(storeFile.id, f)
        }
      })
    }
  }

  const fileObjectMap = useRef<Map<string, File>>(new Map())

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      processFileList(e.dataTransfer.files)
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      processFileList(e.target.files)
      e.target.value = ''
    }
  }

  function handleRemoveFile(id: string) {
    removeFile(id)
    fileObjectMap.current.delete(id)
    if (selectedFileId === id) {
      setSelectedFileId(null)
    }
  }

  async function handleStartTranslation() {
    if (files.length === 0 || isProcessing) return

    const abortController = new AbortController()
    abortRef.current = abortController
    setProcessing(true)

    const config = getProviderConfig(selectedModel, {
      credentials,
      openaiApiKey,
      geminiApiKey,
    })

    const systemPrompt = buildTranslateSystemPrompt(sourceLang, targetLang)

    try {
      for (const file of files) {
        if (abortController.signal.aborted) break
        if (file.status === 'done') continue

        const rawFile = fileObjectMap.current.get(file.id)
        if (!rawFile) {
          updateFile(file.id, { status: 'error', error: 'File not found' })
          continue
        }

        // Extract text
        updateFile(file.id, { status: 'extracting', progress: 0 })
        let text: string
        try {
          text = await extractFileText(rawFile)
          updateFile(file.id, { originalText: text, progress: 10 })
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Extraction failed'
          updateFile(file.id, { status: 'error', error: msg })
          continue
        }

        // Split and translate
        updateFile(file.id, { status: 'translating', progress: 10 })
        const chunks = splitIntoChunks(text)
        const translatedParts: string[] = []

        try {
          for (let i = 0; i < chunks.length; i++) {
            if (abortController.signal.aborted) break

            const translated = await translateChunk(
              chunks[i],
              systemPrompt,
              config,
              selectedModel,
              abortController.signal,
              (partial) => {
                const baseProgress = 10 + ((i / chunks.length) * 85)
                const chunkProgress = (partial.length / (chunks[i].length * 1.2)) * (85 / chunks.length)
                updateFile(file.id, {
                  translatedText: [...translatedParts, partial].join(''),
                  progress: Math.min(95, Math.round(baseProgress + chunkProgress)),
                })
              }
            )
            translatedParts.push(translated)
          }

          if (!abortController.signal.aborted) {
            updateFile(file.id, {
              status: 'done',
              progress: 100,
              translatedText: translatedParts.join(''),
            })
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') break
          const msg = err instanceof Error ? err.message : 'Translation failed'
          updateFile(file.id, {
            status: 'error',
            error: msg,
            translatedText: translatedParts.join(''),
          })
        }
      }
    } finally {
      setProcessing(false)
      abortRef.current = null
    }
  }

  function handleStop() {
    abortRef.current?.abort()
    setProcessing(false)
  }

  function handleReset() {
    abortRef.current?.abort()
    clearAll()
    fileObjectMap.current.clear()
    setSelectedFileId(null)
  }

  function handleDownload(file: { name: string; translatedText: string }) {
    const blob = new Blob([file.translatedText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name.replace(/\.[^.]+$/, '') + '_translated.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="h-[52px] border-b border-border px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('home')}
            className="p-1.5 hover:bg-hover rounded-lg transition"
          >
            <ArrowLeft size={18} className="text-text-secondary" />
          </button>
          <h1 className="text-sm font-semibold text-text-primary">{t('translate.title')}</h1>
        </div>
        {files.length > 0 && (
          <Button variant="secondary" size="sm" onClick={handleReset}>
            <RotateCcw size={14} />
            {t('translate.clearAll')}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Description */}
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-text-secondary text-center">{t('translate.description')}</p>
        </div>

        {/* Settings row */}
        <div className="max-w-3xl mx-auto flex flex-wrap gap-4">
          {/* Engine */}
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs text-text-tertiary mb-1 block">{t('translate.engine')}</label>
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value as TranslateEngine)}
              disabled={isProcessing}
              className="w-full px-3 py-2 rounded-lg border border-border-input bg-input text-sm text-text-primary outline-none focus:border-primary"
            >
              <option value="llm">{t('translate.engineLLM')}</option>
              <option value="direct">{t('translate.engineDirect')}</option>
            </select>
          </div>

          {/* Source Language */}
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs text-text-tertiary mb-1 block">{t('translate.sourceLang')}</label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              disabled={isProcessing}
              className="w-full px-3 py-2 rounded-lg border border-border-input bg-input text-sm text-text-primary outline-none focus:border-primary"
            >
              {LANG_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{t(opt.key)}</option>
              ))}
            </select>
          </div>

          {/* Target Language */}
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs text-text-tertiary mb-1 block">{t('translate.targetLang')}</label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              disabled={isProcessing}
              className="w-full px-3 py-2 rounded-lg border border-border-input bg-input text-sm text-text-primary outline-none focus:border-primary"
            >
              {TARGET_LANG_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{t(opt.key)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dropzone */}
        <div className="max-w-3xl mx-auto">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-hover/50'
            }`}
          >
            <Upload size={32} className="mx-auto text-text-tertiary mb-2" />
            <p className="text-sm text-text-secondary">{t('translate.dropzone')}</p>
            <p className="text-xs text-text-tertiary mt-1">{t('translate.dropzoneHint')}</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_TYPES}
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="max-w-3xl mx-auto space-y-2">
            <p className="text-xs text-text-tertiary">
              {t('translate.fileCount', { count: String(files.length) })}
            </p>
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => setSelectedFileId(file.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition cursor-pointer ${
                  selectedFileId === file.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-hover/50'
                }`}
              >
                <FileText size={18} className="text-text-tertiary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{file.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-text-tertiary">{formatSize(file.size)}</span>
                    <span className={`text-xs font-medium ${
                      file.status === 'done' ? 'text-success' :
                      file.status === 'error' ? 'text-danger' :
                      file.status === 'translating' || file.status === 'extracting' ? 'text-primary' :
                      'text-text-tertiary'
                    }`}>
                      {t(`translate.status.${file.status}`)}
                    </span>
                    {file.error && (
                      <span className="text-xs text-danger truncate">{file.error}</span>
                    )}
                  </div>
                  {/* Progress bar */}
                  {(file.status === 'extracting' || file.status === 'translating') && (
                    <div className="mt-1.5 h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {file.status === 'done' && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(file) }}
                        className="p-1.5 hover:bg-hover rounded-lg transition"
                        title={t('translate.download')}
                      >
                        <Download size={14} className="text-text-secondary" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopy(file.translatedText) }}
                        className="p-1.5 hover:bg-hover rounded-lg transition"
                        title={t('translate.copyResult')}
                      >
                        <Copy size={14} className="text-text-secondary" />
                      </button>
                    </>
                  )}
                  {!isProcessing && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveFile(file.id) }}
                      className="p-1.5 hover:bg-hover rounded-lg transition"
                    >
                      <X size={14} className="text-text-secondary" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Result preview */}
        {selectedFile && selectedFile.translatedText && (
          <div className="max-w-3xl mx-auto">
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-hover/50 border-b border-border flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary">
                  {selectedFile.name} — {t(`translate.status.${selectedFile.status}`)}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleCopy(selectedFile.translatedText)}
                    className="p-1 hover:bg-hover rounded transition"
                  >
                    <Copy size={12} className="text-text-tertiary" />
                  </button>
                  <button
                    onClick={() => handleDownload(selectedFile)}
                    className="p-1 hover:bg-hover rounded transition"
                  >
                    <Download size={12} className="text-text-tertiary" />
                  </button>
                </div>
              </div>
              <div className="px-4 py-3 max-h-[400px] overflow-y-auto">
                <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                  {selectedFile.translatedText}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      {files.length > 0 && (
        <div className="px-4 pb-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            {isProcessing ? (
              <Button variant="secondary" onClick={handleStop} className="w-full gap-2">
                <StopCircle size={16} />
                {t('translate.stop')}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleStartTranslation}
                disabled={files.every((f) => f.status === 'done')}
                className="w-full gap-2"
              >
                <Loader2 size={16} className={isProcessing ? 'animate-spin' : ''} />
                {t('translate.start')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
