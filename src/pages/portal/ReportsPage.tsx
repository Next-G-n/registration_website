import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { listOrgVisitors } from '../../api/publicCheckinApi'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { FormField } from '../../components/FormField'
import { InlineAlert } from '../../components/InlineAlert'
import { Input } from '../../components/Input'
import { PageHeader } from '../../components/PageHeader'
import { Select } from '../../components/Select'
import { Spinner } from '../../components/Spinner'
import type { VisitorHistoryRow } from '../../types/checkin'
import { formatDate, formatDateTime, formatNumber } from '../../utils/format'
import { getErrorMessage } from '../../utils/error'

type DepartmentsData = Awaited<ReturnType<typeof api.getDepartments>>
type Department = NonNullable<DepartmentsData>[number]
type RegistrationPointsData = Awaited<ReturnType<typeof api.getRegistrationPoints>>
type RegistrationPoint = NonNullable<RegistrationPointsData>[number]

type FormValues = {
  from?: string
  to?: string
  department_id?: string
  public_key?: string
  q?: string
}

type VisitorFilters = {
  from?: string
  to?: string
  department_id?: number
  public_key?: string
  q?: string
}

type VisitWithDuration = {
  visit: VisitorHistoryRow
  durationMs: number
  isActive: boolean
  kioskKey: string
}

type PurposeReport = {
  purpose: string
  total: number
  active: number
  closed: number
  averageClosedMs: number
  longestMs: number
}

type KioskReport = {
  kioskKey: string
  kioskName: string
  total: number
  active: number
  closed: number
  averageClosedMs: number
  longestMs: number
}

type SourceReport = {
  sourceKey: string
  sourceLabel: string
  total: number
  active: number
  closed: number
  averageClosedMs: number
  longestMs: number
}

function parseDateMs(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.getTime()
}

function getLocalDateKey(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getVisitDurationMs(visit: VisitorHistoryRow, nowMs: number) {
  const checkInMs = parseDateMs(visit.check_in_at)
  if (checkInMs === null) return null
  const checkOutMs = parseDateMs(visit.check_out_at)
  const endMs = checkOutMs ?? nowMs
  return Math.max(0, endMs - checkInMs)
}

function formatDuration(ms?: number | null) {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return '--'
  const totalMinutes = Math.max(0, Math.round(ms / 60000))
  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function percentile(values: number[], p: number) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * (sorted.length - 1))))
  return sorted[index]
}

function downloadCsv(filename: string, rows: string[][]) {
  const escapeCell = (value: string) => {
    if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
    return value
  }
  const content = rows.map((row) => row.map((cell) => escapeCell(cell)).join(',')).join('\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function toKioskKey(value?: string | null) {
  const normalized = String(value || '').trim()
  return normalized || 'unknown'
}

function safeFileSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 60) || 'all'
}

function toSourceKey(value?: string | null) {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized || 'unknown'
}

