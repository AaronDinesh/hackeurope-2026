import { getApiUrl } from '../stores/app'
import type {
  Constraint,
  FinalOutput,
  HexColor,
  MoodBoardImage,
  StoryboardScene,
  SummaryDoc,
} from '../types'

const sanitizeBase = (baseUrl: string) => baseUrl.replace(/\/$/, '')

const buildUrl = (path: string) => {
  const { baseUrl } = getApiUrl()
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${sanitizeBase(baseUrl)}${normalized}`
}

export interface StreamOptions {
  signal?: AbortSignal
  onChunk?: (chunk: string) => void
}

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init)
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unexpected error')
    throw new Error(errorText || 'Request failed')
  }
  return response.json() as Promise<T>
}

export const apiClient = {
  async sendMessage(payload: { message: string }, options?: StreamOptions) {
    const endpoint = buildUrl(getApiUrl().textInput)
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: options?.signal,
    })

    if (!response.ok || !response.body) {
      const errorText = await response.text().catch(() => 'Unexpected error')
      throw new Error(errorText || 'Unable to contact FastAPI server')
    }

    if (!options?.onChunk) {
      return response.json()
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      if (value) {
        options.onChunk?.(decoder.decode(value, { stream: true }))
      }
    }
    return null
  },

  async sendVoiceRecording(audio: Blob) {
    const endpoint = buildUrl(getApiUrl().voiceInput)
    const formData = new FormData()
    formData.append('audio', audio, 'recording.webm')
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to upload audio')
      throw new Error(errorText)
    }
    return response.json()
  },

  async fetchMoodBoard() {
    return requestJson<MoodBoardImage[]>(buildUrl(getApiUrl().moodBoard.fetch))
  },

  async regenerateMoodBoard(prompt: string) {
    return requestJson<MoodBoardImage[]>(buildUrl(getApiUrl().moodBoard.regenerate), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
  },

  async fetchStoryboard() {
    return requestJson<StoryboardScene[]>(buildUrl(getApiUrl().storyboard.fetch))
  },

  async regenerateStoryboard(prompt: string) {
    return requestJson<StoryboardScene[]>(buildUrl(getApiUrl().storyboard.regenerate), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
  },

  async fetchHexCodes() {
    return requestJson<HexColor[]>(buildUrl(getApiUrl().hexCodes.fetch))
  },

  async regenerateHexCodes(prompt: string) {
    return requestJson<HexColor[]>(buildUrl(getApiUrl().hexCodes.regenerate), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
  },

  async fetchConstraints() {
    return requestJson<Constraint[]>(buildUrl(getApiUrl().constraints.fetch))
  },

  async regenerateConstraints(payload: Record<string, unknown>) {
    return requestJson<Constraint[]>(buildUrl(getApiUrl().constraints.regenerate), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  },

  async createConstraint(text: string) {
    const path = getApiUrl().constraints.create ?? getApiUrl().constraints.regenerate
    return requestJson<Constraint>(buildUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  },

  async updateConstraint(id: string, payload: Partial<Constraint>) {
    const path = getApiUrl().constraints.update ?? getApiUrl().constraints.regenerate
    return requestJson<Constraint>(buildUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    })
  },

  async deleteConstraint(id: string) {
    const path = getApiUrl().constraints.delete ?? getApiUrl().constraints.regenerate
    return requestJson<{ success: boolean }>(buildUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  },

  async fetchSummary() {
    return requestJson<SummaryDoc>(buildUrl(getApiUrl().summary.fetch))
  },

  async regenerateSummary(prompt: string) {
    return requestJson<SummaryDoc>(buildUrl(getApiUrl().summary.regenerate), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
  },

  async generateFinalImage(context: Record<string, unknown>) {
    return requestJson<FinalOutput>(buildUrl(getApiUrl().finalImage), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context),
    })
  },

  async generateFinalVideo(context: Record<string, unknown>) {
    return requestJson<FinalOutput>(buildUrl(getApiUrl().finalVideo), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context),
    })
  },

  async downloadFinalAsset(payload: Record<string, unknown>) {
    const endpoint = buildUrl(getApiUrl().download)
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Download failed')
      throw new Error(errorText)
    }
    return response.blob()
  },
}
