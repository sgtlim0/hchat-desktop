// STT (Speech-to-Text) — Web Speech Recognition wrapper

// Define proper types for SpeechRecognition API
interface SpeechRecognitionResult {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((event: Event) => void) | null
  start(): void
  stop(): void
  abort(): void
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

let recognition: SpeechRecognition | null = null

export function isSupported(): boolean {
  if (typeof window === 'undefined') return false
  const windowWithSpeech = window as WindowWithSpeech
  return Boolean(
    windowWithSpeech.SpeechRecognition ||
    windowWithSpeech.webkitSpeechRecognition
  )
}

export function startListening(
  onResult: (text: string, isFinal: boolean) => void,
  onEnd?: () => void,
  lang = 'ko-KR'
): void {
  if (!isSupported()) return
  stopListening()

  const windowWithSpeech = window as WindowWithSpeech
  const SpeechRecognition =
    windowWithSpeech.SpeechRecognition ||
    windowWithSpeech.webkitSpeechRecognition

  if (!SpeechRecognition) return

  recognition = new SpeechRecognition()
  if (!recognition) return

  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = lang

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let finalTranscript = ''
    let interimTranscript = ''

    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i]
      if (result.isFinal) {
        finalTranscript += result[0].transcript
      } else {
        interimTranscript += result[0].transcript
      }
    }

    if (finalTranscript) {
      onResult(finalTranscript, true)
    } else if (interimTranscript) {
      onResult(interimTranscript, false)
    }
  }

  recognition.onend = () => {
    recognition = null
    onEnd?.()
  }

  recognition.onerror = () => {
    recognition = null
    onEnd?.()
  }

  recognition.start()
}

export function stopListening(): void {
  if (recognition) {
    try {
      recognition.stop()
    } catch {
      // already stopped
    }
    recognition = null
  }
}

export function isListening(): boolean {
  return recognition !== null
}