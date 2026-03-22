import { cn } from '../utils/cn'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('field-control h-12 w-full px-4 text-sm', className)} {...props} />
}
