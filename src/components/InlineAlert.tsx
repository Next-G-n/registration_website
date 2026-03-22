import { cn } from '../utils/cn'

const icons = {
  error: (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' className='shrink-0'>
      <circle cx='8' cy='8' r='7' stroke='currentColor' strokeWidth='1.5' />
      <path d='M8 5v3.5M8 11h.01' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' />
    </svg>
  ),
  info: (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' className='shrink-0'>
      <circle cx='8' cy='8' r='7' stroke='currentColor' strokeWidth='1.5' />
      <path d='M8 7.5v3.5M8 5h.01' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' />
    </svg>
  ),
  success: (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' className='shrink-0'>
      <circle cx='8' cy='8' r='7' stroke='currentColor' strokeWidth='1.5' />
      <path d='M5 8.5l2 2 4-4' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  ),
}

const styles: Record<string, string> = {
  error:   'border-red-200 bg-red-50 text-red-700',
  info:    'border-slate-200 bg-slate-50 text-slate-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

export function InlineAlert({
  message,
  tone = 'error',
}: {
  message: string
  tone?: 'error' | 'info' | 'success'
}) {
  return (
    <div className={cn('flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm', styles[tone])}>
      {icons[tone]}
      <span>{message}</span>
    </div>
  )
}
