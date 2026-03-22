export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className='rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center'>
      <h3 className='text-lg font-semibold text-slate-800'>{title}</h3>
      {description && <p className='mt-2 text-sm text-slate-500'>{description}</p>}
    </div>
  )
}
