import type { ReactNode } from 'react'
import { Drawer } from '../Drawer'
import { Button } from '../Button'
import { buildVisitorDetailSections, idLabelForVisitor } from '../../utils/visitorDisplay'
import { isPresent } from '../../utils/presence'
import type { VisitorHistoryRow } from '../../types/checkin'

function DetailsSection({ title, items }: { title: string; items: Array<{ label: string; value: ReactNode }> }) {
  if (!items.length) return null

  return (
    <section className='space-y-3 rounded-xl border border-slate-200 p-4'>
      <p className='text-xs uppercase tracking-[0.2em] text-slate-400'>{title}</p>
      <dl className='grid gap-3 sm:grid-cols-2'>
        {items.map((item) => (
          <div key={`${title}-${item.label}`}>
            <dt className='text-xs uppercase tracking-wide text-slate-400'>{item.label}</dt>
            <dd className='text-sm text-slate-700'>{item.value}</dd>
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
      <p className='text-xs uppercase tracking-[0.2em] text-slate-400'>Visitor</p>
      <h3 className='text-lg font-semibold text-slate-900'>{visit.full_name}</h3>
      {isPresent(visit.id_masked) ? (
        <p className='text-sm text-slate-500'>
          <span className='font-medium text-slate-700'>{idLabel}:</span> {visit.id_masked}
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
    <Drawer open={open} onClose={onClose} title='Visitor details'>
      {!visit ? null : (
        <div className='space-y-5'>
          <HeaderIdentity visit={visit} />

          {isPresent(visit.visitor_photo) ? (
            <div className='rounded-xl border border-slate-200 p-3'>
              <p className='mb-2 text-xs uppercase tracking-wide text-slate-400'>Photo</p>
              <img src={visit.visitor_photo || undefined} alt='Visitor' className='h-40 w-40 rounded-lg object-cover' />
            </div>
          ) : null}

          {buildVisitorDetailSections(visit).map((section) => (
            <DetailsSection key={section.title} title={section.title} items={section.items} />
          ))}

          {visit.person_id ? (
            <Button type='button' variant='secondary' onClick={() => onOpenPersonHistory(visit.person_id as number)}>
              Open person history
            </Button>
          ) : null}
        </div>
      )}
    </Drawer>
  )
}
