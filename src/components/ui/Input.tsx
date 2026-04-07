import React from 'react'
import { clsx } from 'clsx'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
}

export function Input({ label, hint, className, ...props }: Props) {
  return (
    <label className="block">
      {label ? <div className="mb-1 text-xs font-semibold text-text-2">{label}</div> : null}
      <input
        className={clsx(
          'focus-ring w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-text-1 placeholder:text-text-3 shadow-soft/30 transition',
          'hover:border-white/15',
          className,
        )}
        {...props}
      />
      {hint ? <div className="mt-1 text-xs text-text-3">{hint}</div> : null}
    </label>
  )
}

