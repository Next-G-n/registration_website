export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-12 text-center'>
      <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100'>
        <svg width='22' height='22' viewBox='0 0 22 22' fill='none' className='text-slate-400'>
          <rect x='3' y='5' width='16' height='14' rx='2' stroke='currentColor' strokeWidth='1.6' />
          <path d='M7 5V4a4 4 0 0 1 8 0v1' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' />
          <path d='M8 11h6M8 14.5h4' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
        </svg>
      </div>
      <h3 className='text-sm font-semibold text-slate-800'>{title}</h3>
      {description && <p className='mt-1 text-sm text-slate-500'>{description}</p>}
    </div>
  )
}
