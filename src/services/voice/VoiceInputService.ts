export interface VoiceInputCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void
  onError: (message: string) => void
  onEnd: () => void
}

/**
 * Backend-agnostic voice capture. `webSpeechService` (the default) wraps the browser's Web
 * Speech API. A future implementation could stream audio to a cloud STT/LLM API instead —
 * nothing in the voice UI needs to change, since it only depends on this interface.
 */
export interface VoiceInputService {
  isSupported(): boolean
  start(callbacks: VoiceInputCallbacks): void
  stop(): void
}
