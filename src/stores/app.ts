import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ApiEndpointConfig, AppConfigState, ThemePreference } from '../types'

interface AppStore {
  config: AppConfigState
  setTheme: (theme: ThemePreference) => void
  updateApiEndpoints: (updater: Partial<ApiEndpointConfig>) => void
  markOnboardingComplete: () => void
  resetConfig: () => void
}

export const defaultAppConfig: AppConfigState = {
  api: {
    baseUrl: 'http://localhost:8000',
    constraintsPath: '/v1/constraints',
    hexCodesPath: '/v1/hexcodes',
    summaryPath: '/v1/summary',
    moodBoardPath: '/v1/moodboard',
    storyboardPath: '/v1/storyboard',
    finalImagePath: '/v1/final-image',
    veoPath: '/v1/veo',
  },
  theme: 'system',
  hasCompletedOnboarding: false,
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      config: defaultAppConfig,
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
      resetConfig: () => set({ config: defaultAppConfig }),
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
