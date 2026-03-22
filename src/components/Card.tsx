import { cn } from '../utils/cn'

export function Card({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return <div className={cn('portal-card', className)} style={{ borderColor: 'var(--brand-primary-soft, #e2e8f0)', ...style }}>{children}</div>
}
