import { forwardRef } from 'react'
import { cn } from '../utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', style, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-2xl border font-semibold tracking-[0.01em] transition duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--brand-primary-soft)] disabled:cursor-not-allowed disabled:opacity-55 disabled:saturate-50'
    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost',
      danger: 'btn-danger',
    }
    const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
      sm: 'min-h-[42px] px-4 py-2.5 text-sm',
      md: 'min-h-[48px] px-5 py-3 text-sm',
      lg: 'min-h-[54px] px-6 py-3.5 text-base',
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        style={style}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'
