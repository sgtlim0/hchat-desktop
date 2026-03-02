import { useState, useCallback } from 'react'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useSessionStore } from '@/entities/session/session.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'
import { Download } from 'lucide-react'

type ImageProvider = 'dalle' | 'gemini'
type ImageSize = '1024x1024' | '1024x1792' | '1792x1024'
type DalleStyle = 'vivid' | 'natural'

interface GeneratedImage {
  url: string
  provider: ImageProvider
  prompt: string
  size: ImageSize
}

export function ImageGenPage() {
  const { t } = useTranslation()
  const goHome = useSessionStore((s) => s.goHome)
  const openaiApiKey = useSettingsStore((s) => s.openaiApiKey)

  const [provider, setProvider] = useState<ImageProvider>('dalle')
  const [prompt, setPrompt] = useState('')
  const [size, setSize] = useState<ImageSize>('1024x1024')
  const [style, setStyle] = useState<DalleStyle>('vivid')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return

    if (provider === 'dalle' && !openaiApiKey) {
      setError(t('imageGen.noApiKey'))
      return
    }

    if (provider === 'gemini') {
      setError(t('imageGen.comingSoon'))
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedImage(null)

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt.trim(),
          n: 1,
          size,
          style,
          response_format: 'url',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `API error: ${response.status}`)
      }

      const data = await response.json()
      if (data.data?.[0]?.url) {
        setGeneratedImage({
          url: data.data[0].url,
          provider,
          prompt,
          size,
        })
      } else {
        throw new Error('No image URL in response')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, isGenerating, provider, openaiApiKey, size, style, t])

  const handleDownload = useCallback(async () => {
    if (!generatedImage) return

    try {
      const response = await fetch(generatedImage.url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hchat-image-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
    }
  }, [generatedImage])

  return (
    <div className="flex flex-col h-full bg-page">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <button
          onClick={goHome}
          className="p-1.5 rounded-lg hover:bg-hover transition-colors text-text-secondary"
          aria-label={t('common.back')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-text-primary">{t('imageGen.title')}</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Controls Panel */}
        <div className="w-96 border-r border-border overflow-y-auto p-6 flex-shrink-0 space-y-6">
          {/* Provider selector */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('imageGen.provider')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setProvider('dalle')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  provider === 'dalle'
                    ? 'bg-primary text-white'
                    : 'bg-card text-text-secondary hover:bg-hover'
                }`}
              >
                DALL-E 3
              </button>
              <button
                onClick={() => setProvider('gemini')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  provider === 'gemini'
                    ? 'bg-primary text-white'
                    : 'bg-card text-text-secondary hover:bg-hover'
                }`}
              >
                Gemini Imagen
              </button>
            </div>
          </div>

          {/* Prompt input */}
          <div>
            <label htmlFor="prompt-input" className="block text-sm font-medium text-text-primary mb-2">
              {t('imageGen.prompt')}
            </label>
            <textarea
              id="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('imageGen.promptPlaceholder')}
              rows={6}
              className="w-full p-3 bg-input border border-border-input rounded-lg text-sm text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Size selector */}
          <div>
            <label htmlFor="size-select" className="block text-sm font-medium text-text-primary mb-2">
              {t('imageGen.size')}
            </label>
            <select
              id="size-select"
              value={size}
              onChange={(e) => setSize(e.target.value as ImageSize)}
              className="w-full p-2.5 bg-input border border-border-input rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="1024x1024">1024 × 1024 (Square)</option>
              <option value="1024x1792">1024 × 1792 (Portrait)</option>
              <option value="1792x1024">1792 × 1024 (Landscape)</option>
            </select>
          </div>

          {/* Style selector (DALL-E only) */}
          {provider === 'dalle' && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('imageGen.style')}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setStyle('vivid')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    style === 'vivid'
                      ? 'bg-primary text-white'
                      : 'bg-card text-text-secondary hover:bg-hover'
                  }`}
                >
                  {t('imageGen.vivid')}
                </button>
                <button
                  onClick={() => setStyle('natural')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    style === 'natural'
                      ? 'bg-primary text-white'
                      : 'bg-card text-text-secondary hover:bg-hover'
                  }`}
                >
                  {t('imageGen.natural')}
                </button>
              </div>
            </div>
          )}

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating || (provider === 'dalle' && !openaiApiKey)}
            className="w-full"
            variant="primary"
            size="md"
          >
            {isGenerating ? t('imageGen.generating') : t('imageGen.generate')}
          </Button>

          {/* Error display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* Result Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
          {!generatedImage && !isGenerating && (
            <div className="text-center">
              <div className="text-6xl mb-4">🎨</div>
              <p className="text-text-secondary text-sm">
                {provider === 'dalle' && !openaiApiKey
                  ? t('imageGen.noApiKey')
                  : t('imageGen.promptPlaceholder')}
              </p>
            </div>
          )}

          {isGenerating && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-text-secondary text-sm">{t('imageGen.generating')}</p>
            </div>
          )}

          {generatedImage && (
            <div className="flex flex-col items-center gap-4 max-w-full max-h-full">
              <div className="relative max-w-full max-h-[calc(100vh-200px)] flex items-center justify-center">
                <img
                  src={generatedImage.url}
                  alt={generatedImage.prompt}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleDownload}
                  variant="secondary"
                  size="md"
                  className="gap-2"
                >
                  <Download size={16} />
                  {t('imageGen.download')}
                </Button>
              </div>
              <p className="text-xs text-text-tertiary text-center max-w-md">
                {generatedImage.prompt}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
