import React from 'react'
import { clsx } from 'clsx'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export function Button({
  className,
  variant = 'secondary',
  size = 'md',
  ...props
}: Props) {
  const base =
    'focus-ring inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60'
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  }[size]
  const variants = {
    primary: 'bg-accent text-black shadow-soft hover:opacity-95',
    secondary:
      'border border-white/10 bg-panel-1 text-text-1 shadow-card hover:border-white/15 hover:bg-panel-2',
    ghost: 'text-text-2 hover:bg-white/5 hover:text-text-1',
    danger: 'border border-red-500/20 bg-red-500/10 text-red-100 hover:bg-red-500/15',
  }[variant]
  return <button className={clsx(base, sizes, variants, className)} {...props} />
}

