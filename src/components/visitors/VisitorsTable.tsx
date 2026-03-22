import { Badge } from '../Badge'
import { Button } from '../Button'
import { VisitorRowCard } from './VisitorRowCard'
import { formatDateTime } from '../../utils/format'
import type { VisitorHistoryRow } from '../../types/checkin'

export function VisitorsTable({
  visits,
  onViewDetails,
  onCheckout,
  checkoutPendingId,
}: {
  visits: VisitorHistoryRow[]
  onViewDetails: (visit: VisitorHistoryRow) => void
  onCheckout: (visit: VisitorHistoryRow) => void
  checkoutPendingId: number | null
}) {
  return (
    <>
      <div className='space-y-3 md:hidden'>
        {visits.map((visit) => (
          <VisitorRowCard
            key={visit.id}
            visit={visit}
            onViewDetails={onViewDetails}
            onCheckout={onCheckout}
            checkoutPending={checkoutPendingId === visit.id}
          />
        ))}
      </div>

      <div className='table-shell hidden overflow-x-auto md:block'>
        <table className='data-table'>
          <thead>
            <tr>
              <th>Visitor</th>
              <th>Status</th>
              <th>Department</th>
              <th>Purpose</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th className='text-right'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((visit) => {
              const canCheckOut = visit.status === 'IN'
              const isPending = checkoutPendingId === visit.id

              return (
                <tr key={visit.id}>
                  <td>
                    <p className='font-medium text-slate-900'>{visit.full_name}</p>
                    {visit.id_masked && <p className='text-xs text-slate-400'>{visit.id_masked}</p>}
                  </td>
                  <td>
                    <Badge label={visit.status} tone={visit.status === 'OUT' ? 'green' : 'amber'} />
                  </td>
                  <td>{visit.department || 'â€”'}</td>
                  <td className='max-w-[140px] truncate'>{visit.purpose || 'â€”'}</td>
                  <td className='whitespace-nowrap'>{formatDateTime(visit.check_in_at)}</td>
                  <td className='whitespace-nowrap'>{visit.check_out_at ? formatDateTime(visit.check_out_at) : 'â€”'}</td>
                  <td>
                    <div className='flex justify-end gap-2'>
                      <Button size='sm' variant='secondary' onClick={() => onViewDetails(visit)}>
                        Details
                      </Button>
                      {canCheckOut && (
                        <Button
                          size='sm'
                          onClick={() => onCheckout(visit)}
                          disabled={isPending || !visit.public_key}
                          title={!visit.public_key ? 'No registration-point key attached.' : ''}
                        >
                          {isPending ? 'Checking...' : 'Check out'}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
