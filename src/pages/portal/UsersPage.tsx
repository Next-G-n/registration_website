import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type UserCreateRequest } from '../../api/client'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { FormField } from '../../components/FormField'
import { InlineAlert } from '../../components/InlineAlert'
import { Input } from '../../components/Input'
import { PageHeader } from '../../components/PageHeader'
import { Select } from '../../components/Select'
import { Spinner } from '../../components/Spinner'
import { getErrorMessage } from '../../utils/error'

const schema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['org_admin', 'staff']),
})

type FormValues = UserCreateRequest
type UsersData = Awaited<ReturnType<typeof api.getUsers>>
type User = NonNullable<UsersData>[number]

export function UsersPage() {
  const queryClient = useQueryClient()
  const usersQuery = useQuery<UsersData>({ queryKey: ['users'], queryFn: api.getUsers })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => api.createUser(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: 'staff' } })

  const errorMessage = useMemo(() => getErrorMessage(mutation.error), [mutation.error])

  return (
    <div className='space-y-6'>
      <PageHeader title='Users' subtitle='Manage portal users and access.' />

      <Card>
        <h2 className='text-lg font-semibold text-slate-900'>Add user</h2>
        <form
          onSubmit={handleSubmit((values) => {
            mutation.mutate(values, {
              onSuccess: () => reset({ full_name: '', email: '', password: '', role: 'staff' }),
            })
          })}
          className='mt-4 grid gap-4 md:grid-cols-2'
        >
          <FormField label='Full name' error={errors.full_name}>
            <Input placeholder='Alex Smith' {...register('full_name')} />
          </FormField>
          <FormField label='Email' error={errors.email}>
            <Input placeholder='alex@company.com' {...register('email')} />
          </FormField>
          <FormField label='Role' error={errors.role}>
            <Select {...register('role')}>
              <option value='org_admin'>Org admin</option>
              <option value='staff'>Staff</option>
            </Select>
          </FormField>
          <FormField label='Temporary password' error={errors.password}>
            <Input type='password' placeholder='Minimum 8 characters' {...register('password')} />
          </FormField>
          <div className='md:col-span-2'>
            <Button type='submit' disabled={mutation.isPending} className='w-full md:w-auto'>
              {mutation.isPending ? 'Creating...' : 'Create user'}
            </Button>
          </div>
        </form>
        {mutation.isError && <InlineAlert message={errorMessage} />}
      </Card>

      {usersQuery.isLoading ? (
        <Card className='flex items-center justify-center'>
          <Spinner />
        </Card>
      ) : usersQuery.data?.length ? (
        <div className='grid gap-3'>
          {usersQuery.data.map((user: User) => (
            <Card key={String(user.id ?? user.email)} className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
              <div>
                <p className='text-sm font-medium text-slate-900'>{user.full_name || 'User'}</p>
                <p className='text-xs text-slate-500'>{user.email}</p>
              </div>
              <div className='text-xs text-slate-500'>
                {user.role && <span>Role: {user.role} </span>}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title='No users yet' description='Create the first portal user above.' />
      )}
    </div>
  )
}
