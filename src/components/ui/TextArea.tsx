import type { TextareaHTMLAttributes } from 'react'
import { clsx } from 'clsx'

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export function TextArea({ className, ...props }: TextAreaProps) {
  return (
    <textarea
      className={clsx(
        'rounded-2xl border border-border/60 bg-[#0c1324] p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent',
        className,
      )}
      {...props}
    />
  )
}
