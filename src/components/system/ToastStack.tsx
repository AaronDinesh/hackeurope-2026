import { useToastStore } from '../../stores/toast'
import { useEffect } from 'react'

export function ToastStack() {
  const { toasts, dismissToast } = useToastStore()

  useEffect(() => {
    const timers = toasts.map((toast) =>
      window.setTimeout(() => dismissToast(toast.id), toast.duration ?? 4000),
    )
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [toasts, dismissToast])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 pb-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border bg-background/95 px-4 py-3 text-sm shadow-lg"
        >
          <p>{toast.message}</p>
          {toast.action ? (
            <button
              type="button"
              className="mt-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent"
              onClick={toast.action.onClick}
            >
              {toast.action.label}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}
