import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { PageHeader } from '../../components/PageHeader'
import { Spinner } from '../../components/Spinner'
import { formatDateTime, formatNumber } from '../../utils/format'

function formatLabel(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

type SummaryData = Awaited<ReturnType<typeof api.getAnalyticsSummary>>
type VisitsData = Awaited<ReturnType<typeof api.getVisits>>
type Visit = NonNullable<VisitsData>[number]

export function DashboardPage() {
  const summaryQuery = useQuery<SummaryData>({
    queryKey: ['analytics', 'summary'],
    queryFn: api.getAnalyticsSummary,
  })

  const visitsQuery = useQuery<VisitsData>({
    queryKey: ['visits', 'recent'],
    queryFn: () => api.getVisits(),
  })

  const summaryEntries = Object.entries(summaryQuery.data || {}).filter(
    ([, value]) => typeof value === 'number' || typeof value === 'string',
  )

  const recentVisits: Visit[] = visitsQuery.data?.slice(0, 5) || []

  return (
    <div className='space-y-6'>
      <PageHeader title='Dashboard' subtitle='At-a-glance view of today’s visitor activity.' />

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {summaryQuery.isLoading ? (
          <Card className='flex items-center justify-center'>
            <Spinner />
          </Card>
        ) : summaryEntries.length ? (
          summaryEntries.slice(0, 4).map(([key, value]) => (
            <Card key={key}>
              <p className='text-xs uppercase tracking-[0.2em] text-slate-400'>{formatLabel(key)}</p>
              <p className='mt-3 text-3xl font-semibold text-slate-900'>{formatNumber(value as number | string)}</p>
            </Card>
          ))
        ) : (
          <Card>
            <p className='text-sm text-slate-500'>No summary data yet.</p>
          </Card>
        )}
      </div>

      <Card>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-slate-900'>Recent visits</h2>
          <span className='text-xs text-slate-400'>Last 5 entries</span>
        </div>
        {visitsQuery.isLoading ? (
          <div className='mt-6 flex justify-center'>
            <Spinner />
          </div>
        ) : recentVisits.length ? (
          <div className='mt-4 divide-y divide-slate-100'>
            {recentVisits.map((visit) => (
              <div key={String(visit.id)} className='flex items-center justify-between py-3'>
                <div>
                  <p className='text-sm font-medium text-slate-900'>
                    {visit.full_name || 'Visitor'}
                  </p>
                  <p className='text-xs text-slate-500'>ID: {visit.id_masked || visit.id_last4 || '—'}</p>
                </div>
                <p className='text-xs text-slate-400'>{formatDateTime(visit.check_in_at)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className='mt-4'>
            <EmptyState title='No visits yet' description='Check-ins will appear here.' />
          </div>
        )}
      </Card>
    </div>
  )
}
