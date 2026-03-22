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
      <PageHeader title='Dashboard' subtitle="At-a-glance view of today's visitor activity." />

      {/* Stat cards */}
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {summaryQuery.isLoading ? (
          <Card className='flex items-center justify-center'>
            <Spinner />
          </Card>
        ) : summaryEntries.length ? (
          summaryEntries.slice(0, 4).map(([key, value]) => (
            <div
              key={key}
              className='portal-card relative overflow-hidden'
              style={{ borderColor: 'var(--brand-primary-soft, #e2e8f0)' }}
            >
              {/* Accent bar */}
              <div
                className='absolute inset-x-0 top-0 h-0.5 rounded-t-2xl'
                style={{ background: 'var(--brand-primary, #0A84FF)' }}
              />
              <p className='mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400'>
                {formatLabel(key)}
              </p>
              <p
                className='mt-2 text-3xl font-bold tracking-tight'
                style={{ color: 'var(--brand-text, #0f172a)' }}
              >
                {formatNumber(value as number | string)}
              </p>
            </div>
          ))
        ) : (
          <Card>
            <p className='text-sm text-slate-500'>No summary data yet.</p>
          </Card>
        )}
      </div>

      {/* Recent visits */}
      <Card>
        <div className='flex items-center justify-between'>
          <h2 className='text-base font-semibold text-slate-900'>Recent visits</h2>
          <span className='rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500'>
            Last 5
          </span>
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
                  <p className='text-xs text-slate-400'>
                    ID: {visit.id_masked || visit.id_last4 || '—'}
                  </p>
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
