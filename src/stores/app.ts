import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ApiEndpointConfig,
  AppConfigState,
  MiroAuthTokens,
  ThemePreference,
} from '../types'

interface AppStore {
  config: AppConfigState
  setTheme: (theme: ThemePreference) => void
  updateApiEndpoints: (updater: Partial<ApiEndpointConfig>) => void
  setMiroTokens: (tokens: MiroAuthTokens | null) => void
  markOnboardingComplete: () => void
}

const defaultConfig: AppConfigState = {
  api: {
    baseUrl: 'http://localhost:8000',
    textInput: '/input',
    voiceInput: '/voice_input',
    export: '/export',
    generateFinal: '/generate_final',
  },
  theme: 'system',
  hasCompletedOnboarding: false,
  miro: null,
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
      setMiroTokens: (tokens) =>
        set((state) => ({
          config: { ...state.config, miro: tokens },
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