function sourceLabel(value: string) {
  if (value === 'unknown') return 'Unknown'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function ReportsPage() {
  const [filters, setFilters] = useState<VisitorFilters>({})

  const departmentsQuery = useQuery<DepartmentsData>({
    queryKey: ['departments'],
    queryFn: api.getDepartments,
  })

  const registrationPointsQuery = useQuery<RegistrationPointsData>({
    queryKey: ['registration-points'],
    queryFn: api.getRegistrationPoints,
  })

  const visitsQuery = useQuery<VisitorHistoryRow[]>({
    queryKey: ['reports', 'visits', filters],
    queryFn: () =>
      listOrgVisitors({
        from: filters.from,
        to: filters.to,
        department_id: filters.department_id,
        q: filters.q,
      }),
  })

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { from: '', to: '', department_id: '', public_key: '', q: '' },
  })

  const kioskNameByKey = useMemo(() => {
    const map = new Map<string, string>()
    ;(registrationPointsQuery.data || []).forEach((point: RegistrationPoint) => {
      const key = toKioskKey(point.public_key)
      const name = String(point.name || '').trim() || `Kiosk ${point.id}`
      map.set(key, name)
    })
    return map
  }, [registrationPointsQuery.data])

  const filteredVisits = useMemo(() => {
    const visits = visitsQuery.data || []
    const selectedKey = toKioskKey(filters.public_key)
    if (!filters.public_key) return visits
    return visits.filter((visit) => toKioskKey(visit.public_key) === selectedKey)
  }, [visitsQuery.data, filters.public_key])

  const report = useMemo(() => {
    const visits = filteredVisits
    const nowMs = Date.now()

    const withDuration: VisitWithDuration[] = visits
      .map((visit) => {
        const durationMs = getVisitDurationMs(visit, nowMs)
        if (durationMs === null) return null
        const isActive = visit.status === 'IN' || !visit.check_out_at
        return {
          visit,
          durationMs,
          isActive,
          kioskKey: toKioskKey(visit.public_key),
        }
      })
      .filter((item): item is VisitWithDuration => Boolean(item))

    const closedDurations = withDuration.filter((item) => !item.isActive).map((item) => item.durationMs)
    const activeDurations = withDuration.filter((item) => item.isActive).map((item) => item.durationMs)

    const averageClosedMs = closedDurations.length
      ? closedDurations.reduce((sum, value) => sum + value, 0) / closedDurations.length
      : 0

    const medianClosedMs = percentile(closedDurations, 50)
    const p95ClosedMs = percentile(closedDurations, 95)

    const longestVisits = [...withDuration].sort((a, b) => b.durationMs - a.durationMs).slice(0, 10)

    const sortedRecentVisits = [...withDuration]
      .sort((a, b) => {
        const aMs = parseDateMs(a.visit.check_in_at) || 0
        const bMs = parseDateMs(b.visit.check_in_at) || 0
        return bMs - aMs
      })
      .slice(0, 5)

    const purposeMap = new Map<
      string,
      { total: number; active: number; closed: number; closedDurationSum: number; longestMs: number }
    >()
    withDuration.forEach((item) => {
      const purpose = item.visit.purpose || 'Unspecified'
      const current = purposeMap.get(purpose) || { total: 0, active: 0, closed: 0, closedDurationSum: 0, longestMs: 0 }
      current.total += 1
      if (item.isActive) {
        current.active += 1
      } else {
        current.closed += 1
        current.closedDurationSum += item.durationMs
      }
      current.longestMs = Math.max(current.longestMs, item.durationMs)
      purposeMap.set(purpose, current)
    })

    const purposes: PurposeReport[] = [...purposeMap.entries()]
      .map(([purpose, value]) => ({
        purpose,
        total: value.total,
        active: value.active,
        closed: value.closed,
        averageClosedMs: value.closed ? value.closedDurationSum / value.closed : 0,
        longestMs: value.longestMs,
      }))
      .sort((a, b) => b.total - a.total)

    const byDayMap = new Map<string, number>()
    visits.forEach((visit) => {
      const dayKey = getLocalDateKey(visit.check_in_at)
      if (!dayKey) return
      byDayMap.set(dayKey, (byDayMap.get(dayKey) || 0) + 1)
    })
    const byDay = [...byDayMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, count]) => ({ day, count }))

    const kioskMap = new Map<
      string,
      { total: number; active: number; closed: number; closedDurationSum: number; longestMs: number }
    >()
    withDuration.forEach((item) => {
      const key = item.kioskKey
      const current = kioskMap.get(key) || { total: 0, active: 0, closed: 0, closedDurationSum: 0, longestMs: 0 }
      current.total += 1
      if (item.isActive) {
        current.active += 1
      } else {
        current.closed += 1
        current.closedDurationSum += item.durationMs
      }
      current.longestMs = Math.max(current.longestMs, item.durationMs)
      kioskMap.set(key, current)
    })

    const kiosks: KioskReport[] = [...kioskMap.entries()]
      .map(([kioskKey, value]) => ({
        kioskKey,
        kioskName: kioskNameByKey.get(kioskKey) || (kioskKey === 'unknown' ? 'Unknown kiosk code' : kioskKey),
        total: value.total,
        active: value.active,
        closed: value.closed,
        averageClosedMs: value.closed ? value.closedDurationSum / value.closed : 0,
        longestMs: value.longestMs,
      }))
      .sort((a, b) => b.total - a.total)

    const sourceMap = new Map<
      string,
      { total: number; active: number; closed: number; closedDurationSum: number; longestMs: number }
    >()
    withDuration.forEach((item) => {
      const key = toSourceKey(item.visit.checkin_source)
      const current = sourceMap.get(key) || { total: 0, active: 0, closed: 0, closedDurationSum: 0, longestMs: 0 }
      current.total += 1
      if (item.isActive) {
        current.active += 1
      } else {
        current.closed += 1
        current.closedDurationSum += item.durationMs
      }
      current.longestMs = Math.max(current.longestMs, item.durationMs)
      sourceMap.set(key, current)
    })

    const sources: SourceReport[] = [...sourceMap.entries()]
      .map(([sourceKey, value]) => ({
        sourceKey,
        sourceLabel: sourceLabel(sourceKey),
        total: value.total,
        active: value.active,
        closed: value.closed,
        averageClosedMs: value.closed ? value.closedDurationSum / value.closed : 0,
        longestMs: value.longestMs,
      }))
      .sort((a, b) => b.total - a.total)

    const uniquePeople = new Set(withDuration.map((item) => item.visit.person_id).filter((id) => typeof id === 'number' && id > 0))

    return {
      visits,
      withDuration,
      longestVisits,
      recentVisits: sortedRecentVisits,
      purposes,
      kiosks,
      sources,
      byDay,
      totalVisits: withDuration.length,
      activeVisits: withDuration.filter((entry) => entry.isActive).length,
      uniquePeople: uniquePeople.size,
      averageClosedMs,
      medianClosedMs,
      p95ClosedMs,
      longestClosedMs: Math.max(0, ...closedDurations),
      averageActiveMs: activeDurations.length
        ? activeDurations.reduce((sum, value) => sum + value, 0) / activeDurations.length
        : 0,
    }
  }, [filteredVisits, kioskNameByKey])

  const visitsError = useMemo(() => getErrorMessage(visitsQuery.error), [visitsQuery.error])
  const maxDayCount = Math.max(1, ...report.byDay.map((entry) => entry.count))
  const selectedKioskKey = filters.public_key ? toKioskKey(filters.public_key) : ''
  const selectedKioskName = selectedKioskKey ? kioskNameByKey.get(selectedKioskKey) || selectedKioskKey : ''

  return (
    <div className='space-y-6'>
      <PageHeader title='Dashboard & Reports' subtitle='Consolidated metrics, trends, and kiosk-level reporting.' />

      <Card>
        <form
          onSubmit={handleSubmit((values) => {
            setFilters({
              from: values.from || undefined,
              to: values.to || undefined,
              department_id: values.department_id ? Number(values.department_id) : undefined,
              public_key: values.public_key?.trim() || undefined,
              q: values.q?.trim() || undefined,
            })
          })}
          className='grid gap-4 md:grid-cols-5'
        >
          <FormField label='From'>
            <Input type='datetime-local' {...register('from')} />
          </FormField>
          <FormField label='To'>
            <Input type='datetime-local' {...register('to')} />
          </FormField>
          <FormField label='Department'>
            <Select {...register('department_id')}>
              <option value=''>All</option>
              {departmentsQuery.data?.map((dept: Department) => (
                <option key={String(dept.id)} value={String(dept.id)}>
                  {dept.name || `Department ${dept.id}`}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label='Kiosk QR Code'>
            <Select {...register('public_key')}>
              <option value=''>All kiosks</option>
              {registrationPointsQuery.data?.map((point: RegistrationPoint) => (
                <option key={String(point.id)} value={point.public_key || ''}>
                  {(point.name || `Kiosk ${point.id}`) + (point.public_key ? ` (${point.public_key})` : '')}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label='Search'>
            <Input placeholder='Name, ID or purpose...' {...register('q')} />
          </FormField>
          <div className='md:col-span-5 flex flex-wrap gap-3'>
            <Button type='submit'>Apply filters</Button>
            <Button
              type='button'
              variant='secondary'
              onClick={() => {
                setFilters({})
                reset({ from: '', to: '', department_id: '', public_key: '', q: '' })
              }}
            >
              Clear
            </Button>
            <Button
              type='button'
              variant='secondary'
              onClick={() => {
                const rows: string[][] = [
                  [
                    'visit_id',
                    'person_id',
                    'full_name',
                    'id_masked',
                    'checkin_source',
                    'kiosk_public_key',
                    'kiosk_name',
                    'purpose',
                    'status',
                    'check_in_at',
                    'check_out_at',
                    'duration_minutes',
                  ],
                ]
                report.withDuration.forEach((entry) => {
                  const kioskKey = toKioskKey(entry.visit.public_key)
                  rows.push([
                    String(entry.visit.id),
                    String(entry.visit.person_id || ''),
                    entry.visit.full_name || '',
                    entry.visit.id_masked || '',
                    sourceLabel(toSourceKey(entry.visit.checkin_source)),
                    kioskKey,
                    kioskNameByKey.get(kioskKey) || '',
                    entry.visit.purpose || '',
                    entry.visit.status || '',
                    entry.visit.check_in_at || '',
                    entry.visit.check_out_at || '',
                    String(Math.round(entry.durationMs / 60000)),
                  ])
                })
                const segment = safeFileSegment(selectedKioskKey || 'all-kiosks')
                downloadCsv(`visit-reports-${segment}-${new Date().toISOString().slice(0, 10)}.csv`, rows)
              }}
              disabled={!report.withDuration.length}
            >
              Export CSV
            </Button>
          </div>
        </form>
      </Card>

      {selectedKioskKey ? (
        <Card>
          <p className='text-sm text-slate-700'>
            Filtered to kiosk: <span className='font-semibold text-slate-900'>{selectedKioskName}</span> ({selectedKioskKey})
          </p>
        </Card>
      ) : null}

      <div className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <h2 className='text-base font-semibold text-slate-900'>Volume Snapshot</h2>
          <div className='mt-4 grid gap-3 sm:grid-cols-3'>
            <div className='rounded-xl border border-slate-200 bg-white/80 p-3'>
              <p className='text-xs uppercase tracking-wide text-slate-500'>Total visits</p>
              <p className='mt-1 text-2xl font-semibold text-slate-900'>{formatNumber(report.totalVisits)}</p>
            </div>
            <div className='rounded-xl border border-slate-200 bg-white/80 p-3'>
              <p className='text-xs uppercase tracking-wide text-slate-500'>Active visits</p>
              <p className='mt-1 text-2xl font-semibold text-slate-900'>{formatNumber(report.activeVisits)}</p>
            </div>
            <div className='rounded-xl border border-slate-200 bg-white/80 p-3'>
              <p className='text-xs uppercase tracking-wide text-slate-500'>Unique people</p>
              <p className='mt-1 text-2xl font-semibold text-slate-900'>{formatNumber(report.uniquePeople)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <h2 className='text-base font-semibold text-slate-900'>Duration Insights</h2>
          <div className='mt-4 grid gap-3 sm:grid-cols-2'>
            <div className='rounded-xl border border-slate-200 bg-white/80 p-3'>
              <p className='text-xs uppercase tracking-wide text-slate-500'>Avg closed duration</p>
              <p className='mt-1 text-xl font-semibold text-slate-900'>{formatDuration(report.averageClosedMs)}</p>
            </div>
            <div className='rounded-xl border border-slate-200 bg-white/80 p-3'>
              <p className='text-xs uppercase tracking-wide text-slate-500'>Median closed duration</p>
              <p className='mt-1 text-xl font-semibold text-slate-900'>{formatDuration(report.medianClosedMs)}</p>
            </div>
            <div className='rounded-xl border border-slate-200 bg-white/80 p-3'>
              <p className='text-xs uppercase tracking-wide text-slate-500'>P95 closed duration</p>
              <p className='mt-1 text-xl font-semibold text-slate-900'>{formatDuration(report.p95ClosedMs)}</p>
            </div>
            <div className='rounded-xl border border-slate-200 bg-white/80 p-3'>
              <p className='text-xs uppercase tracking-wide text-slate-500'>Longest closed visit</p>
              <p className='mt-1 text-xl font-semibold text-slate-900'>{formatDuration(report.longestClosedMs)}</p>
            </div>
            <div className='rounded-xl border border-slate-200 bg-white/80 p-3 sm:col-span-2'>
              <p className='text-xs uppercase tracking-wide text-slate-500'>Avg active age</p>
              <p className='mt-1 text-xl font-semibold text-slate-900'>{formatDuration(report.averageActiveMs)}</p>
            </div>
          </div>
        </Card>
      </div>

      {visitsQuery.isLoading ? (
        <Card className='flex items-center justify-center'>
          <Spinner />
        </Card>
      ) : visitsQuery.isError ? (
        <Card>
          <InlineAlert message={visitsError} />
        </Card>
      ) : !report.visits.length ? (
        <EmptyState title='No visits found' description='Try changing filters to generate reports.' />
      ) : (
        <>
          <div className='grid gap-6 lg:grid-cols-2'>
            <Card>
              <div className='flex items-center justify-between'>
                <h2 className='text-lg font-semibold text-slate-900'>Recent visits</h2>
                <span className='text-xs text-slate-400'>Last 5 entries</span>
              </div>
              <div className='mt-4 divide-y divide-slate-100'>
                {report.recentVisits.map((entry) => (
                  <div key={String(entry.visit.id)} className='flex items-center justify-between py-3'>
                    <div>
                      <p className='text-sm font-medium text-slate-900'>{entry.visit.full_name || 'Visitor'}</p>
                      <p className='text-xs text-slate-500'>ID: {entry.visit.id_masked || '--'}</p>
                    </div>
                    <p className='text-xs text-slate-400'>{formatDateTime(entry.visit.check_in_at)}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className='text-lg font-semibold text-slate-900'>Visits by day</h2>
              <div className='mt-4 space-y-3'>
                {report.byDay.slice(-14).map((entry) => (
                  <div key={entry.day}>
                    <div className='flex items-center justify-between text-sm text-slate-600'>
                      <span>{formatDate(entry.day)}</span>
                      <span className='font-medium text-slate-900'>{formatNumber(entry.count)}</span>
                    </div>
                    <div className='mt-1 h-2 rounded-full bg-slate-100'>
                      <div className='h-2 rounded-full bg-slate-900' style={{ width: `${(entry.count / maxDayCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className='grid gap-6 lg:grid-cols-2'>
            <Card>
              <h2 className='text-lg font-semibold text-slate-900'>Longest visits</h2>
              <div className='mt-4 overflow-x-auto'>
                <table className='min-w-full text-left text-sm'>
                  <thead className='text-xs uppercase text-slate-400'>
                    <tr>
                      <th className='py-2'>Visitor</th>
                      <th className='py-2'>Purpose</th>
                      <th className='py-2'>Status</th>
                      <th className='py-2'>Duration</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-100'>
                    {report.longestVisits.map((entry) => (
                      <tr key={String(entry.visit.id)}>
                        <td className='py-3 font-medium text-slate-900'>{entry.visit.full_name || 'Visitor'}</td>
                        <td className='py-3 text-slate-600'>{entry.visit.purpose || 'Unspecified'}</td>
                        <td className='py-3'>
                          <Badge label={entry.isActive ? 'IN' : 'OUT'} tone={entry.isActive ? 'amber' : 'green'} />
                        </td>
                        <td className='py-3 text-slate-700'>{formatDuration(entry.durationMs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <h2 className='text-lg font-semibold text-slate-900'>Kiosk split (QR code)</h2>
              <div className='mt-4 overflow-x-auto'>
                <table className='min-w-full text-left text-sm'>
                  <thead className='text-xs uppercase text-slate-400'>
                    <tr>
                      <th className='py-2'>Kiosk</th>
                      <th className='py-2'>Code</th>
                      <th className='py-2'>Total</th>
                      <th className='py-2'>Active</th>
                      <th className='py-2'>Closed</th>
                      <th className='py-2'>Avg closed</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-100'>
                    {report.kiosks.map((kiosk) => (
                      <tr key={kiosk.kioskKey}>
                        <td className='py-3 font-medium text-slate-900'>{kiosk.kioskName}</td>
                        <td className='py-3 text-slate-700'>{kiosk.kioskKey}</td>
                        <td className='py-3 text-slate-700'>{formatNumber(kiosk.total)}</td>
                        <td className='py-3 text-slate-700'>{formatNumber(kiosk.active)}</td>
                        <td className='py-3 text-slate-700'>{formatNumber(kiosk.closed)}</td>
                        <td className='py-3 text-slate-700'>{formatDuration(kiosk.averageClosedMs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <Card>
            <h2 className='text-lg font-semibold text-slate-900'>Check-in source split</h2>
            <div className='mt-4 overflow-x-auto'>
              <table className='min-w-full text-left text-sm'>
                <thead className='text-xs uppercase text-slate-400'>
                  <tr>
                    <th className='py-2'>Source</th>
                    <th className='py-2'>Total</th>
                    <th className='py-2'>Active</th>
                    <th className='py-2'>Closed</th>
                    <th className='py-2'>Share</th>
                    <th className='py-2'>Avg closed</th>
                    <th className='py-2'>Longest</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
                  {report.sources.map((source) => (
                    <tr key={source.sourceKey}>
                      <td className='py-3 font-medium text-slate-900'>{source.sourceLabel}</td>
                      <td className='py-3 text-slate-700'>{formatNumber(source.total)}</td>
                      <td className='py-3 text-slate-700'>{formatNumber(source.active)}</td>
                      <td className='py-3 text-slate-700'>{formatNumber(source.closed)}</td>
                      <td className='py-3 text-slate-700'>
                        {report.totalVisits ? `${((source.total / report.totalVisits) * 100).toFixed(1)}%` : '--'}
                      </td>
                      <td className='py-3 text-slate-700'>{formatDuration(source.averageClosedMs)}</td>
                      <td className='py-3 text-slate-700'>{formatDuration(source.longestMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h2 className='text-lg font-semibold text-slate-900'>Purpose breakdown</h2>
            <div className='mt-4 overflow-x-auto'>
              <table className='min-w-full text-left text-sm'>
                <thead className='text-xs uppercase text-slate-400'>
                  <tr>
                    <th className='py-2'>Purpose</th>
                    <th className='py-2'>Total</th>
                    <th className='py-2'>Active</th>
                    <th className='py-2'>Closed</th>
                    <th className='py-2'>Avg closed duration</th>
                    <th className='py-2'>Longest</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
                  {report.purposes.map((purpose) => (
                    <tr key={purpose.purpose}>
                      <td className='py-3 font-medium text-slate-900'>{purpose.purpose}</td>
                      <td className='py-3 text-slate-700'>{formatNumber(purpose.total)}</td>
                      <td className='py-3 text-slate-700'>{formatNumber(purpose.active)}</td>
                      <td className='py-3 text-slate-700'>{formatNumber(purpose.closed)}</td>
                      <td className='py-3 text-slate-700'>{formatDuration(purpose.averageClosedMs)}</td>
                      <td className='py-3 text-slate-700'>{formatDuration(purpose.longestMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h2 className='text-lg font-semibold text-slate-900'>Notes</h2>
            <ul className='mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600'>
              <li>Set Kiosk QR Code to view reports for one kiosk code only.</li>
              <li>Durations are calculated from check-in to check-out for closed visits.</li>
              <li>Active visit duration uses current time.</li>
              <li>Kiosk split uses each visit row public_key.</li>
              <li>Source split uses each visit row checkin_source.</li>
            </ul>
          </Card>
        </>
      )}
    </div>
  )
}
