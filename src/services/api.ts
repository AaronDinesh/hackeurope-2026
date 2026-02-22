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

const buildAbsoluteAssetUrl = (pathOrUrl: string) => {
  if (!pathOrUrl) return ''
  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith('data:')) {
    return pathOrUrl
  }
  return buildUrl(pathOrUrl)
}

const toHexCodes = (palette: unknown): HexColor[] => {
  if (!palette || typeof palette !== 'object') return []
  const entries = Object.entries(palette as Record<string, unknown>)
  const out: HexColor[] = []
  entries.forEach(([group, values]) => {
    if (Array.isArray(values)) {
      values.forEach((value, idx) => {
        if (typeof value === 'string') {
          out.push({ id: `${group}-${idx}-${value}`, name: group, hex: value })
        }
      })
    }
  })
  return out
}

const toConstraints = (negatives: unknown): Constraint[] => {
  if (!Array.isArray(negatives)) return []
  const now = Date.now()
  return negatives
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((text, idx) => ({
      id: `constraint-${idx}-${text}`,
      text,
      source: 'ai',
      active: true,
      createdAt: now,
    }))
}

const toSummary = (summary: unknown): SummaryDoc | null => {
  if (typeof summary === 'string') {
    return {
      id: `summary-${Date.now()}`,
      content: summary,
      updatedAt: Date.now(),
      source: 'ai',
    }
  }
  if (!summary || typeof summary !== 'object') return null
  const data = summary as Record<string, unknown>
  const content = [data.logline, data.style, Array.isArray(data.keywords) ? (data.keywords as string[]).join(', ') : null]
    .filter(Boolean)
    .join('\n')
    .trim()
  if (!content) return null
  return {
    id: `summary-${Date.now()}`,
    content,
    updatedAt: Date.now(),
    source: 'ai',
  }
}

const toMoodBoard = (payload: unknown): MoodBoardImage[] => {
  const image = (payload as { image_url?: string; description?: string } | null) ?? null
  if (!image?.image_url) return []
  return [
    {
      id: `mood-${Date.now()}`,
      imageUrl: buildAbsoluteAssetUrl(image.image_url),
      description: image.description,
      title: 'Mood Board',
    },
  ]
}

const toStoryboard = (payload: unknown): StoryboardScene[] => {
  const image = (payload as { image_url?: string; description?: string } | null) ?? null
  if (!image?.image_url) return []
  return [
    {
      id: `story-${Date.now()}`,
      imageUrl: buildAbsoluteAssetUrl(image.image_url),
      title: 'Scene 1',
      description: image.description,
      order: 1,
    },
  ]
}

export interface StreamOptions {
  signal?: AbortSignal
  onChunk?: (chunk: string) => void
}

export interface PromptBundle {
  constraints: Constraint[]
  hexCodes: HexColor[]
  summary: SummaryDoc | null
  moodBoard: MoodBoardImage[]
  storyboard: StoryboardScene[]
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
  async generatePromptBundle(prompt: string): Promise<PromptBundle> {
    const constraintsPath = '/v1/constraints'
    const hexcodesPath = '/v1/hexcodes'
    const summaryPath = '/v1/summary'
    const moodboardPath = '/v1/moodboard'
    const storyboardPath = '/v1/storyboard'

    try {
      const [constraintsResp, hexResp, summaryResp, moodResp, storyResp] = await Promise.all([
        requestJson<Record<string, unknown>>(buildUrl(constraintsPath), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        }),
        requestJson<Record<string, unknown>>(buildUrl(hexcodesPath), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        }),
        requestJson<Record<string, unknown>>(buildUrl(summaryPath), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        }),
        requestJson<Record<string, unknown>>(buildUrl(moodboardPath), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        }),
        requestJson<Record<string, unknown>>(buildUrl(storyboardPath), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        }),
      ])

      return {
        constraints: toConstraints(constraintsResp.negatives),
        hexCodes: toHexCodes(hexResp.palette),
        summary: toSummary(summaryResp.summary),
        moodBoard: toMoodBoard(moodResp.moodboard),
        storyboard: toStoryboard(storyResp.storyboard),
      }
    } catch {
      const constraintsResp = await requestJson<Record<string, unknown>>(buildUrl(constraintsPath), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const planId = String(constraintsResp.plan_id ?? '')
      if (!planId) {
        throw new Error('Backend did not return plan_id')
      }
      const [hexResp, summaryResp, moodResp, storyResp] = await Promise.all([
        requestJson<Record<string, unknown>>(`${buildUrl(hexcodesPath)}?plan_id=${encodeURIComponent(planId)}`),
        requestJson<Record<string, unknown>>(`${buildUrl(summaryPath)}?plan_id=${encodeURIComponent(planId)}`),
        requestJson<Record<string, unknown>>(buildUrl(moodboardPath), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan_id: planId }),
        }),
        requestJson<Record<string, unknown>>(buildUrl(storyboardPath), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan_id: planId }),
        }),
      ])

      return {
        constraints: toConstraints(constraintsResp.negatives),
        hexCodes: toHexCodes(hexResp.palette),
        summary: toSummary(summaryResp.summary),
        moodBoard: toMoodBoard((moodResp.moodboard ?? constraintsResp.moodboard) as unknown),
        storyboard: toStoryboard((storyResp.storyboard ?? constraintsResp.storyboard) as unknown),
      }
    }
  },

  async generateVeoVideo(prompt: string) {
    const response = await requestJson<Record<string, unknown>>(buildUrl('/v1/veo'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, wait: true, max_wait_sec: 600 }),
    })
    const videoUrl = String(response.video_url ?? '')
    if (!videoUrl) {
      throw new Error('Veo response missing video_url')
    }
    const formatMatch = videoUrl.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/)
    return {
      id: `veo-${Date.now()}`,
      type: 'video',
      previewUrl: buildAbsoluteAssetUrl(videoUrl),
      downloadUrl: buildAbsoluteAssetUrl(videoUrl),
      createdAt: Date.now(),
      format: (formatMatch?.[1] ?? 'mp4').toLowerCase(),
      notes: 'Generated with Veo',
    } as FinalOutput
  },

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

  async fetchMoodBoard() {
    return requestJson<MoodBoardImage[]>(buildUrl(getApiUrl().moodBoard.fetch))
  },

  async regenerateMoodBoard(prompt: string, targetId?: string) {
    return requestJson<MoodBoardImage[]>(buildUrl(getApiUrl().moodBoard.regenerate), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, targetId }),
    })
  },

  async fetchStoryboard() {
    return requestJson<StoryboardScene[]>(buildUrl(getApiUrl().storyboard.fetch))
  },

  async regenerateStoryboard(prompt: string, targetId?: string) {
    return requestJson<StoryboardScene[]>(buildUrl(getApiUrl().storyboard.regenerate), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, targetId }),
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

  async downloadFromUrl(url: string) {
    const response = await fetch(buildAbsoluteAssetUrl(url))
    if (!response.ok) {
      throw new Error('Download failed')
    }
    return response.blob()
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
