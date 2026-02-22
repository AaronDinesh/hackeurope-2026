import { useState } from 'react'
import { useChatStore } from '../../../stores/chat'
import { useContentStore } from '../../../stores/content'
import { useToastStore } from '../../../stores/toast'
import { useStreamingResponse } from '../../../hooks/useStreamingResponse'
import { apiClient } from '../../../services/api'
import type { TabId } from '../../layout/AppLayout'
import { MessageList } from './MessageList'
import { TextArea } from '../../ui/TextArea'
import { useSessionStore } from '../../../stores/sessions'
import { ensureImageAsset } from '../../../services/imageStorage'

interface ChatPanelProps {
  focusTab: (tab: TabId) => void
  onOpenSettings?: () => void
}

export function ChatPanel({ focusTab, onOpenSettings }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const { messages, addMessage, updateMessage, isLoading, setLoading } = useChatStore()
  const addFinalOutput = useContentStore((state) => state.addFinalOutput)
  const setSectionData = useContentStore((state) => state.setSectionData)
  const getContentSnapshot = useContentStore((state) => state.getSnapshot)
  const createSession = useSessionStore((state) => state.createSession)
  const activeSessionId = useSessionStore((state) => state.activeSessionId)
  const addToast = useToastStore((state) => state.addToast)
  const { isStreaming, sendStreamingMessage } = useStreamingResponse()

  const mapImageAssets = async <T extends { id: string; imageUrl: string; imagePath?: string }>(
    category: 'mood-board' | 'storyboard',
    items: T[],
  ): Promise<T[]> => {
    if (!activeSessionId) return items
    return Promise.all(
      items.map(async (item) => {
        const { imagePath, imageUrl } = await ensureImageAsset({
          sessionId: activeSessionId,
          category,
          itemId: item.id,
          imagePath: item.imagePath,
          imageUrl: item.imageUrl,
        })
        return { ...item, imagePath, imageUrl: imageUrl || item.imageUrl }
      }),
    )
  }

  const refreshAllSections = async () => {
    try {
      const [mood, story, hex, constraintList, summaryDoc] = await Promise.all([
        apiClient.fetchMoodBoard(),
        apiClient.fetchStoryboard(),
        apiClient.fetchHexCodes(),
        apiClient.fetchConstraints(),
        apiClient.fetchSummary(),
      ])
      const [moodAssets, storyAssets] = await Promise.all([
        mapImageAssets('mood-board', mood),
        mapImageAssets('storyboard', story),
      ])
      setSectionData('moodBoard', moodAssets)
      setSectionData('storyboard', storyAssets)
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
    addMessage({ role: 'user', content })
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

  const handleStartNew = async () => {
    const snapshot = getContentSnapshot()
    const hasHistory =
      messages.length > 0 ||
      snapshot.finalOutputs.length > 0 ||
      snapshot.moodBoard.length > 0 ||
      snapshot.storyboard.length > 0 ||
      snapshot.hexCodes.length > 0 ||
      snapshot.constraints.length > 0 ||
      !!snapshot.summary

    if (hasHistory) {
      const confirmed = window.confirm('Start new conversation and archive the current session?')
      if (!confirmed) return
    }

    await createSession()
    setInput('')
    addToast({ type: 'info', message: 'Workspace reset. Start a new conversation!' })
  }

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
        <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground">
          <span>{isStreaming ? 'Streaming response…' : 'Ready'}</span>
          <button
            type="button"
            className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
            onClick={handleStartNew}
          >
            New
          </button>
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
