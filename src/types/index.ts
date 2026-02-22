export type ThemePreference = 'light' | 'dark' | 'system'

export interface ApiEndpointConfig {
  baseUrl: string
  constraintsPath: string
  hexCodesPath: string
  summaryPath: string
  moodBoardPath: string
  storyboardPath: string
  finalImagePath: string
  veoPath: string
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
  imagePath?: string
  title?: string
  description?: string
  promptSnippet?: string
}

export interface StoryboardScene {
  id: string
  imageUrl: string
  imagePath?: string
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
  previewPath?: string
  downloadUrl?: string
  createdAt: number
  format: string
  notes?: string
  savedPath?: string
  savedAt?: number
}

export interface ContentSnapshot {
  moodBoard: MoodBoardImage[]
  storyboard: StoryboardScene[]
  hexCodes: HexColor[]
  constraints: Constraint[]
  summary: SummaryDoc | null
  finalOutputs: FinalOutput[]
}

export interface SessionSnapshot {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: Message[]
  content: ContentSnapshot
}

export interface SessionListItem {
  id: string
  title: string
  createdAt: number
  updatedAt: number
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

export interface SectionState<T> {
  data: T
  isLoading: boolean
  error: string | null
  updatedAt: number | null
}
