export type ThemePreference = 'light' | 'dark' | 'system'

export interface SectionEndpoint {
  fetch: string
  regenerate: string
}

export interface ApiEndpointConfig {
  baseUrl: string
  textInput: string
  voiceInput: string
  moodBoard: SectionEndpoint
  storyboard: SectionEndpoint
  hexCodes: SectionEndpoint
  constraints: SectionEndpoint & {
    create?: string
    update?: string
    delete?: string
  }
  summary: SectionEndpoint
  finalImage: string
  finalVideo: string
  download: string
}

export type MessageRole = 'user' | 'assistant' | 'system'

export interface MessageMetadata {
  referencedSection?: 'mood_board' | 'storyboard' | 'hex_codes' | 'constraints' | 'summary' | 'final'
  palette?: HexColor[]
}

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  metadata?: MessageMetadata
}

export interface MoodBoardImage {
  id: string
  imageUrl: string
  title?: string
  description?: string
  promptSnippet?: string
}

export interface StoryboardScene {
  id: string
  imageUrl: string
  title: string
  description?: string
  order: number
  timestamp?: string
}

export interface HexColor {
  id: string
  name?: string
  hex: string
}

export type ConstraintSource = 'user' | 'ai'

export interface Constraint {
  id: string
  text: string
  source: ConstraintSource
  active: boolean
  createdAt: number
}

export interface SummaryDoc {
  id: string
  content: string
  updatedAt: number
  source: ConstraintSource
}

export type FinalOutputType = 'image' | 'video'

export interface FinalOutput {
  id: string
  type: FinalOutputType
  previewUrl: string
  downloadUrl?: string
  createdAt: number
  format: string
  notes?: string
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
}

export interface VoiceRecordingState {
  isRecording: boolean
  duration: number
  audioBlob: Blob | null
}

export interface SectionState<T> {
  data: T
  isLoading: boolean
  error: string | null
  updatedAt: number | null
}
