import { useSystemTheme } from './hooks/useSystemTheme'

function App() {
  useSystemTheme()
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
      <div className="mx-auto flex max-w-xl flex-col gap-4 rounded-3xl border border-border bg-muted/50 p-8 text-center shadow-2xl shadow-blue-500/10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Miro AI Workspace
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Bootstrapping the next-generation collaboration UI
        </h1>
        <p className="text-lg text-muted-foreground">
          Frontend scaffolding is ready. Follow{' '}
          <span className="rounded bg-muted px-1 py-0.5 font-mono text-sm text-foreground">
            REQUIREMENTS.md
          </span>{' '}
          and{' '}
          <span className="rounded bg-muted px-1 py-0.5 font-mono text-sm text-foreground">
            IMPLEMENTATION_PLAN.md
          </span>{' '}
          to build the full experience.
        </p>
        <p className="text-sm text-muted-foreground">
          🚧 Core feature work starts next.
        </p>
      </div>
    </div>
  )
}

export default App
