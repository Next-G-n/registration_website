import { Badge } from '../Badge'
import { Button } from '../Button'
import { formatDateTime } from '../../utils/format'
import { isPresent } from '../../utils/presence'
import { buildVisitorMetaItems } from '../../utils/visitorDisplay'
import type { VisitorHistoryRow } from '../../types/checkin'

export function VisitorRowCard({
  visit,
  onViewDetails,
  onCheckout,
  checkoutPending,
}: {
  visit: VisitorHistoryRow
  onViewDetails: (visit: VisitorHistoryRow) => void
  onCheckout: (visit: VisitorHistoryRow) => void
  checkoutPending: boolean
}) {
  const metaItems = buildVisitorMetaItems(visit)
  const canCheckOut = visit.status === 'IN'
  const checkOutDisabled = checkoutPending || !visit.public_key

  return (
    <article className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
      <div className='flex items-start justify-between gap-3'>
        <h3 className='text-base font-semibold text-slate-900'>{visit.full_name}</h3>
        <Badge label={visit.status} tone={visit.status === 'OUT' ? 'green' : 'amber'} />
      </div>

      <div className='mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600'>
        {isPresent(visit.check_in_at) ? <p>Checked in {formatDateTime(visit.check_in_at)}</p> : null}
        {isPresent(visit.check_out_at) ? <p>Checked out {formatDateTime(visit.check_out_at)}</p> : null}
      </div>

      {metaItems.length ? (
        <div className='mt-3 flex flex-wrap gap-2'>
          {metaItems.map((item) => (
            <div key={`${visit.id}-${item.label}`} className='rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700'>
              <span className='font-medium text-slate-900'>{item.label}:</span> {item.value}
            </div>
          ))}
        </div>
      ) : null}

      <div className='mt-4 flex flex-wrap gap-2'>
        <Button type='button' size='sm' variant='secondary' onClick={() => onViewDetails(visit)}>
          View details
        </Button>
        {canCheckOut ? (
          <Button
            type='button'
            size='sm'
            onClick={() => onCheckout(visit)}
            disabled={checkOutDisabled}
            title={!visit.public_key ? 'Cannot check out this row because no registration-point public key is attached.' : ''}
          >
            {checkoutPending ? 'Checking...' : 'Check out'}
          </Button>
        ) : null}
      </div>
    </article>
  )
}
