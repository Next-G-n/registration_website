export function FormField({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: unknown
  hint?: string
  children: React.ReactNode
}) {
  const message =
    typeof error === 'string'
      ? error
      : error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string'
        ? String((error as { message?: unknown }).message)
        : undefined

  return (
    <label className='flex flex-col gap-2 text-sm font-medium text-slate-700'>
      <span>{label}</span>
      {children}
      {hint && <span className='text-xs text-slate-500'>{hint}</span>}
      {message && <span className='text-xs text-red-600'>{message}</span>}
    </label>
  )
}
