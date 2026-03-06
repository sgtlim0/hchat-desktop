import { useCallback, useEffect } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Globe, Trash2 } from 'lucide-react'
import { useVoiceChatStore } from '@/entities/voice-chat/voice-chat.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useTranslation } from '@/shared/i18n'
import { createStream, getProviderConfig } from '@/shared/lib/providers/factory'
import * as stt from '@/shared/lib/stt'
import * as tts from '@/shared/lib/tts'
import type { VoiceTranscript } from '@/shared/types'

export function VoiceChatPage() {
  const { t } = useTranslation()
  const voiceState = useVoiceChatStore((s) => s.voiceState)
  const transcripts = useVoiceChatStore((s) => s.transcripts)
  const currentInterim = useVoiceChatStore((s) => s.currentInterim)
  const language = useVoiceChatStore((s) => s.language)
  const autoListen = useVoiceChatStore((s) => s.autoListen)
  const setVoiceState = useVoiceChatStore((s) => s.setVoiceState)
  const addTranscript = useVoiceChatStore((s) => s.addTranscript)
  const setCurrentInterim = useVoiceChatStore((s) => s.setCurrentInterim)
  const clearTranscripts = useVoiceChatStore((s) => s.clearTranscripts)
  const toggleAutoListen = useVoiceChatStore((s) => s.toggleAutoListen)
  const setLanguage = useVoiceChatStore((s) => s.setLanguage)
  const selectedModel = useSettingsStore((s) => s.selectedModel)

  const startListening = useCallback(() => {
    if (!stt.isSupported()) return
    setVoiceState('listening')
    setCurrentInterim('')
    stt.startListening(
      (text, isFinal) => {
        if (isFinal) {
          setCurrentInterim('')
          const userTranscript: VoiceTranscript = {
            id: crypto.randomUUID(), role: 'user', text, timestamp: new Date().toISOString(),
          }
          addTranscript(userTranscript)
          stt.stopListening()
          handleAiResponse(text)
        } else {
          setCurrentInterim(text)
        }
      },
      () => {
        if (useVoiceChatStore.getState().voiceState === 'listening') {
          setVoiceState('idle')
        }
      },
      language,
    )
  }, [language, setVoiceState, setCurrentInterim, addTranscript])

  const handleAiResponse = useCallback(async (userText: string) => {
    setVoiceState('processing')
    try {
      const settings = useSettingsStore.getState()
      const config = getProviderConfig(selectedModel, {
        credentials: settings.credentials,
        openaiApiKey: settings.openaiApiKey,
        geminiApiKey: settings.geminiApiKey,
      })
      const msgs = [{ role: 'user' as const, content: userText }]
      const stream = createStream(config, { modelId: selectedModel, messages: msgs })
      let full = ''
      for await (const event of stream) {
        if (event.type === 'text') full += event.content ?? ''
      }
      const aiTranscript: VoiceTranscript = {
        id: crypto.randomUUID(), role: 'assistant', text: full, timestamp: new Date().toISOString(),
      }
      addTranscript(aiTranscript)
      setVoiceState('speaking')
      tts.speak(full, language)
      const checkDone = setInterval(() => {
        if (!tts.isSpeaking()) {
          clearInterval(checkDone)
          setVoiceState('idle')
          if (useVoiceChatStore.getState().autoListen) startListening()
        }
      }, 300)
    } catch {
      setVoiceState('idle')
    }
  }, [selectedModel, language, addTranscript, setVoiceState, startListening])

  const stopAll = useCallback(() => {
    stt.stopListening()
    tts.stop()
    setVoiceState('idle')
  }, [setVoiceState])

  useEffect(() => () => { stt.stopListening(); tts.stop() }, [])

  const stateColors: Record<string, string> = {
    idle: 'bg-surface-secondary',
    listening: 'bg-red-500/20 ring-2 ring-red-500',
    processing: 'bg-amber-500/20 ring-2 ring-amber-500',
    speaking: 'bg-primary/20 ring-2 ring-primary',
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-2xl font-bold text-text-primary">{t('voiceChat.title')}</h1>
      <p className="text-text-secondary text-sm">{t(`voiceChat.state.${voiceState}`)}</p>

      {/* Voice orb */}
      <button
        onClick={voiceState === 'idle' ? startListening : stopAll}
        className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${stateColors[voiceState]}`}
      >
        {voiceState === 'idle' && <Mic className="w-12 h-12 text-text-primary" />}
        {voiceState === 'listening' && <MicOff className="w-12 h-12 text-red-500 animate-pulse" />}
        {voiceState === 'processing' && <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />}
        {voiceState === 'speaking' && <Volume2 className="w-12 h-12 text-primary animate-pulse" />}
      </button>

      {currentInterim && (
        <p className="text-text-secondary text-sm italic animate-pulse">{currentInterim}</p>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        <button onClick={voiceState === 'idle' ? startListening : stopAll} className="p-2 rounded-lg bg-surface-secondary hover:bg-surface-tertiary" aria-label={voiceState === 'idle' ? t('voiceChat.start') : t('voiceChat.stop')}>
          {voiceState === 'idle' ? <Phone className="w-5 h-5 text-green-500" /> : <PhoneOff className="w-5 h-5 text-red-500" />}
        </button>
        <button onClick={toggleAutoListen} className={`p-2 rounded-lg ${autoListen ? 'bg-primary/20 text-primary' : 'bg-surface-secondary text-text-tertiary'}`} aria-label={t('voiceChat.autoListen')}>
          {autoListen ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
        <button onClick={() => setLanguage(language === 'ko-KR' ? 'en-US' : 'ko-KR')} className="p-2 rounded-lg bg-surface-secondary hover:bg-surface-tertiary" aria-label={t('voiceChat.language')}>
          <Globe className="w-5 h-5 text-text-secondary" />
        </button>
        <button onClick={clearTranscripts} className="p-2 rounded-lg bg-surface-secondary hover:bg-surface-tertiary" aria-label={t('voiceChat.clear')}>
          <Trash2 className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      <p className="text-xs text-text-tertiary">{language === 'ko-KR' ? '한국어' : 'English'}</p>

      {/* Transcript list */}
      <div className="w-full max-w-lg flex-1 overflow-y-auto space-y-3">
        {transcripts.map((tr) => (
          <div key={tr.id} className={`flex ${tr.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${tr.role === 'user' ? 'bg-primary text-white' : 'bg-surface-secondary text-text-primary'}`}>
              {tr.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
