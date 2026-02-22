import { useMemo, useState } from 'react'
import { useChatStore } from '../../../stores/chat'
import { useContentStore } from '../../../stores/content'
import { useToastStore } from '../../../stores/toast'
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
  const { messages, addMessage, updateMessage, isLoading, currentTask, setLoading } = useChatStore()
  const addFinalOutput = useContentStore((state) => state.addFinalOutput)
  const setSectionData = useContentStore((state) => state.setSectionData)
  const getContentSnapshot = useContentStore((state) => state.getSnapshot)
  const createSession = useSessionStore((state) => state.createSession)
  const persistSnapshot = useSessionStore((state) => state.persistSnapshot)
  const activeSessionId = useSessionStore((state) => state.activeSessionId)
  const addToast = useToastStore((state) => state.addToast)
  const isStreaming = false
  const statusText = isLoading ? currentTask ?? 'Working…' : isStreaming ? 'Streaming response…' : 'Ready'
  const isGeneratingImage = isLoading && (currentTask ?? '').toLowerCase().includes('image')
  const isGeneratingVideo = isLoading && (currentTask ?? '').toLowerCase().includes('video')

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

  const handleSend = async () => {
    const content = input.trim()
    if (!content) return
    setInput('')
    addMessage({ role: 'user', content })
    setLoading(true, 'Thinking')
    const assistantMessage = addMessage({ role: 'assistant', content: '' })
    try {
      const bundle = await apiClient.generatePromptBundle(content)
      const [moodAssets, storyAssets] = await Promise.all([
        mapImageAssets('mood-board', bundle.moodBoard),
        mapImageAssets('storyboard', bundle.storyboard),
      ])
      setSectionData('constraints', bundle.constraints)
      setSectionData('hexCodes', bundle.hexCodes)
      setSectionData('summary', bundle.summary)
      setSectionData('moodBoard', moodAssets)
      setSectionData('storyboard', storyAssets)
      updateMessage(assistantMessage.id, { content: 'Generated constraints, palette, summary, mood board, and storyboard.' })
      await persistSnapshot()
    } catch (error) {
      console.error(error)
      updateMessage(assistantMessage.id, { content: 'Something went wrong. Please try again.' })
      addToast({ type: 'error', message: (error as Error).message ?? 'Chat error' })
    } finally {
      setLoading(false)
    }
  }

  const latestPrompt = useMemo(
    () => [...messages].reverse().find((message) => message.role === 'user')?.content.trim() ?? '',
    [messages],
  )

  const handleGenerateVideo = async () => {
    if (!latestPrompt) {
      addToast({ type: 'warning', message: 'Send a prompt before generating video.' })
      return
    }
    try {
      setLoading(true, 'Generating video')
      const { output, bundle, localVideoError } = await apiClient.generateVeoVideo(latestPrompt)
      const [moodAssets, storyAssets] = await Promise.all([
        mapImageAssets('mood-board', bundle.moodBoard),
        mapImageAssets('storyboard', bundle.storyboard),
      ])
      setSectionData('constraints', bundle.constraints)
      setSectionData('hexCodes', bundle.hexCodes)
      setSectionData('summary', bundle.summary)
      setSectionData('moodBoard', moodAssets)
      setSectionData('storyboard', storyAssets)
      addFinalOutput(output)
      if (localVideoError) {
        addToast({
          type: 'warning',
          message:
            'Video generated, but backend could not proxy-download it for local playback. Check API enablement for your key project.',
        })
      }
      addToast({ type: 'success', message: 'Video ready' })
      await persistSnapshot()
      focusTab('final')
    } catch (error) {
      addToast({ type: 'error', message: (error as Error).message ?? 'Generation failed' })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateImage = async () => {
    if (!latestPrompt) {
      addToast({ type: 'warning', message: 'Send a prompt before generating image.' })
      return
    }

    const snapshot = useContentStore.getState()
    const constraintsText = snapshot.constraints.data.map((item) => item.text).join(', ')
    const hexcodesText = snapshot.hexCodes.data.map((item) => item.hex).join(', ')
    const summaryText = snapshot.summary.data?.content ?? ''
    const moodboardUrl = snapshot.moodBoard.data[0]?.imageUrl
    const storyboardUrl = snapshot.storyboard.data[0]?.imageUrl

    try {
      setLoading(true, 'Generating image')
      const output = await apiClient.generateFinalImageFromContext({
        prompt: latestPrompt,
        constraints: constraintsText,
        hexcodes: hexcodesText,
        summary: summaryText,
        moodboardUrl,
        storyboardUrl,
      })
      addFinalOutput(output)
      addToast({ type: 'success', message: 'Image ready' })
      await persistSnapshot()
      focusTab('final')
    } catch (error) {
      addToast({ type: 'error', message: (error as Error).message ?? 'Image generation failed' })
    } finally {
      setLoading(false)
    }
  }

  const canSend = !isLoading

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
          <span>{statusText}</span>
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
            onClick={handleGenerateImage}
            disabled={isLoading}
            className="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGeneratingImage ? 'Generating…' : 'Generate Final Image'}
          </button>
          <button
            type="button"
            onClick={handleGenerateVideo}
            disabled={isLoading}
            className="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGeneratingVideo ? 'Generating…' : 'Generate Final Video'}
          </button>
        </div>
      </div>
    </div>
  )
}
