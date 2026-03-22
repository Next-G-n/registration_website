import { cn } from '../utils/cn'

export function Badge({ label, tone = 'slate' }: { label: string; tone?: 'slate' | 'green' | 'amber' | 'red' }) {
  const tones: Record<string, string> = {
    slate: 'border-[color:var(--brand-secondary-border)] bg-[color:var(--brand-secondary-surface)] text-[color:var(--brand-secondary-text)]',
    green: 'border-emerald-200 bg-emerald-100/90 text-emerald-700',
    amber: 'border-amber-200 bg-amber-100/90 text-amber-700',
    red: 'border-red-200 bg-red-100/90 text-red-700',
  }
  return <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm', tones[tone])}>{label}</span>
}
