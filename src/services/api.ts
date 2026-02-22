import { getApiUrl } from '../stores/app'
import type { Constraint, FinalOutput, HexColor, MoodBoardImage, StoryboardScene, SummaryDoc } from '../types'

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

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init)
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unexpected error')
    throw new Error(errorText || 'Request failed')
  }
  return response.json() as Promise<T>
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
  let items: string[] = []
  if (Array.isArray(negatives)) {
    items = negatives.filter((value): value is string => typeof value === 'string')
  } else if (typeof negatives === 'string') {
    items = negatives
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  }
  if (!items.length) return []
  const now = Date.now()
  return items.map((text, idx) => ({
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

export interface PromptBundle {
  constraints: Constraint[]
  hexCodes: HexColor[]
  summary: SummaryDoc | null
  moodBoard: MoodBoardImage[]
  storyboard: StoryboardScene[]
}

export interface VeoGenerationResult {
  output: FinalOutput
  bundle: PromptBundle
  localVideoError?: string
}

export interface FinalImageContextPayload {
  prompt: string
  constraints?: string
  hexcodes?: string
  summary?: string
  moodboardUrl?: string
  storyboardUrl?: string
}

export const apiClient = {
  async generatePromptBundle(prompt: string): Promise<PromptBundle> {
    const api = getApiUrl()
    const [constraintsResp, hexResp, summaryResp, moodResp, storyResp] = await Promise.all([
      requestJson<Record<string, unknown>>(buildUrl(api.constraintsPath), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      }),
      requestJson<Record<string, unknown>>(buildUrl(api.hexCodesPath), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      }),
      requestJson<Record<string, unknown>>(buildUrl(api.summaryPath), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      }),
      requestJson<Record<string, unknown>>(buildUrl(api.moodBoardPath), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      }),
      requestJson<Record<string, unknown>>(buildUrl(api.storyboardPath), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      }),
    ])

    return {
      constraints: toConstraints(constraintsResp.negatives),
      hexCodes: toHexCodes(hexResp.hexcodes ?? hexResp.palette),
      summary: toSummary(summaryResp.summary),
      moodBoard: toMoodBoard(moodResp.moodboard),
      storyboard: toStoryboard(storyResp.storyboard),
    }
  },

  async generateVeoVideo(prompt: string): Promise<VeoGenerationResult> {
    const { veoPath } = getApiUrl()
    const response = await requestJson<Record<string, unknown>>(buildUrl(veoPath), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, wait: true, max_wait_sec: 600 }),
    })
    const veo = (response.veo ?? {}) as Record<string, unknown>
    const remoteVideoUrl = String(veo.video_url ?? '')
    const localVideoUrl = String(veo.local_video_url ?? '')
    const localVideoError =
      typeof veo.local_video_error === 'string' && veo.local_video_error.trim().length > 0
        ? veo.local_video_error
        : undefined
    const videoUrl = localVideoUrl || remoteVideoUrl
    if (!videoUrl) {
      throw new Error('Veo response missing video_url')
    }
    const inputs = (veo.inputs ?? {}) as Record<string, unknown>
    const formatMatch = videoUrl.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/)

    return {
      output: {
        id: `veo-${Date.now()}`,
        type: 'video',
        previewUrl: buildAbsoluteAssetUrl(videoUrl),
        downloadUrl: buildAbsoluteAssetUrl(videoUrl),
        createdAt: Date.now(),
        format: (formatMatch?.[1] ?? 'mp4').toLowerCase(),
        notes: 'Generated with Veo',
      },
      bundle: {
        constraints: toConstraints(inputs.negatives),
        hexCodes: toHexCodes(inputs.hexcodes),
        summary: toSummary(inputs.summary),
        moodBoard: toMoodBoard(inputs.moodboard),
        storyboard: toStoryboard(inputs.storyboard),
      },
      localVideoError,
    }
  },

  async generateFinalImageFromContext(payload: FinalImageContextPayload): Promise<FinalOutput> {
    const { finalImagePath } = getApiUrl()
    const response = await requestJson<Record<string, unknown>>(buildUrl(finalImagePath), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: payload.prompt,
        constraints: payload.constraints,
        hexcodes: payload.hexcodes,
        summary: payload.summary,
        moodboard_url: payload.moodboardUrl,
        storyboard_url: payload.storyboardUrl,
      }),
    })

    const image = (response.final_image ?? {}) as Record<string, unknown>
    const imageUrl = String(image.image_url ?? '')
    if (!imageUrl) {
      throw new Error('Final image response missing image_url')
    }
    const formatMatch = imageUrl.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/)
    return {
      id: `final-image-${Date.now()}`,
      type: 'image',
      previewUrl: buildAbsoluteAssetUrl(imageUrl),
      downloadUrl: buildAbsoluteAssetUrl(imageUrl),
      createdAt: Date.now(),
      format: (formatMatch?.[1] ?? 'png').toLowerCase(),
      notes: String(image.description ?? 'Final generated image'),
    }
  },

  async downloadFromUrl(url: string) {
    const response = await fetch(buildAbsoluteAssetUrl(url))
    if (!response.ok) {
      throw new Error('Download failed')
    }
    return response.blob()
  },
}
