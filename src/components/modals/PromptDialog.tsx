import { useEffect, useState } from 'react'

interface PromptDialogProps {
  title: string
  description?: string
  confirmLabel?: string
  placeholder?: string
  initialValue?: string
  isOpen: boolean
  onSubmit: (value: string) => Promise<void> | void
  onClose: () => void
}

export function PromptDialog({
  title,
  description,
  confirmLabel = 'Generate',
  placeholder = 'Describe the update you want…',
  initialValue = '',
  isOpen,
  onSubmit,
  onClose,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue)
  useEffect(() => {
    if (isOpen) {
      setValue(initialValue)
    }
  }, [initialValue, isOpen])
  const [isWorking, setIsWorking] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!value.trim()) return
    setIsWorking(true)
    await onSubmit(value.trim())
    setIsWorking(false)
    setValue('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-background p-6 shadow-2xl">
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">{title}</p>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <textarea
          className="h-40 w-full resize-none rounded-2xl border border-border/60 bg-muted/20 p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder={placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-full border border-border px-4 py-2 text-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className="rounded-full bg-foreground px-6 py-2 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:bg-muted"
            disabled={!value.trim() || isWorking}
            onClick={handleSubmit}
          >
            {isWorking ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
