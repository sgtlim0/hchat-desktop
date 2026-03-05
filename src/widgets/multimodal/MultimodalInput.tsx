import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from '@/shared/i18n'
import { Camera, Mic, Image, X, Upload, StopCircle } from 'lucide-react'
import type { MultimodalAttachment } from '@/shared/types'

interface MultimodalInputProps {
  onAttach: (attachment: MultimodalAttachment) => void
  onClose: () => void
}

type TabType = 'image' | 'camera' | 'audio'

export function MultimodalInput({ onAttach, onClose }: MultimodalInputProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabType>('image')

  // Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Camera capture state
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<number | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Error state
  const [error, setError] = useState<string | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop())
      }
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [cameraStream, imagePreview, capturedImage, audioUrl])

  // Image Upload handlers
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(t('multimodal.errorInvalidImage'))
      return
    }

    // Validate file size (10MB)
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      setError(t('multimodal.errorFileSize'))
      return
    }

    setError(null)
    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setImagePreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }, [t])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(t('multimodal.errorInvalidImage'))
      return
    }

    // Validate file size (10MB)
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      setError(t('multimodal.errorFileSize'))
      return
    }

    setError(null)
    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setImagePreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }, [t])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const handleAttachImage = useCallback(() => {
    if (!selectedFile || !imagePreview) return

    const attachment: MultimodalAttachment = {
      id: crypto.randomUUID(),
      type: 'image',
      name: selectedFile.name,
      url: imagePreview,
      mimeType: selectedFile.type,
      size: selectedFile.size,
      thumbnail: imagePreview,
    }

    onAttach(attachment)
    onClose()
  }, [selectedFile, imagePreview, onAttach, onClose])

  // Camera capture handlers
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError(t('multimodal.errorCameraPermission'))
      } else if (err instanceof Error && err.name === 'NotFoundError') {
        setError(t('multimodal.errorCameraNotFound'))
      } else {
        setError(t('multimodal.errorCameraGeneric'))
      }
    }
  }, [t])

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
    }
  }, [cameraStream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/png')
    setCapturedImage(dataUrl)
    stopCamera()
  }, [stopCamera])

  const retakePhoto = useCallback(() => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage)
    }
    setCapturedImage(null)
    startCamera()
  }, [capturedImage, startCamera])

  const handleAttachCamera = useCallback(() => {
    if (!capturedImage) return

    const attachment: MultimodalAttachment = {
      id: crypto.randomUUID(),
      type: 'camera',
      name: `capture-${Date.now()}.png`,
      url: capturedImage,
      mimeType: 'image/png',
      size: capturedImage.length, // Approximate size
      thumbnail: capturedImage,
    }

    onAttach(attachment)
    onClose()
  }, [capturedImage, onAttach, onClose])

  // Audio recording handlers
  const startRecording = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingDuration(0)

      // Start timer
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError(t('multimodal.errorMicPermission'))
      } else if (err instanceof Error && err.name === 'NotFoundError') {
        setError(t('multimodal.errorMicNotFound'))
      } else {
        setError(t('multimodal.errorMicGeneric'))
      }
    }
  }, [t])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }, [isRecording])

  const handleAttachAudio = useCallback(() => {
    if (!audioBlob || !audioUrl) return

    const attachment: MultimodalAttachment = {
      id: crypto.randomUUID(),
      type: 'audio',
      name: `recording-${Date.now()}.webm`,
      url: audioUrl,
      mimeType: 'audio/webm',
      size: audioBlob.size,
      transcription: undefined, // Placeholder for future transcription
    }

    onAttach(attachment)
    onClose()
  }, [audioBlob, audioUrl, onAttach, onClose])

  // Tab change handler
  const handleTabChange = useCallback((tab: TabType) => {
    // Cleanup previous tab state
    if (activeTab === 'camera' && cameraStream) {
      stopCamera()
    }
    if (activeTab === 'audio' && isRecording) {
      stopRecording()
    }

    setActiveTab(tab)
    setError(null)

    // Initialize new tab
    if (tab === 'camera' && !capturedImage) {
      startCamera()
    }
  }, [activeTab, cameraStream, isRecording, capturedImage, stopCamera, stopRecording, startCamera])

  // Initialize camera on mount if camera tab is active
  useEffect(() => {
    if (activeTab === 'camera' && !capturedImage && !cameraStream) {
      startCamera()
    }
  }, [activeTab, capturedImage, cameraStream, startCamera])

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">{t('multimodal.title')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hover rounded-lg transition"
            aria-label={t('common.close')}
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => handleTabChange('image')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === 'image'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-hover'
            }`}
          >
            <Image size={18} />
            {t('multimodal.imageTab')}
          </button>
          <button
            onClick={() => handleTabChange('camera')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === 'camera'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-hover'
            }`}
          >
            <Camera size={18} />
            {t('multimodal.cameraTab')}
          </button>
          <button
            onClick={() => handleTabChange('audio')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === 'audio'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-hover'
            }`}
          >
            <Mic size={18} />
            {t('multimodal.audioTab')}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-500/10 border-b border-red-500/30">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Image Upload Tab */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              {!imagePreview ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-hover/50 transition cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={48} className="text-text-tertiary" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-text-primary">{t('multimodal.uploadPrompt')}</p>
                    <p className="text-xs text-text-tertiary mt-1">{t('multimodal.uploadHint')}</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-hover">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setImagePreview(null)
                        setSelectedFile(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                      className="flex-1 px-4 py-2 rounded-lg border border-border bg-hover text-text-secondary hover:bg-border transition text-sm font-medium"
                    >
                      {t('multimodal.changeImage')}
                    </button>
                    <button
                      onClick={handleAttachImage}
                      className="flex-1 px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition text-sm font-medium"
                    >
                      {t('multimodal.attach')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Camera Capture Tab */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              {!capturedImage ? (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  <button
                    onClick={capturePhoto}
                    disabled={!cameraStream}
                    className="w-full px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('multimodal.capture')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-hover">
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={retakePhoto}
                      className="flex-1 px-4 py-2 rounded-lg border border-border bg-hover text-text-secondary hover:bg-border transition text-sm font-medium"
                    >
                      {t('multimodal.retake')}
                    </button>
                    <button
                      onClick={handleAttachCamera}
                      className="flex-1 px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition text-sm font-medium"
                    >
                      {t('multimodal.attach')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Audio Recording Tab */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center gap-6 py-8">
                {isRecording && (
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-4 animate-pulse">
                      <Mic size={48} className="text-red-500" />
                    </div>
                    <p className="text-2xl font-mono font-semibold text-text-primary">
                      {formatDuration(recordingDuration)}
                    </p>
                    <p className="text-sm text-text-tertiary mt-1">{t('multimodal.recording')}</p>
                  </div>
                )}

                {!isRecording && !audioUrl && (
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-hover flex items-center justify-center mb-4">
                      <Mic size={48} className="text-text-tertiary" />
                    </div>
                    <p className="text-sm text-text-secondary">{t('multimodal.audioPrompt')}</p>
                  </div>
                )}

                {!isRecording && audioUrl && (
                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex-1 bg-hover rounded-lg p-4">
                        <audio controls src={audioUrl} className="w-full">
                          <track kind="captions" />
                        </audio>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-text-secondary">
                        {t('multimodal.audioDuration')}: {formatDuration(recordingDuration)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {!audioUrl ? (
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-full px-4 py-2 rounded-lg text-white hover:opacity-90 transition text-sm font-medium flex items-center justify-center gap-2 ${
                      isRecording ? 'bg-red-500' : 'bg-primary'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <StopCircle size={18} />
                        {t('multimodal.stopRecording')}
                      </>
                    ) : (
                      <>
                        <Mic size={18} />
                        {t('multimodal.startRecording')}
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        if (audioUrl) {
                          URL.revokeObjectURL(audioUrl)
                        }
                        setAudioUrl(null)
                        setAudioBlob(null)
                        setRecordingDuration(0)
                      }}
                      className="flex-1 px-4 py-2 rounded-lg border border-border bg-hover text-text-secondary hover:bg-border transition text-sm font-medium"
                    >
                      {t('multimodal.rerecord')}
                    </button>
                    <button
                      onClick={handleAttachAudio}
                      className="flex-1 px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition text-sm font-medium"
                    >
                      {t('multimodal.attach')}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
