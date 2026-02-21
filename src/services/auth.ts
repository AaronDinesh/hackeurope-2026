import { open } from '@tauri-apps/plugin-shell'
import type { MiroAuthTokens } from '../types'

const CLIENT_ID = import.meta.env.VITE_MIRO_CLIENT_ID ?? ''
const CLIENT_SECRET = import.meta.env.VITE_MIRO_CLIENT_SECRET ?? ''
const REDIRECT_URI =
  import.meta.env.VITE_MIRO_REDIRECT_URI ?? 'miro-ai-workspace://callback'
const SCOPES = ['boards:read', 'boards:write'].join(' ')

const tokenEndpoint = 'https://api.miro.com/v1/oauth/token'
const authEndpoint = 'https://miro.com/oauth/authorize'

export const buildAuthorizeUrl = (state: string) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
  })
  return `${authEndpoint}?${params.toString()}`
}

export const openMiroOAuth = async () => {
  const state = crypto.randomUUID()
  await open(buildAuthorizeUrl(state))
  return state
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

export const exchangeCodeForTokens = async (code: string) => {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Missing Miro OAuth credentials. Set VITE_MIRO_CLIENT_ID/SECRET.')
  }

  const payload = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  })

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload.toString(),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => 'Failed to exchange authorization code')
    throw new Error(message)
  }

  const json = (await response.json()) as TokenResponse
  return normalizeTokenResponse(json)
}

export const refreshMiroToken = async (refreshToken: string) => {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Missing Miro OAuth credentials. Set VITE_MIRO_CLIENT_ID/SECRET.')
  }

  const payload = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  })

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload.toString(),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => 'Failed to refresh token')
    throw new Error(message)
  }

  const json = (await response.json()) as TokenResponse
  return normalizeTokenResponse(json)
}

const normalizeTokenResponse = (payload: TokenResponse): MiroAuthTokens => ({
  accessToken: payload.access_token,
  refreshToken: payload.refresh_token,
  tokenExpiresAt: Date.now() + payload.expires_in * 1000,
})
