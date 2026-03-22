import type { ReactNode } from 'react'
import { Drawer } from '../Drawer'
import { Button } from '../Button'
import { buildVisitorDetailSections, idLabelForVisitor } from '../../utils/visitorDisplay'
import { isPresent } from '../../utils/presence'
import type { VisitorHistoryRow } from '../../types/checkin'

function DetailsSection({ title, items }: { title: string; items: Array<{ label: string; value: ReactNode }> }) {
  if (!items.length) return null

  return (
    <section className='space-y-4 rounded-3xl border border-[color:var(--brand-surface-edge)] bg-[color:var(--brand-secondary-surface)]/55 p-5'>
      <p className='text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand-text-muted)]'>{title}</p>
      <dl className='grid gap-3 sm:grid-cols-2'>
        {items.map((item) => (
          <div key={`${title}-${item.label}`} className='rounded-2xl border border-white/70 bg-white/85 p-3 shadow-[0_12px_24px_-22px_rgba(15,23,42,0.18)]'>
            <dt className='text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-text-muted)]'>{item.label}</dt>
            <dd className='mt-1 text-sm text-[color:var(--brand-text-soft)]'>{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function HeaderIdentity({ visit }: { visit: VisitorHistoryRow }) {
  const idLabel = idLabelForVisitor(visit)

  return (
    <div className='space-y-1'>
      <p className='text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-text-muted)]'>Visitor</p>
      <h3 className='text-xl font-semibold text-[color:var(--brand-text)]'>{visit.full_name}</h3>
      {isPresent(visit.id_masked) ? (
        <p className='text-sm text-[color:var(--brand-text-soft)]'>
          <span className='font-medium text-[color:var(--brand-text)]'>{idLabel}:</span> {visit.id_masked}
        </p>
      ) : null}
    </div>
  )
}

export function VisitorsDetailModal({
  visit,
  open,
  onClose,
  onOpenPersonHistory,
}: {
  visit: VisitorHistoryRow | null
  open: boolean
  onClose: () => void
  onOpenPersonHistory: (personId: number) => void
}) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title='Visitor details'
      description='Review captured visitor information and open linked person history when available.'
      panelClassName='sm:max-w-2xl'
      footer={
        <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
          <Button type='button' variant='secondary' onClick={onClose}>
            Close
          </Button>
          {visit?.person_id ? (
            <Button type='button' onClick={() => onOpenPersonHistory(visit.person_id as number)}>
              Open person history
            </Button>
          ) : null}
        </div>
      }
    >
      {!visit ? null : (
        <div className='space-y-6'>
          <div className='rounded-3xl border border-[color:var(--brand-surface-edge)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-5 shadow-[0_24px_42px_-34px_rgba(15,23,42,0.32)]'>
            <HeaderIdentity visit={visit} />
          </div>

          {isPresent(visit.visitor_photo) ? (
            <div className='rounded-3xl border border-[color:var(--brand-surface-edge)] bg-white/90 p-4 shadow-[0_20px_38px_-32px_rgba(15,23,42,0.28)]'>
              <p className='mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand-text-muted)]'>Photo</p>
              <img src={visit.visitor_photo || undefined} alt='Visitor' className='h-48 w-full rounded-2xl object-cover sm:w-48' />
            </div>
          ) : null}

          {buildVisitorDetailSections(visit).map((section) => (
            <DetailsSection key={section.title} title={section.title} items={section.items} />
          ))}
        </div>
      )}
    </Drawer>
  )
}
