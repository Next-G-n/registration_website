import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { api, type AuthLoginRequest } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { getDefaultRouteForRole } from '../../auth/access'
import { Button } from '../../components/Button'
import { FormField } from '../../components/FormField'
import { Input } from '../../components/Input'
import { InlineAlert } from '../../components/InlineAlert'
import { Spinner } from '../../components/Spinner'
import { getErrorMessage } from '../../utils/error'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = AuthLoginRequest

export function LoginPage() {
  const { login: saveToken, isAuthenticated, isLoading, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => api.authLogin(values),
    onSuccess: (data) => {
      saveToken(data.access_token, data.user)
      const from = (location.state as { from?: string } | null)?.from
      const redirectTo =
        from && from !== '/login' && !from.startsWith('/p/')
          ? from
          : getDefaultRouteForRole(data.user?.role)
      navigate(redirectTo, { replace: true })
    },
  })

  const errorMessage = useMemo(() => getErrorMessage(mutation.error, 'Login failed.'), [mutation.error])

  useEffect(() => {
    if (user && isAuthenticated && !isLoading) {
      navigate(getDefaultRouteForRole(user?.role), { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate, user])

  return (
    <div className='flex min-h-screen items-center justify-center px-4 py-10'>
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className='glass-panel w-full max-w-md p-8'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-slate-400'>Portal Login</p>
          <h1 className='mt-3 text-3xl font-semibold text-slate-900'>Welcome back</h1>
          <p className='mt-2 text-sm text-slate-600'>Sign in to manage registrations.</p>
        </div>

        {mutation.isError && <InlineAlert message={errorMessage} />}

        <div className='mt-6 space-y-4'>
          <FormField label='Email' error={errors.email}>
            <Input type='email' placeholder='you@company.com' {...register('email')} />
          </FormField>

          <FormField label='Password' error={errors.password}>
            <Input type='password' placeholder='••••••••' {...register('password')} />
          </FormField>
        </div>

        <Button type='submit' className='mt-6 w-full' disabled={mutation.isPending}>
          {mutation.isPending ? (
            <span className='inline-flex items-center gap-2'>
              <Spinner className='h-4 w-4 border-white/40 border-t-white' />
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>
    </div>
  )
}
