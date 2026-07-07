import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from './cn'

type Variant = 'primary' | 'ghost' | 'danger' | 'link'
type Size = 'sm' | 'md'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variants: Record<Variant, string> = {
  primary:
    'bg-foreground text-background font-bold hover:opacity-90 disabled:opacity-45 disabled:cursor-not-allowed',
  ghost:
    'border border-line bg-surface text-body hover:border-muted disabled:opacity-45 disabled:cursor-not-allowed',
  danger:
    'bg-negative text-white font-bold hover:opacity-90 disabled:opacity-45 disabled:cursor-not-allowed',
  link: 'text-info underline-offset-4 hover:underline px-0',
}

const sizes: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-md',
  md: 'text-sm px-4 py-2 rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
})
