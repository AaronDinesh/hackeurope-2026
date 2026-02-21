import { useState } from 'react'
import type { ApiEndpointConfig } from '../../types'
import { useAppStore } from '../../stores/app'

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const config = useAppStore((state) => state.config)
  const updateApiEndpoints = useAppStore((state) => state.updateApiEndpoints)
  const markOnboardingComplete = useAppStore((state) => state.markOnboardingComplete)
  const [form, setForm] = useState<ApiEndpointConfig>(config.api)

  const handleChange = (path: string, value: string) => {
    setForm((current) => {
      const next: ApiEndpointConfig = JSON.parse(JSON.stringify(current))
      const keys = path.split('.')
      let node: any = next
      keys.slice(0, -1).forEach((key) => {
        node = node[key]
      })
      node[keys[keys.length - 1]] = value
      return next
    })
  }

  const handleSave = () => {
    updateApiEndpoints(form)
    markOnboardingComplete()
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

          {(['moodBoard', 'storyboard', 'hexCodes', 'constraints', 'summary'] as const).map((section) => (
            <div key={section} className="rounded-2xl border border-border/60 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">{section}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Field
                  label="Fetch Path"
                  value={form[section].fetch}
                  onChange={(value) => handleChange(`${section}.fetch`, value)}
                />
                <Field
                  label="Regenerate Path"
                  value={form[section].regenerate}
                  onChange={(value) => handleChange(`${section}.regenerate`, value)}
                />
              </div>
            </div>
          ))}

          <div className="grid gap-3 md:grid-cols-2">
            <Field
              label="Final Image Endpoint"
              value={form.finalImage}
              onChange={(value) => handleChange('finalImage', value)}
            />
            <Field
              label="Final Video Endpoint"
              value={form.finalVideo}
              onChange={(value) => handleChange('finalVideo', value)}
            />
          </div>
          <Field label="Download Endpoint" value={form.download} onChange={(value) => handleChange('download', value)} />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-full border border-border px-4 py-2 text-sm" onClick={onClose}>
            Cancel
          </button>
          <button className="rounded-full bg-foreground px-6 py-2 text-sm font-semibold text-background" onClick={handleSave}>
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
      <input
        className="rounded-xl border border-border bg-background/60 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
