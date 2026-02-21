import { getApiUrl } from '../stores/app'

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

  async generateFinal(boardIds: string[]) {
    const endpoint = buildUrl(getApiUrl().generateFinal)
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardIds }),
    })
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Failed to trigger final generation')
      throw new Error(errorText)
    }
    return response.json()
  },

  async exportBoard(boardId: string, format: 'pdf' | 'png' | 'json') {
    const endpoint = buildUrl(getApiUrl().export)
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId, format }),
    })
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Export failed')
      throw new Error(errorText)
    }
    return response.blob()
  },
}
