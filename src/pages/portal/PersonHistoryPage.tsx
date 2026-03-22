import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { PageHeader } from '../../components/PageHeader'
import { Spinner } from '../../components/Spinner'
import { formatDateTime } from '../../utils/format'

type HistoryData = Awaited<ReturnType<typeof api.getPersonHistory>>
type HistoryItem = NonNullable<HistoryData>[number]

export function PersonHistoryPage() {
  const { personId } = useParams()
  const parsedPersonId = personId ? Number(personId) : NaN

  const historyQuery = useQuery<HistoryData>({
    queryKey: ['people', parsedPersonId, 'history'],
    queryFn: () => api.getPersonHistory(parsedPersonId),
    enabled: Number.isFinite(parsedPersonId),
  })

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Person History'
        subtitle='Timeline of visits for this person.'
        actions={
          <Link to='/app/visits' className='text-sm text-slate-500'>
            Back to visits
          </Link>
        }
      />

      {historyQuery.isLoading ? (
        <Card className='flex items-center justify-center'>
          <Spinner />
        </Card>
      ) : historyQuery.data?.length ? (
        <div className='grid gap-4'>
          {historyQuery.data.map((visit: HistoryItem) => (
            <Card key={String(visit.id)} className='space-y-2'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold text-slate-900'>Visit {visit.id}</h3>
                <span className='text-xs text-slate-400'>
                  {formatDateTime(visit.check_in_at)}
                </span>
              </div>
              <p className='text-sm text-slate-600'>ID: {visit.id_masked || visit.id_last4 || '—'}</p>
              <p className='text-sm text-slate-600'>Purpose: {visit.purpose || '—'}</p>
              <p className='text-sm text-slate-600'>Checkout: {formatDateTime(visit.check_out_at)}</p>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title='No history found' description='This person has no recorded visits.' />
      )}
    </div>
  )
}
