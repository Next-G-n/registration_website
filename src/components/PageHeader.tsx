export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
      <div>
        <h1 className='text-3xl font-semibold tracking-tight md:text-4xl' style={{ color: 'var(--brand-text, #0f172a)' }}>{title}</h1>
        {subtitle && <p className='mt-2 max-w-2xl text-base leading-7' style={{ color: 'var(--brand-text-muted, #64748b)' }}>{subtitle}</p>}
      </div>
      {actions && <div className='flex items-center gap-2'>{actions}</div>}
    </div>
  )
}
