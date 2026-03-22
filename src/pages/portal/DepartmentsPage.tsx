import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type DepartmentCreateRequest } from '../../api/client'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { FormField } from '../../components/FormField'
import { InlineAlert } from '../../components/InlineAlert'
import { Input } from '../../components/Input'
import { PageHeader } from '../../components/PageHeader'
import { Spinner } from '../../components/Spinner'
import { getErrorMessage } from '../../utils/error'

const schema = z.object({
  name: z.string().min(2, 'Department name is required'),
})

type FormValues = DepartmentCreateRequest
type DepartmentsData = Awaited<ReturnType<typeof api.getDepartments>>
type Department = NonNullable<DepartmentsData>[number]

export function DepartmentsPage() {
  const queryClient = useQueryClient()
  const departmentsQuery = useQuery<DepartmentsData>({ queryKey: ['departments'], queryFn: api.getDepartments })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => api.createDepartment(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const errorMessage = useMemo(() => getErrorMessage(mutation.error), [mutation.error])

  return (
    <div className='space-y-6'>
      <PageHeader title='Departments' subtitle='Organize visitors by department.' />

      <Card>
        <h2 className='text-lg font-semibold text-slate-900'>Create department</h2>
        <form
          onSubmit={handleSubmit((values) => {
            mutation.mutate(values, {
              onSuccess: () => reset({ name: '' }),
            })
          })}
          className='mt-4 grid gap-4 md:grid-cols-[2fr_auto]'
        >
          <FormField label='Name' error={errors.name?.message}>
            <Input placeholder='Finance' {...register('name')} />
          </FormField>
          <div className='flex items-end'>
            <Button type='submit' disabled={mutation.isPending} className='w-full'>
              {mutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
        {mutation.isError && <InlineAlert message={errorMessage} />}
      </Card>

      {departmentsQuery.isLoading ? (
        <Card className='flex items-center justify-center'>
          <Spinner />
        </Card>
      ) : departmentsQuery.data?.length ? (
        <div className='grid gap-3'>
          {departmentsQuery.data.map((dept: Department) => (
            <Card key={String(dept.id)} className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-slate-900'>{dept.name || `Department ${dept.id}`}</p>
                <p className='text-xs text-slate-500'>ID: {dept.id}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title='No departments yet' description='Create your first department above.' />
      )}
    </div>
  )
}
