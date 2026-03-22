import { cn } from '../utils/cn'

export function InlineAlert({
  message,
  tone = 'error',
}: {
  message: string
  tone?: 'error' | 'info' | 'success'
}) {
  const styles: Record<string, string> = {
    error: 'border-red-200 bg-red-50 text-red-700',
    info: 'border-slate-200 bg-slate-50 text-slate-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }
  return (
    <div className={cn('rounded-xl border px-4 py-3 text-sm', styles[tone])}>{message}</div>
  )
}
