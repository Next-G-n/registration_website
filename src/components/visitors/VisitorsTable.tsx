import { VisitorRowCard } from './VisitorRowCard'
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
    <div className='space-y-3'>
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
  )
}
