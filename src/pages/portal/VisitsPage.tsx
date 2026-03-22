import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { checkoutPublicCheckIn, listOrgVisitors } from '../../api/publicCheckinApi'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { FormField } from '../../components/FormField'
import { InlineAlert } from '../../components/InlineAlert'
import { Input } from '../../components/Input'
import { PageHeader } from '../../components/PageHeader'
import { Select } from '../../components/Select'
import { Spinner } from '../../components/Spinner'
import { CheckoutFeedbackModal } from '../../components/visitors/CheckoutFeedbackModal'
import { VisitorsDetailModal } from '../../components/visitors/VisitorsDetailModal'
import { VisitorsTable } from '../../components/visitors/VisitorsTable'
import type { CheckoutFeedbackPayload, VisitorHistoryRow } from '../../types/checkin'
import type { CheckoutFeedbackForm } from '../../schemas/checkinWizardSchema'
import { getErrorMessage } from '../../utils/error'

type DepartmentsData = Awaited<ReturnType<typeof api.getDepartments>>
type Department = NonNullable<DepartmentsData>[number]

type FormValues = {
  from?: string
  to?: string
  department_id?: string
  q?: string
}

type VisitorFilters = {
  from?: string
  to?: string
  department_id?: number
  q?: string
}

export function VisitsPage() {
  const [filters, setFilters] = useState<VisitorFilters>({})
  const [selectedVisit, setSelectedVisit] = useState<VisitorHistoryRow | null>(null)
  const [checkoutVisit, setCheckoutVisit] = useState<VisitorHistoryRow | null>(null)
  const [checkoutUiError, setCheckoutUiError] = useState<string | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const visitsQueryKey = ['visitors-history', filters] as const

  const departmentsQuery = useQuery<DepartmentsData>({
    queryKey: ['departments'],
    queryFn: api.getDepartments,
  })

  const visitsQuery = useQuery({
    queryKey: visitsQueryKey,
    queryFn: () => listOrgVisitors(filters),
  })

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { from: '', to: '', department_id: '', q: '' },
  })

  const checkoutMutation = useMutation({
    mutationFn: async (input: { visit: VisitorHistoryRow; payload: CheckoutFeedbackPayload }) => {
      if (!input.visit.public_key) {
        throw new Error('This visitor record does not include a registration-point public key.')
      }
      return checkoutPublicCheckIn(input.visit.public_key, input.visit.checkin_id, input.payload)
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: visitsQueryKey })
      const previous = queryClient.getQueryData<VisitorHistoryRow[]>(visitsQueryKey)
      const optimisticCheckoutAt = new Date().toISOString()

      queryClient.setQueryData<VisitorHistoryRow[]>(visitsQueryKey, (current) =>
        (current || []).map((visit) =>
          visit.id === input.visit.id
            ? {
                ...visit,
                status: 'OUT',
                check_out_at: optimisticCheckoutAt,
              }
            : visit,
        ),
      )

      return { previous }
    },
    onError: (error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(visitsQueryKey, context.previous)
      }
      setCheckoutUiError(getErrorMessage(error, 'Unable to complete check out.'))
    },
    onSuccess: () => {
      setCheckoutUiError(null)
      setCheckoutVisit(null)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: visitsQueryKey })
    },
  })

  const errorMessage = useMemo(() => getErrorMessage(visitsQuery.error), [visitsQuery.error])

  return (
    <div className='space-y-6'>
      <PageHeader title='Visits' subtitle='Track visitors, visit details, and IN/OUT status.' />

      <Card>
        <form
          onSubmit={handleSubmit((values) => {
            const nextFilters: VisitorFilters = {
              from: values.from || undefined,
              to: values.to || undefined,
              department_id: values.department_id ? Number(values.department_id) : undefined,
              q: values.q?.trim() || undefined,
            }
            setFilters(nextFilters)
          })}
          className='grid gap-4 md:grid-cols-4'
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
          <FormField label='Search'>
            <Input placeholder='Search visitor, reason, ID...' {...register('q')} />
          </FormField>
          <div className='flex flex-wrap items-center gap-3 md:col-span-4'>
            <Button type='submit'>Apply filters</Button>
            <Button
              type='button'
              variant='secondary'
              onClick={() => {
                setFilters({})
                reset({ from: '', to: '', department_id: '', q: '' })
              }}
            >
              Clear
            </Button>
          </div>
        </form>
      </Card>

      {checkoutUiError ? <InlineAlert message={checkoutUiError} /> : null}

      {visitsQuery.isLoading ? (
        <Card className='flex items-center justify-center'>
          <Spinner />
        </Card>
      ) : visitsQuery.isError ? (
        <Card>
          <p className='text-sm text-red-600'>{errorMessage}</p>
        </Card>
      ) : visitsQuery.data?.length ? (
        <Card>
          <VisitorsTable
            visits={visitsQuery.data}
            onViewDetails={setSelectedVisit}
            onCheckout={(visit) => {
              if (!visit.public_key) {
                setCheckoutUiError('Cannot check out this row because no registration-point public key is attached.')
                return
              }
              setCheckoutUiError(null)
              setCheckoutVisit(visit)
            }}
            checkoutPendingId={checkoutMutation.variables?.visit.id || null}
          />
        </Card>
      ) : (
        <EmptyState title='No visits found' description='Try adjusting filters or date range.' />
      )}

      <VisitorsDetailModal
        visit={selectedVisit}
        open={Boolean(selectedVisit)}
        onClose={() => setSelectedVisit(null)}
        onOpenPersonHistory={(personId) => navigate(`/app/people/${personId}`)}
      />

      <CheckoutFeedbackModal
        visit={checkoutVisit}
        open={Boolean(checkoutVisit)}
        submitting={checkoutMutation.isPending}
        onClose={() => setCheckoutVisit(null)}
        onSubmit={(values: CheckoutFeedbackForm) => {
          if (!checkoutVisit) return
          const payload: CheckoutFeedbackPayload = {
            feedback_opt_in: values.feedback_opt_in,
            feedback_rating: values.feedback_opt_in ? values.feedback_rating : null,
            feedback_was_helpful: values.feedback_opt_in ? values.feedback_was_helpful : null,
            feedback_visit_outcome: values.feedback_opt_in ? values.feedback_visit_outcome : null,
            feedback_comment: values.feedback_opt_in ? values.feedback_comment : null,
          }
          checkoutMutation.mutate({ visit: checkoutVisit, payload })
        }}
      />
    </div>
  )
}
