import type { VoiceInputCallbacks, VoiceInputService } from './VoiceInputService'

interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: { transcript: string }
}
interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | undefined {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

let recognition: SpeechRecognitionLike | null = null

export const webSpeechService: VoiceInputService = {
  isSupported() {
    return typeof window !== 'undefined' && !!getRecognitionCtor()
  },

  start(callbacks: VoiceInputCallbacks) {
    const Ctor = getRecognitionCtor()
    if (!Ctor) {
      callbacks.onError('Voice input isn’t supported in this browser. Try typing instead.')
      return
    }

    recognition = new Ctor()
    recognition.lang = 'en-IN'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let transcript = ''
      let isFinal = false
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        transcript += result[0].transcript
        if (result.isFinal) isFinal = true
      }
      callbacks.onResult(transcript, isFinal)
    }

    recognition.onerror = (event) => {
      callbacks.onError(event.error === 'no-speech' ? 'Didn’t catch that — try again.' : 'Voice recognition error. Try typing instead.')
    }

    recognition.onend = () => callbacks.onEnd()

    recognition.start()
  },

  stop() {
    recognition?.stop()
    recognition = null
  },
}
