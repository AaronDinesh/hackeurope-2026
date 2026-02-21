import type { Message } from '../../../types'
import type { TabId } from '../../layout/AppLayout'
import { clsx } from 'clsx'

interface MessageListProps {
  messages: Message[]
  focusTab: (tab: TabId) => void
}

const SECTION_TAB_MAP: Record<NonNullable<Message['metadata']>['referencedSection'], TabId> = {
  mood_board: 'mood',
  storyboard: 'storyboard',
  hex_codes: 'text',
  constraints: 'text',
  summary: 'text',
  final: 'final',
}

export function MessageList({ messages, focusTab }: MessageListProps) {
  return (
    <div className="flex flex-col gap-4 py-6">
      {messages.map((message) => {
        const align = message.role === 'user' ? 'self-end bg-accent text-background' : 'self-start bg-muted'
        const referenced = message.metadata?.referencedSection
        return (
          <div key={message.id} className={clsx('max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm', align)}>
            <p className="whitespace-pre-line leading-relaxed">{message.content || '…'}</p>
            {referenced ? (
              <button
                type="button"
                className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                onClick={() => focusTab(SECTION_TAB_MAP[referenced])}
              >
                View {referenced.replace('_', ' ')}
              </button>
            ) : null}
          </div>
        )
      })}
      {!messages.length ? (
        <p className="text-center text-sm text-muted-foreground">Start a conversation to generate your boards.</p>
      ) : null}
    </div>
  )
}
