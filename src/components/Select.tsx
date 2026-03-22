import { cn } from '../utils/cn'

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('field-control h-12 w-full px-4 text-sm', className)} {...props}>
      {children}
    </select>
  )
}
