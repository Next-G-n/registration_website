import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api, type OrgInviteAcceptRequest, type OrgInvitePublicOut } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { FormField } from '../../components/FormField'
import { InlineAlert } from '../../components/InlineAlert'
import { Input } from '../../components/Input'
import { Spinner } from '../../components/Spinner'
import { getErrorMessage, getErrorStatus } from '../../utils/error'

const slugRegex = /^[a-z0-9-]+$/
const toOrganizationSlug = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')

const schema = z.object({
  org_name: z
    .string()
    .min(2, 'Organization name is required')
    .refine((value) => slugRegex.test(toOrganizationSlug(value)), 'Organization name must include letters or numbers'),
  password: z.string().min(6, 'Password is required'),
  admin_full_name: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

type InviteState = 'valid' | 'expired' | 'used' | 'not_found'

export function InvitePage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [overrideState, setOverrideState] = useState<InviteState | null>(null)

  const inviteQuery = useQuery<OrgInvitePublicOut>({
    queryKey: ['invite', token],
    queryFn: () => api.getPublicOrgInvite(token || ''),
    enabled: Boolean(token),
    retry: false,
  })

  const inviteStatus = useMemo(() => {
    if (overrideState) return overrideState
    const status = getErrorStatus(inviteQuery.error)
    if (status === 410) return 'expired'
    if (status === 409) return 'used'
    if (status === 404) return 'not_found'
    return 'valid'
  }, [inviteQuery.error, overrideState])

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (!token) throw new Error('Invite token missing')
      const payload: OrgInviteAcceptRequest = {
        org_name: values.org_name,
        organization_slug: toOrganizationSlug(values.org_name),
        password: values.password,
        admin_full_name: values.admin_full_name || undefined,
      }
      return api.acceptPublicOrgInvite(token, payload)
    },
    onSuccess: (data) => {
      login(data.access_token, data.user)
      navigate('/app/dashboard', { replace: true })
    },
    onError: (error) => {
      const status = getErrorStatus(error)
      if (status === 410) setOverrideState('expired')
      if (status === 409) setOverrideState('used')
      if (status === 404) setOverrideState('not_found')
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })
  const orgNameValue = watch('org_name')
  const generatedSlug = useMemo(() => toOrganizationSlug(orgNameValue || ''), [orgNameValue])

  const errorMessage = useMemo(() => getErrorMessage(mutation.error), [mutation.error])
  const inviteLoadError = useMemo(() => {
    if (!inviteQuery.isError) return null
    if (inviteStatus !== 'valid') return null
    return getErrorMessage(inviteQuery.error, 'Unable to load invite.')
  }, [inviteQuery.error, inviteQuery.isError, inviteStatus])

  if (inviteQuery.isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Spinner />
      </div>
    )
  }

  if (inviteStatus === 'expired') {
    return (
      <div className='flex min-h-screen items-center justify-center px-4 py-10'>
        <Card className='max-w-lg text-center'>
          <h1 className='text-2xl font-semibold text-slate-900'>Invite expired</h1>
          <p className='mt-2 text-sm text-slate-600'>This invite is no longer valid. Ask the platform admin for a new invite.</p>
        </Card>
      </div>
    )
  }

  if (inviteStatus === 'used') {
    return (
      <div className='flex min-h-screen items-center justify-center px-4 py-10'>
        <Card className='max-w-lg text-center'>
          <h1 className='text-2xl font-semibold text-slate-900'>Invite already used</h1>
          <p className='mt-2 text-sm text-slate-600'>This invite has already been accepted or revoked.</p>
        </Card>
      </div>
    )
  }

  if (inviteStatus === 'not_found') {
    return (
      <div className='flex min-h-screen items-center justify-center px-4 py-10'>
        <Card className='max-w-lg text-center'>
          <h1 className='text-2xl font-semibold text-slate-900'>Invite not found</h1>
          <p className='mt-2 text-sm text-slate-600'>The invite token is invalid or has been removed.</p>
        </Card>
      </div>
    )
  }

  const invite = inviteQuery.data
  const inviteRecord = (invite || {}) as Record<string, unknown>
  const inviteeEmail =
    (typeof invite?.admin_email === 'string' && invite.admin_email) ||
    (typeof inviteRecord.email === 'string' ? inviteRecord.email : '')
  const orgHint =
    (typeof invite?.org_name === 'string' && invite.org_name) ||
    (typeof inviteRecord.organization_slug === 'string' ? inviteRecord.organization_slug : '') ||
    (typeof invite?.org_slug === 'string' && invite.org_slug) ||
    (typeof inviteRecord.org_name_hint === 'string' ? inviteRecord.org_name_hint : '') ||
    (typeof inviteRecord.org_slug_hint === 'string' ? inviteRecord.org_slug_hint : '')

  return (
    <div className='flex min-h-screen items-center justify-center px-4 py-10'>
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className='glass-panel w-full max-w-xl p-8'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-slate-400'>Organization Invite</p>
          <h1 className='mt-3 text-3xl font-semibold text-slate-900'>Set up your organization</h1>
          <p className='mt-2 text-sm text-slate-600'>Complete the details below to activate your account.</p>
        </div>

        <div className='mt-6 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-700'>
          <p><span className='font-medium text-slate-900'>Invitee:</span> {inviteeEmail || '—'}</p>
          {orgHint && <p className='mt-1 text-slate-500'>Org hint: {orgHint}</p>}
        </div>

        {inviteLoadError && <InlineAlert message={inviteLoadError} />}
        {mutation.isError && <InlineAlert message={errorMessage} />}

        <div className='mt-6 space-y-4'>
          <FormField label='Organization name' error={errors.org_name}>
            <Input placeholder='Acme Industries' {...register('org_name')} />
          </FormField>

          <div className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600'>
            <p className='text-xs font-medium uppercase tracking-wide text-slate-500'>Generated slug</p>
            <p className='mt-1 font-mono text-slate-900'>{generatedSlug || '—'}</p>
          </div>

          <FormField label='Admin full name (optional)' error={errors.admin_full_name}>
            <Input placeholder='Jane Doe' {...register('admin_full_name')} />
          </FormField>

          <FormField label='Password' error={errors.password}>
            <Input type='password' placeholder='Create a strong password' {...register('password')} />
          </FormField>
        </div>

        <Button type='submit' className='mt-6 w-full' disabled={mutation.isPending}>
          {mutation.isPending ? (
            <span className='inline-flex items-center gap-2'>
              <Spinner className='h-4 w-4 border-white/40 border-t-white' />
              Activating...
            </span>
          ) : (
            'Accept invite'
          )}
        </Button>
      </form>
    </div>
  )
}
