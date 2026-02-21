import { useAppStore } from '../../stores/app'

export function WelcomeScreen() {
  const markComplete = useAppStore((state) => state.markOnboardingComplete)
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="max-w-lg space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Gemini Creative Studio
        </p>
        <h1 className="font-display text-4xl font-semibold">Configure your FastAPI endpoints</h1>
        <p className="text-base text-muted-foreground">
          Open settings and enter the base URL plus any custom endpoint paths provided by your backend team. Once
          everything looks good, you can start chatting with Gemini.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          className="rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background"
          onClick={onOpenSettings}
        >
          Open Settings
        </button>
        <button
          className="rounded-full border border-border px-6 py-3 text-sm font-semibold"
          onClick={markComplete}
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
