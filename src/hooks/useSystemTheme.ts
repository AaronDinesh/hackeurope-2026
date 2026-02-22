import { useEffect } from 'react'
import { useAppStore } from '../stores/app'

export const useSystemTheme = () => {
  const theme = useAppStore((state) => state.config.theme)

  useEffect(() => {
    const root = document.documentElement

    const applyTheme = (dark: boolean) => {
      root.classList.toggle('dark', dark)
    }

    if (theme === 'dark') {
      applyTheme(true)
      return
    }

    if (theme === 'light') {
      applyTheme(false)
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    applyTheme(mediaQuery.matches)

    const listener = (event: MediaQueryListEvent) => applyTheme(event.matches)
    mediaQuery.addEventListener('change', listener)
    return () => mediaQuery.removeEventListener('change', listener)
  }, [theme])
}
