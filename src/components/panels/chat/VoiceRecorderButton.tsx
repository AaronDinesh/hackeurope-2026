import { useState } from 'react'
import { useVoiceRecorder } from '../../../hooks/useVoiceRecorder'
import { apiClient } from '../../../services/api'
import { useToastStore } from '../../../stores/toast'

interface VoiceRecorderButtonProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export function VoiceRecorderButton({ onTranscript, disabled }: VoiceRecorderButtonProps) {
  const [status, setStatus] = useState<'idle' | 'recording' | 'uploading'>('idle')
  const addToast = useToastStore((state) => state.addToast)
  const { isRecording, duration, startRecording, stopRecording } = useVoiceRecorder({
    onStop: async (blob) => {
      try {
        setStatus('uploading')
        const result = await apiClient.sendVoiceRecording(blob)
        onTranscript(result.transcript ?? '')
      } catch (error) {
        addToast({ type: 'error', message: (error as Error).message ?? 'Unable to transcribe audio' })
      } finally {
        setStatus('idle')
      }
    },
  })

  return (
    <button
      type="button"
      className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
      onClick={() => {
        if (disabled || status === 'uploading') return
        if (isRecording) stopRecording()
        else {
          startRecording()
          setStatus('recording')
        }
      }}
      disabled={disabled}
    >
      {status === 'uploading'
        ? 'Transcribing…'
        : isRecording
          ? `Recording ${duration}s`
          : 'Voice prompt'}
    </button>
  )
}
