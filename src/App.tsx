import { useSystemTheme } from './hooks/useSystemTheme'
import { AppLayout } from './components/layout/AppLayout'
import { useAppStore } from './stores/app'
import { WelcomeScreen } from './components/welcome/WelcomeScreen'
import { ToastStack } from './components/system/ToastStack'
import { OfflineBanner } from './components/system/OfflineBanner'

function App() {
  useSystemTheme()
  const hasOnboarded = useAppStore((state) => state.config.hasCompletedOnboarding)

  return (
    <div className="relative h-screen w-screen bg-background text-foreground">
      <OfflineBanner />
      {hasOnboarded ? <AppLayout /> : <WelcomeScreen />}
      <ToastStack />
    </div>
  )
}

export default App
