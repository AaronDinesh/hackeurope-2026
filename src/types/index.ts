export type ThemePreference = 'light' | 'dark' | 'system'

export interface ApiEndpointConfig {
  baseUrl: string
  textInput: string
  voiceInput: string
  export: string
  generateFinal: string
}

export interface MiroAuthTokens {
  accessToken: string
  refreshToken: string
  tokenExpiresAt: number | null
  defaultBoardId?: string
}

export type MessageRole = 'user' | 'assistant' | 'system'

export interface MessageMetadata {
  taskType?: 'mood_board' | 'storyboard' | 'final'
  colorPalette?: Array<{ label: string; hex: string }>
  boardIds?: string[]
}

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  metadata?: MessageMetadata
}

export interface BoardSummary {
  id: string
  name: string
  type: 'mood_board' | 'storyboard' | 'output' | 'unknown'
  createdAt: number
  thumbnailUrl?: string
}

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastAction {
  label: string
  onClick?: () => void
}

export interface Toast {
  id: string
  type: ToastType
  message: string
  action?: ToastAction
  duration?: number
}

export interface AppConfigState {
  api: ApiEndpointConfig
  theme: ThemePreference
  hasCompletedOnboarding: boolean
  miro: MiroAuthTokens | null
}

export interface VoiceRecordingState {
  isRecording: boolean
  duration: number
  audioBlob: Blob | null
}
