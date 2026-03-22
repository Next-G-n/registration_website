import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { PageHeader } from '../../components/PageHeader'
import { Spinner } from '../../components/Spinner'
import { formatNumber } from '../../utils/format'

function formatLabel(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function AnalyticsPage() {
  const query = useQuery({ queryKey: ['analytics', 'summary'], queryFn: api.getAnalyticsSummary })

  const numericEntries = Object.entries(query.data || {}).filter(([, value]) => typeof value === 'number')
  const maxValue = Math.max(1, ...numericEntries.map(([, value]) => Number(value)))

  return (
    <div className='space-y-6'>
      <PageHeader title='Analytics' subtitle='Summary metrics and trends.' />

      {query.isLoading ? (
        <Card className='flex items-center justify-center'>
          <Spinner />
        </Card>
      ) : numericEntries.length ? (
        <Card>
          <h2 className='text-lg font-semibold text-slate-900'>Summary chart</h2>
          <div className='mt-6 space-y-4'>
            {numericEntries.map(([key, value]) => (
              <div key={key}>
                <div className='flex items-center justify-between text-sm text-slate-600'>
                  <span>{formatLabel(key)}</span>
                  <span className='font-semibold text-slate-900'>{formatNumber(value as number)}</span>
                </div>
                <div className='mt-2 h-2 w-full rounded-full bg-slate-100'>
                  <div
                    className='h-2 rounded-full bg-slate-900'
                    style={{ width: `${(Number(value) / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState title='No analytics data yet' description='Summary metrics will appear here.' />
      )}
    </div>
  )
}
