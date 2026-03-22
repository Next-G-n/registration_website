import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QRCodeCanvas } from 'qrcode.react'
import { api, type RegistrationPointCreateRequest } from '../../api/client'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Drawer } from '../../components/Drawer'
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
  department_id: z.string().min(1, 'Please select a department'),
})

const deptSchema = z.object({
  name: z.string().min(2, 'Department name is required'),
})

type FormValues = z.infer<typeof schema>
type DeptFormValues = z.infer<typeof deptSchema>
type DepartmentsData = Awaited<ReturnType<typeof api.getDepartments>>
type RegistrationPointsData = Awaited<ReturnType<typeof api.getRegistrationPoints>>
type RegistrationPoint = NonNullable<RegistrationPointsData>[number]
type Department = NonNullable<DepartmentsData>[number]

export function RegistrationPointsPage() {
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState<string | null>(null)
  const [showCreateDept, setShowCreateDept] = useState(false)
  const deptDrawerFormId = 'create-department-form'

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
        department_id: Number(values.department_id),
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
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const selectedDepartmentId = watch('department_id')

  // Department creation form (used inside the drawer)
  const {
    register: registerDept,
    handleSubmit: handleSubmitDept,
    reset: resetDept,
    formState: { errors: deptErrors },
  } = useForm<DeptFormValues>({ resolver: zodResolver(deptSchema) })

  const deptMutation = useMutation({
    mutationFn: (values: DeptFormValues) => api.createDepartment(values),
    onSuccess: (newDept) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      setValue('department_id', String(newDept.id))
      setShowCreateDept(false)
      resetDept()
    },
  })

  const errorMessage = useMemo(() => getErrorMessage(mutation.error), [mutation.error])
  const deptErrorMessage = useMemo(() => getErrorMessage(deptMutation.error), [deptMutation.error])

  const closeDeptDrawer = () => {
    setShowCreateDept(false)
    resetDept()
    deptMutation.reset()
  }

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
          onSubmit={handleSubmit(
            (values) => {
              mutation.mutate(values, {
                onSuccess: () => reset({ name: '', department_id: undefined }),
              })
            },
            (errors) => {
              if (errors.department_id) setShowCreateDept(true)
            },
          )}
          className='mt-4 grid gap-4 md:grid-cols-[2fr_2fr_auto]'
        >
          <FormField label='Name' error={errors.name}>
            <Input placeholder='Main lobby kiosk' {...register('name')} />
          </FormField>
          <div>
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
            {selectedDepartmentId === '' || selectedDepartmentId === undefined ? (
              <button
                type='button'
                className='mt-1.5 text-xs font-medium hover:underline'
                style={{ color: 'var(--brand-primary, #0A84FF)' }}
                onClick={() => setShowCreateDept(true)}
              >
                + Create new department
              </button>
            ) : null}
          </div>
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

      <Drawer
        open={showCreateDept}
        onClose={closeDeptDrawer}
        title='Create Department'
        description='Create a department here and it will be selected immediately for this kiosk.'
        panelClassName='sm:max-w-xl'
        footer={
          <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <Button type='button' variant='secondary' onClick={closeDeptDrawer}>
              Cancel
            </Button>
            <Button type='submit' form={deptDrawerFormId} disabled={deptMutation.isPending}>
              {deptMutation.isPending ? 'Creating...' : 'Create department'}
            </Button>
          </div>
        }
      >
        <form
          id={deptDrawerFormId}
          onSubmit={handleSubmitDept((values) => deptMutation.mutate(values))}
          className='flex flex-col gap-4'
        >
          <FormField label='Department name' error={deptErrors.name}>
            <Input placeholder='Finance' {...registerDept('name')} autoFocus />
          </FormField>
          {deptMutation.isError && <InlineAlert message={deptErrorMessage} />}
        </form>
      </Drawer>
    </div>
  )
}
