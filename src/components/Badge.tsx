import { cn } from '../utils/cn'

export function Badge({ label, tone = 'slate' }: { label: string; tone?: 'slate' | 'green' | 'amber' | 'red' }) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
  }
  return <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone])}>{label}</span>
}
