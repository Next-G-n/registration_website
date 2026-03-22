import { useEffect } from 'react'
import { cn } from '../utils/cn'

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  panelClassName,
  bodyClassName,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  panelClassName?: string
  bodyClassName?: string
}) {
  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className='fixed inset-0 z-50 flex justify-end'>
      <div className='animate-fade-in-bg absolute inset-0 bg-slate-900/45 backdrop-blur-sm' onClick={onClose} />

      <div
        className={cn(
          'animate-slide-in-right relative flex h-[100dvh] w-full flex-col overflow-hidden border-l border-[color:var(--brand-surface-edge)] bg-[linear-gradient(180deg,var(--brand-surface-top),var(--brand-surface-bottom))] shadow-[0_32px_72px_-34px_rgba(15,23,42,0.5)] sm:my-3 sm:h-[calc(100dvh-1.5rem)] sm:max-w-[min(92vw,44rem)] sm:rounded-3xl sm:border sm:border-[color:var(--brand-surface-edge)]',
          panelClassName,
        )}
      >
        <div className='shrink-0 border-b border-[color:var(--brand-surface-edge)] px-5 py-4 sm:px-6'>
          <div className='flex items-start justify-between gap-4'>
            <div className='min-w-0'>
              <p className='text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-text-muted)]'>Details</p>
              <h2 className='mt-1 text-lg font-semibold text-[color:var(--brand-text)] sm:text-xl'>{title}</h2>
              {description ? <p className='mt-1 text-sm text-[color:var(--brand-text-soft)]'>{description}</p> : null}
            </div>
            <button
              onClick={onClose}
              className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--brand-secondary-border)] bg-[color:var(--brand-secondary-surface)] text-[color:var(--brand-secondary-text)] transition hover:bg-[color:var(--brand-secondary-surface-hover)]'
              aria-label='Close'
            >
              <svg width='16' height='16' viewBox='0 0 16 16' fill='none'>
                <path d='M12 4L4 12M4 4l8 8' stroke='currentColor' strokeWidth='1.75' strokeLinecap='round' />
              </svg>
            </button>
          </div>
        </div>

        <div className={cn('flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6', bodyClassName)}>{children}</div>

        {footer ? (
          <div className='shrink-0 border-t border-[color:var(--brand-surface-edge)] bg-white/80 px-5 py-4 backdrop-blur sm:px-6'>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
