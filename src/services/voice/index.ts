import { webSpeechService } from './webSpeechService'
import type { VoiceInputService } from './VoiceInputService'

export const voiceInputService: VoiceInputService = webSpeechService

export * from './VoiceInputService'
