import { useState, useRef, useCallback, useEffect } from 'react'
import { ArrowLeft, Upload, Loader2, Copy, Download, Trash2, ImageIcon } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'
import { initOcrWorker, recognizeImage, terminateWorker, type OcrLang } from '@/shared/lib/ocr'

const OCR_LANGUAGES: { id: OcrLang; labelKey: string }[] = [
  { id: 'kor+eng', labelKey: 'ocr.lang.korEng' },
  { id: 'eng', labelKey: 'ocr.lang.eng' },
  { id: 'jpn+eng', labelKey: 'ocr.lang.jpnEng' },
  { id: 'chi_sim+eng', labelKey: 'ocr.lang.zhEng' },
]

type OcrFileStatus = 'pending' | 'processing' | 'done' | 'error'

interface OcrFile {
  id: string
  file: File
  name: string
  status: OcrFileStatus
  progress: number
  text: string
  error?: string
}

const MAX_FILES = 20
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/bmp', 'image/webp']

export function OcrPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)

  const [lang, setLang] = useState<OcrLang>('kor+eng')
  const [files, setFiles] = useState<OcrFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef(false)

  useEffect(() => {
    return () => {
      terminateWorker()
    }
  }, [])

  function addFiles(fileList: FileList | File[]) {
    const newFiles = Array.from(fileList)
      .filter((f) => ACCEPTED_TYPES.includes(f.type))
      .slice(0, MAX_FILES - files.length)
      .map((f) => ({
        id: `ocr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        file: f,
        name: f.name,
        status: 'pending' as OcrFileStatus,
        progress: 0,
        text: '',
      }))
    setFiles((prev) => [...prev, ...newFiles])
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    addFiles(e.dataTransfer.files)
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const startOcr = useCallback(async () => {
    const pending = files.filter((f) => f.status === 'pending')
    if (pending.length === 0) return

    setIsLoading(true)
    abortRef.current = false

    try {
      await initOcrWorker(lang)
      setIsLoading(false)
      setIsProcessing(true)

      for (const ocrFile of pending) {
        if (abortRef.current) break

        setFiles((prev) =>
          prev.map((f) => (f.id === ocrFile.id ? { ...f, status: 'processing', progress: 0 } : f))
        )

        try {
          const text = await recognizeImage(ocrFile.file, (progress) => {
            setFiles((prev) =>
              prev.map((f) => (f.id === ocrFile.id ? { ...f, progress } : f))
            )
          })

          setFiles((prev) =>
            prev.map((f) => (f.id === ocrFile.id ? { ...f, status: 'done', progress: 100, text } : f))
          )
        } catch (error) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === ocrFile.id
                ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'OCR failed' }
                : f
            )
          )
        }
      }
    } catch (error) {
      setIsLoading(false)
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'pending'
            ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Worker init failed' }
            : f
        )
      )
    } finally {
      setIsProcessing(false)
      setIsLoading(false)
    }
  }, [files, lang])

  function handleStop() {
    abortRef.current = true
  }

  function getAllText(): string {
    return files
      .filter((f) => f.status === 'done' && f.text)
      .map((f) => `--- ${f.name} ---\n${f.text}`)
      .join('\n\n')
  }

  function handleCopyAll() {
    const text = getAllText()
    if (text) navigator.clipboard.writeText(text)
  }

  function handleDownloadTxt() {
    const text = getAllText()
    if (!text) return
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ocr-result.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasResults = files.some((f) => f.status === 'done' && f.text)
  const hasPending = files.some((f) => f.status === 'pending')

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <button onClick={() => setView('home')} className="p-2 hover:bg-hover rounded-lg transition">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">{t('ocr.title')}</h1>
          <p className="text-sm text-text-secondary">{t('ocr.desc')}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Language selector */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">{t('ocr.language')}</label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as OcrLang)}
            disabled={isProcessing}
            className="px-3 py-2 border border-border rounded-lg bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {OCR_LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>{t(l.labelKey as Parameters<typeof t>[0])}</option>
            ))}
          </select>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-hover/30 transition"
        >
          <Upload size={32} className="mx-auto text-text-tertiary mb-2" />
          <p className="text-sm text-text-secondary">{t('ocr.dropzone')}</p>
          <p className="text-xs text-text-tertiary mt-1">{t('ocr.dropzone.hint')}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/bmp,image/webp"
            multiple
            onChange={(e) => e.target.files && addFiles(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Action buttons */}
        {files.length > 0 && (
          <div className="flex items-center gap-3">
            {hasPending && !isProcessing && (
              <Button onClick={startOcr} disabled={isLoading}>
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                {isLoading ? t('ocr.loading') : t('ocr.start')}
              </Button>
            )}
            {isProcessing && (
              <Button variant="secondary" onClick={handleStop}>
                {t('translate.stop')}
              </Button>
            )}
          </div>
        )}

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-4 py-3 border border-border rounded-lg bg-surface">
                <ImageIcon size={16} className="text-text-tertiary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{f.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs ${
                      f.status === 'done' ? 'text-green-500' :
                      f.status === 'error' ? 'text-red-500' :
                      f.status === 'processing' ? 'text-blue-500' :
                      'text-text-tertiary'
                    }`}>
                      {t(`ocr.status.${f.status}` as Parameters<typeof t>[0])}
                    </span>
                    {f.status === 'processing' && (
                      <div className="flex-1 h-1.5 bg-hover rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeFile(f.id)}
                  className="p-1.5 hover:bg-hover rounded-lg transition"
                  disabled={f.status === 'processing'}
                >
                  <Trash2 size={14} className="text-text-tertiary" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {hasResults && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-text-primary">{t('ocr.result')}</h3>
            <div className="border border-border rounded-lg bg-surface p-4 max-h-[40vh] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-text-primary font-mono">
                {getAllText()}
              </pre>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={handleCopyAll}>
                <Copy size={14} />
                {t('ocr.copyAll')}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDownloadTxt}>
                <Download size={14} />
                {t('ocr.downloadTxt')}
              </Button>
            </div>
          </div>
        )}

        {files.length === 0 && (
          <p className="text-sm text-text-tertiary text-center py-8">{t('ocr.noResult')}</p>
        )}
      </div>
    </div>
  )
}
