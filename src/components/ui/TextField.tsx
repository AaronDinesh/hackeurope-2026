import type { InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement>

export function TextField({ className, ...props }: TextFieldProps) {
  return (
    <input
      className={clsx(
        'rounded-xl border border-border/60 bg-[#0c1324] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent',
        className,
      )}
      {...props}
    />
  )
}
