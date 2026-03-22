import { cn } from '../utils/cn'

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('field-control min-h-[120px] w-full px-4 py-3 text-sm', className)} {...props} />
}
