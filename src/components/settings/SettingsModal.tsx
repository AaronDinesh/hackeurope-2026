import { useState } from 'react'
import type { ApiEndpointConfig } from '../../types'
import { useAppStore } from '../../stores/app'
import { useChatStore } from '../../stores/chat'
import { useContentStore } from '../../stores/content'
import { TextField } from '../ui/TextField'

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const config = useAppStore((state) => state.config)
  const updateApiEndpoints = useAppStore((state) => state.updateApiEndpoints)
  const markOnboardingComplete = useAppStore((state) => state.markOnboardingComplete)
  const resetConfig = useAppStore((state) => state.resetConfig)
  const clearChat = useChatStore((state) => state.clearHistory)
  const clearContent = useContentStore((state) => state.clearContent)
  const [form, setForm] = useState<ApiEndpointConfig>(config.api)

  const handleChange = (path: string, value: string) => {
    setForm((current) => {
      const next: ApiEndpointConfig = JSON.parse(JSON.stringify(current))
      const keys = path.split('.')
      let node: Record<string, unknown> = next as unknown as Record<string, unknown>
      keys.slice(0, -1).forEach((key) => {
        node = (node[key] ?? {}) as Record<string, unknown>
      })
      node[keys[keys.length - 1]] = value
      return next
    })
  }

  const isValid = form.baseUrl.trim().length > 0

  const handleSave = () => {
    if (!isValid) return
    updateApiEndpoints(form)
    markOnboardingComplete()
    onClose()
  }

  const handleReset = () => {
    setForm(config.api)
  }

  const handleClearWorkspace = () => {
    const confirmClear = window.confirm('This will reset all local data and settings. Continue?')
    if (!confirmClear) return
    resetConfig()
    clearChat()
    clearContent()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-background p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Settings</p>
            <h2 className="text-2xl font-semibold">API Configuration</h2>
          </div>
          <button className="text-sm text-muted-foreground" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="space-y-6">
          <Field label="Base URL" value={form.baseUrl} onChange={(value) => handleChange('baseUrl', value)} />

          <div className="grid gap-3 md:grid-cols-2">
            <Field
              label="Constraints Path"
              value={form.constraintsPath}
              onChange={(value) => handleChange('constraintsPath', value)}
            />
            <Field
              label="Hex Codes Path"
              value={form.hexCodesPath}
              onChange={(value) => handleChange('hexCodesPath', value)}
            />
            <Field
              label="Summary Path"
              value={form.summaryPath}
              onChange={(value) => handleChange('summaryPath', value)}
            />
            <Field
              label="Mood Board Path"
              value={form.moodBoardPath}
              onChange={(value) => handleChange('moodBoardPath', value)}
            />
            <Field
              label="Storyboard Path"
              value={form.storyboardPath}
              onChange={(value) => handleChange('storyboardPath', value)}
            />
            <Field
              label="Final Image Path"
              value={form.finalImagePath}
              onChange={(value) => handleChange('finalImagePath', value)}
            />
            <Field
              label="Veo Video Path"
              value={form.veoPath}
              onChange={(value) => handleChange('veoPath', value)}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-3">
            <button className="rounded-full border border-border px-4 py-2 text-sm" onClick={handleReset}>
              Reset Form
            </button>
            <button className="rounded-full border border-danger/60 px-4 py-2 text-sm text-danger" onClick={handleClearWorkspace}>
              Clear Workspace
            </button>
          </div>
          <button className="rounded-full border border-border px-4 py-2 text-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className="rounded-full bg-foreground px-6 py-2 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:bg-muted"
            onClick={handleSave}
            disabled={!isValid}
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  )
}

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
}

function Field({ label, value, onChange }: FieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <TextField value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}
