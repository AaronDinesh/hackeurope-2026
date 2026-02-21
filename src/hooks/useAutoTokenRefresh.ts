import { useEffect } from 'react'
import { refreshMiroToken } from '../services/auth'
import { useAppStore } from '../stores/app'
import { useToastStore } from '../stores/toast'

const FIVE_MINUTES = 5 * 60 * 1000

export const useAutoTokenRefresh = () => {
  const tokens = useAppStore((state) => state.config.miro)
  const setMiroTokens = useAppStore((state) => state.setMiroTokens)
  const addToast = useToastStore((state) => state.addToast)

  useEffect(() => {
    if (!tokens?.refreshToken || !tokens.tokenExpiresAt) return
    let timeout: number | null = null

    const scheduleRefresh = () => {
      const msUntilExpiry = tokens.tokenExpiresAt - Date.now()
      const msUntilRefresh = Math.max(msUntilExpiry - FIVE_MINUTES, 5_000)
      timeout = window.setTimeout(async () => {
        try {
          const refreshed = await refreshMiroToken(tokens.refreshToken)
          setMiroTokens({ ...refreshed, defaultBoardId: tokens.defaultBoardId })
        } catch (error) {
          console.error('Failed to refresh Miro token', error)
          addToast({
            type: 'error',
            message: 'Miro session expired. Please reconnect.',
          })
          setMiroTokens(null)
        }
      }, msUntilRefresh)
    }

    scheduleRefresh()
    return () => {
      if (timeout) window.clearTimeout(timeout)
    }
  }, [addToast, setMiroTokens, tokens])
}
