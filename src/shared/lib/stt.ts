// STT (Speech-to-Text) — Web Speech Recognition wrapper

/* eslint-disable @typescript-eslint/no-explicit-any */

let recognition: any = null

export function isSupported(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  )
}

export function startListening(
  onResult: (text: string, isFinal: boolean) => void,
  onEnd?: () => void,
  lang = 'ko-KR'
): void {
  if (!isSupported()) return
  stopListening()

  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition

  recognition = new SpeechRecognition()
  if (!recognition) return

  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = lang

  recognition.onresult = (event: any) => {
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
