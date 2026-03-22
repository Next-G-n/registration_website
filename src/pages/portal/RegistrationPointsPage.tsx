import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QRCodeCanvas } from 'qrcode.react'
import { api, type RegistrationPointCreateRequest } from '../../api/client'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { FormField } from '../../components/FormField'
import { InlineAlert } from '../../components/InlineAlert'
import { Input } from '../../components/Input'
import { PageHeader } from '../../components/PageHeader'
import { Select } from '../../components/Select'
import { Spinner } from '../../components/Spinner'
import { copyToClipboard } from '../../utils/clipboard'
import { getErrorMessage } from '../../utils/error'
import { resolvePublicKioskUrl } from '../../utils/public'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  department_id: z.string().optional(),
})

type FormValues = z.infer<typeof schema>
type DepartmentsData = Awaited<ReturnType<typeof api.getDepartments>>
type RegistrationPointsData = Awaited<ReturnType<typeof api.getRegistrationPoints>>

type RegistrationPoint = NonNullable<RegistrationPointsData>[number]

type Department = NonNullable<DepartmentsData>[number]

export function RegistrationPointsPage() {
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState<string | null>(null)

  const { data: departments } = useQuery<DepartmentsData>({
    queryKey: ['departments'],
    queryFn: api.getDepartments,
  })

  const pointsQuery = useQuery<RegistrationPointsData>({
    queryKey: ['registration-points'],
    queryFn: api.getRegistrationPoints,
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: RegistrationPointCreateRequest = {
        name: values.name,
        department_id: values.department_id ? Number(values.department_id) : null,
      }
      return api.createRegistrationPoint(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registration-points'] })
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const errorMessage = useMemo(() => getErrorMessage(mutation.error), [mutation.error])

  const handleCopy = async (url: string) => {
    await copyToClipboard(url)
    setCopied(url)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className='space-y-6'>
      <PageHeader title='Registration Points' subtitle='Create QR-enabled kiosks for departments.' />

      <Card>
        <h2 className='text-lg font-semibold text-slate-900'>Create registration point</h2>
        <form
          onSubmit={handleSubmit((values) => {
            mutation.mutate(values, {
              onSuccess: () => reset({ name: '', department_id: '' }),
            })
          })}
          className='mt-4 grid gap-4 md:grid-cols-[2fr_2fr_auto]'
        >
          <FormField label='Name' error={errors.name}>
            <Input placeholder='Main lobby kiosk' {...register('name')} />
          </FormField>
          <FormField label='Department (optional)' error={errors.department_id}>
            <Select {...register('department_id')}>
              <option value=''>None</option>
              {departments?.map((dept: Department) => (
                <option key={String(dept.id)} value={String(dept.id)}>
                  {dept.name || `Department ${dept.id}`}
                </option>
              ))}
            </Select>
          </FormField>
          <div className='flex items-end'>
            <Button type='submit' disabled={mutation.isPending} className='w-full'>
              {mutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
        {mutation.isError && <InlineAlert message={errorMessage} />}
      </Card>

      {pointsQuery.isLoading ? (
        <Card className='flex items-center justify-center'>
          <Spinner />
        </Card>
      ) : pointsQuery.data?.length ? (
        <div className='grid gap-4 lg:grid-cols-2'>
          {pointsQuery.data.map((point: RegistrationPoint) => {
            const uiUrl = resolvePublicKioskUrl(point.public_key, point.qr_url)
            const apiUrl = point.qr_url || ''
            const departmentName = departments?.find((dept) => dept.id === point.department_id)?.name
            return (
              <Card key={String(point.id)}>
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                  <div>
                    <h3 className='text-lg font-semibold text-slate-900'>{point.name || 'Registration Point'}</h3>
                    <p className='text-xs text-slate-500'>Department: {departmentName || 'Unassigned'}</p>
                    <p className='mt-2 break-all text-sm text-slate-600'>
                      Kiosk URL (UI):{' '}
                      {uiUrl ? (
                        <a href={uiUrl} target='_blank' rel='noreferrer' className='font-medium text-slate-800 underline'>
                          {uiUrl}
                        </a>
                      ) : (
                        <span className='font-medium'>—</span>
                      )}
                    </p>
                    {apiUrl && apiUrl !== uiUrl && <p className='mt-1 break-all text-xs text-slate-500'>API URL: {apiUrl}</p>}
                    <Button
                      type='button'
                      variant='secondary'
                      className='mt-3'
                      onClick={() => uiUrl && handleCopy(uiUrl)}
                    >
                      {copied === uiUrl ? 'Copied' : 'Copy link'}
                    </Button>
                  </div>
                  <div className='rounded-2xl border border-slate-200 bg-white p-3'>
                    {uiUrl ? <QRCodeCanvas value={uiUrl} size={140} /> : <span className='text-xs text-slate-400'>No QR</span>}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState title='No registration points yet' description='Create your first kiosk above.' />
      )}
    </div>
  )
}
