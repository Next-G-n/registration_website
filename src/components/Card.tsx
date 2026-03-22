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
  return <div className={cn('portal-card', className)} style={style}>{children}</div>
}
