import { useSystemTheme } from './hooks/useSystemTheme'
import { useEffect, useState } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { useAppStore } from './stores/app'
import { WelcomeScreen } from './components/welcome/WelcomeScreen'
import { ToastStack } from './components/system/ToastStack'
import { OfflineBanner } from './components/system/OfflineBanner'
import { SettingsModal } from './components/settings/SettingsModal'
import { useSessionStore } from './stores/sessions'

function App() {
  useSystemTheme()
  const hasOnboarded = useAppStore((state) => state.config.hasCompletedOnboarding)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const initializeSessions = useSessionStore((state) => state.initialize)

  useEffect(() => {
    initializeSessions().catch((error) => console.error('Failed to initialize sessions', error))
  }, [initializeSessions])

  useEffect(() => {
    const handleBeforeUnload = () => {
      void useSessionStore.getState().persistSnapshot()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return (
    <div className="relative h-screen w-screen bg-background text-foreground">
      <OfflineBanner />
      {hasOnboarded ? (
        <AppLayout onOpenSettings={() => setSettingsOpen(true)} />
      ) : (
        <WelcomeScreen onOpenSettings={() => setSettingsOpen(true)} />
      )}
      {settingsOpen ? <SettingsModal onClose={() => setSettingsOpen(false)} /> : null}
      <ToastStack />
    </div>
  )
}

export default App
