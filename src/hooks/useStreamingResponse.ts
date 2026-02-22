import { useCallback, useRef, useState } from 'react'
import { apiClient } from '../services/api'

export const useStreamingResponse = () => {
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const sendStreamingMessage = useCallback(
    async (message: string, onChunk: (chunk: string) => void) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setIsStreaming(true)

      try {
        await apiClient.sendMessage(
          { message },
          {
            signal: controller.signal,
            onChunk,
          },
        )
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [],
  )

  const cancelStreaming = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsStreaming(false)
  }, [])

  return { isStreaming, sendStreamingMessage, cancelStreaming }
}
