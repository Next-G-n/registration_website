import { forwardRef } from 'react'
import { cn } from '../utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', style, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60'
    const variants: Record<string, string> = {
      primary: 'text-white hover:opacity-95',
      secondary: 'border bg-white/95 hover:bg-white',
      ghost: 'bg-transparent hover:bg-slate-100',
      danger: 'bg-red-600 text-white hover:bg-red-500',
    }
    const sizes: Record<string, string> = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    }
    const variantStyles: Record<NonNullable<ButtonProps['variant']>, React.CSSProperties> = {
      primary: { background: 'var(--brand-primary, #0f172a)', color: '#FFFFFF' },
      secondary: { borderColor: 'var(--brand-primary-soft, #e2e8f0)', color: 'var(--brand-text, #0f172a)' },
      ghost: { color: 'var(--brand-text-soft, #334155)' },
      danger: { background: '#DC2626', color: '#FFFFFF' },
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        style={{ ...variantStyles[variant], ...style }}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'
