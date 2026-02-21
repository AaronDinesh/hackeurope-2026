import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ApiEndpointConfig, AppConfigState, ThemePreference } from '../types'

interface AppStore {
  config: AppConfigState
  setTheme: (theme: ThemePreference) => void
  updateApiEndpoints: (updater: Partial<ApiEndpointConfig>) => void
  markOnboardingComplete: () => void
}

const defaultConfig: AppConfigState = {
  api: {
    baseUrl: 'http://localhost:8000',
    textInput: '/input',
    voiceInput: '/voice_input',
    moodBoard: { fetch: '/mood-board', regenerate: '/mood-board-generate' },
    storyboard: { fetch: '/story-board', regenerate: '/story-board-generate' },
    hexCodes: { fetch: '/hex-codes', regenerate: '/hex-codes-generate' },
    constraints: { fetch: '/constraints', regenerate: '/constraints-generate' },
    summary: { fetch: '/summary', regenerate: '/summary-generate' },
    finalImage: '/generate-final-image',
    finalVideo: '/generate-final-video',
    download: '/download',
  },
  theme: 'system',
  hasCompletedOnboarding: false,
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      config: defaultConfig,
      setTheme: (theme) =>
        set((state) => ({
          config: { ...state.config, theme },
        })),
      updateApiEndpoints: (updater) =>
        set((state) => ({
          config: { ...state.config, api: { ...state.config.api, ...updater } },
        })),
      markOnboardingComplete: () =>
        set((state) => ({
          config: { ...state.config, hasCompletedOnboarding: true },
        })),
    }),
    {
      name: 'app-config',
      version: 1,
      partialize: (state) => ({
        config: state.config,
      }),
    },
  ),
)

export const getApiUrl = () => useAppStore.getState().config.api
