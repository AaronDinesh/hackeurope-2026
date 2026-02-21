import { useSystemTheme } from './hooks/useSystemTheme'
import { useState } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { useAppStore } from './stores/app'
import { WelcomeScreen } from './components/welcome/WelcomeScreen'
import { ToastStack } from './components/system/ToastStack'
import { OfflineBanner } from './components/system/OfflineBanner'
import { SettingsModal } from './components/settings/SettingsModal'

function App() {
  useSystemTheme()
  const hasOnboarded = useAppStore((state) => state.config.hasCompletedOnboarding)
  const [settingsOpen, setSettingsOpen] = useState(false)

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
