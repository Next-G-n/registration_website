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
    <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
      <div>
        <h1 className='text-2xl font-semibold' style={{ color: 'var(--brand-text, #0f172a)' }}>{title}</h1>
        {subtitle && <p className='text-sm' style={{ color: 'var(--brand-text-muted, #64748b)' }}>{subtitle}</p>}
      </div>
      {actions && <div className='flex items-center gap-2'>{actions}</div>}
    </div>
  )
}
