import { useState } from 'react'
import { useChatStore } from '../../../stores/chat'
import { useContentStore } from '../../../stores/content'
import { useToastStore } from '../../../stores/toast'
import { useStreamingResponse } from '../../../hooks/useStreamingResponse'
import { apiClient } from '../../../services/api'
import type { TabId } from '../../layout/AppLayout'
import { MessageList } from './MessageList'
import { VoiceRecorderButton } from './VoiceRecorderButton'
import { TextArea } from '../../ui/TextArea'

interface ChatPanelProps {
  focusTab: (tab: TabId) => void
  onOpenSettings?: () => void
}

export function ChatPanel({ focusTab, onOpenSettings }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const { messages, addMessage, updateMessage, isLoading, setLoading } = useChatStore()
  const addFinalOutput = useContentStore((state) => state.addFinalOutput)
  const setSectionData = useContentStore((state) => state.setSectionData)
  const addToast = useToastStore((state) => state.addToast)
  const { isStreaming, sendStreamingMessage } = useStreamingResponse()

  const refreshAllSections = async () => {
    try {
      const [mood, story, hex, constraintList, summaryDoc] = await Promise.all([
        apiClient.fetchMoodBoard(),
        apiClient.fetchStoryboard(),
        apiClient.fetchHexCodes(),
        apiClient.fetchConstraints(),
        apiClient.fetchSummary(),
      ])
      setSectionData('moodBoard', mood)
      setSectionData('storyboard', story)
      setSectionData('hexCodes', hex)
      setSectionData('constraints', constraintList)
      setSectionData('summary', summaryDoc)
    } catch (error) {
      addToast({ type: 'error', message: (error as Error).message ?? 'Failed to refresh sections' })
    }
  }

  const handleSend = async () => {
    const content = input.trim()
    if (!content) return
    setInput('')
    const userMessage = addMessage({ role: 'user', content })
    setLoading(true, 'Thinking')
    const assistantMessage = addMessage({ role: 'assistant', content: '' })
    let buffer = ''
    try {
      await sendStreamingMessage(content, (chunk) => {
        buffer += chunk
        updateMessage(assistantMessage.id, { content: buffer })
      })
      await refreshAllSections()
    } catch (error) {
      console.error(error)
      updateMessage(assistantMessage.id, { content: 'Something went wrong. Please try again.' })
      addToast({ type: 'error', message: (error as Error).message ?? 'Chat error' })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (type: 'image' | 'video') => {
    const snapshot = useContentStore.getState()
    const context = {
      moodBoard: snapshot.moodBoard.data,
      storyboard: snapshot.storyboard.data,
      hexCodes: snapshot.hexCodes.data,
      constraints: snapshot.constraints.data,
      summary: snapshot.summary.data,
    }
    try {
      setLoading(true, `Generating final ${type}`)
      const output =
        type === 'image'
          ? await apiClient.generateFinalImage(context)
          : await apiClient.generateFinalVideo(context)
      addFinalOutput(output)
      await refreshAllSections()
      addToast({ type: 'success', message: `Final ${type} ready` })
      focusTab('final')
    } catch (error) {
      addToast({ type: 'error', message: (error as Error).message ?? 'Generation failed' })
    } finally {
      setLoading(false)
    }
  }

  const canSend = !isStreaming && !isLoading

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-5">
        <div className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Conversation</div>
        {onOpenSettings ? (
          <button
            type="button"
            className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
            onClick={onOpenSettings}
          >
            Settings
          </button>
        ) : null}
      </header>
      <div className="flex-1 overflow-y-auto px-6">
        <MessageList messages={messages} focusTab={focusTab} />
      </div>
      <div className="border-t border-border p-4">
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          <VoiceRecorderButton onTranscript={(text) => setInput(text)} disabled={isStreaming} />
          <span>{isStreaming ? 'Streaming response…' : 'Ready'}</span>
        </div>
        <div className="flex gap-2">
          <TextArea
            className="h-24 flex-1 resize-none"
            placeholder="Describe what you want Gemini to create…"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend || !input.trim()}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:bg-muted"
          >
            Send
          </button>
          <button
            type="button"
            onClick={() => handleGenerate('image')}
            className="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-foreground"
          >
            Generate Image
          </button>
          <button
            type="button"
            onClick={() => handleGenerate('video')}
            className="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-foreground"
          >
            Generate Video
          </button>
        </div>
      </div>
    </div>
  )
}
