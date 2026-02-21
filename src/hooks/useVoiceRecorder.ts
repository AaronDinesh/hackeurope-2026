import { useCallback, useEffect, useRef, useState } from 'react'

interface VoiceRecorderOptions {
  onStop: (audioBlob: Blob) => Promise<void> | void
}

export const useVoiceRecorder = ({ onStop }: VoiceRecorderOptions) => {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<number | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const resetTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    setDuration(0)
  }

  const startRecording = useCallback(async () => {
    if (isRecording) return
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    })

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      chunksRef.current = []
      await onStop(blob)
    }

    recorder.start(1000)
    mediaRecorderRef.current = recorder
    setIsRecording(true)
    timerRef.current = window.setInterval(() => {
      setDuration((current) => current + 1)
    }, 1000)
  }, [isRecording, onStop])

  const stopRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) return
    mediaRecorderRef.current.stop()
    mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
    mediaRecorderRef.current = null
    setIsRecording(false)
    resetTimer()
  }, [isRecording])

  useEffect(() => () => stopRecording(), [stopRecording])

  return { isRecording, duration, startRecording, stopRecording }
}
