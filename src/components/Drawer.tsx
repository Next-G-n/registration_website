import { cn } from '../utils/cn'

export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  if (!open) return null

  return (
    <div className='fixed inset-0 z-50 flex justify-end'>
      <div className='absolute inset-0 bg-slate-900/40' onClick={onClose} />
      <div className={cn('relative h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl')}>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-slate-900'>{title}</h2>
          <button className='text-sm text-slate-500' onClick={onClose}>
            Close
          </button>
        </div>
        <div className='mt-4'>{children}</div>
      </div>
    </div>
  )
}
