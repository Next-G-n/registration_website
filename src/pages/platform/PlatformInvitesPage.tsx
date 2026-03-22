import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  api,
  apiConfig,
  type PlatformOrgInviteCreateRequest,
  type PlatformOrgInviteListResponse,
  type PlatformOrgInviteListStatus,
  type PlatformOrganizationResponse,
} from '../../api/client'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { FormField } from '../../components/FormField'
import { InlineAlert } from '../../components/InlineAlert'
import { Input } from '../../components/Input'
import { PageHeader } from '../../components/PageHeader'
import { Select } from '../../components/Select'
import { Spinner } from '../../components/Spinner'
import { formatDateTime } from '../../utils/format'
import { getErrorMessage } from '../../utils/error'
import { copyToClipboard } from '../../utils/clipboard'
import { DEFAULT_BRANDING_THEME, normalizeBrandingTheme } from '../../utils/branding'

const inviteSchema = z.object({
  admin_email: z.string().email('Valid email is required'),
  org_name: z.string().min(1, 'Organization name is required'),
  expires_in_hours: z.number().int().min(1).max(24 * 30),
})

const organizationSchema = z.object({
  name: z.string().trim().min(1, 'Organization name is required'),
  primary_color: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{6})$/, 'Primary color must be a hex value like #0A84FF.'),
  accent_color: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{6})$/, 'Accent color must be a hex value like #22C55E.'),
  background_color: z
    .string()
    .trim()
    .min(1, 'Background is required. Use a color like #F8FAFC or a CSS gradient.'),
  text_color: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{6})$/, 'Text color must be a hex value like #0F172A.'),
  company_image: z.string().trim().optional().nullable(),
})

type InviteFormValues = PlatformOrgInviteCreateRequest
type OrganizationFormValues = z.infer<typeof organizationSchema>
type Invite = NonNullable<PlatformOrgInviteListResponse>[number]

function extractTokenFromApiUrl(value: string) {
  const match = value.match(/\/public\/org-invites\/([^/?#]+)/)
  return match?.[1] || ''
}

function buildUiInviteUrl(token: string) {
  if (!token || typeof window === 'undefined') return ''
  return `${window.location.origin}/invite/${token}`
}

function buildApiInviteUrl(token: string) {
  if (!token) return ''
  return `${apiConfig.apiBaseUrl.replace(/\/$/, '')}/public/org-invites/${token}`
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })
}

export function PlatformInvitesPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<PlatformOrgInviteListStatus | ''>('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const organizationsQuery = useQuery<PlatformOrganizationResponse[]>({
    queryKey: ['platform', 'organizations'],
    queryFn: () => api.listPlatformOrganizations(),
  })

  const invitesQuery = useQuery<PlatformOrgInviteListResponse>({
    queryKey: ['platform', 'org-invites', status],
    queryFn: () => api.listPlatformOrgInvites(status || undefined),
  })

  const createOrganizationMutation = useMutation({
    mutationFn: (values: OrganizationFormValues) => {
      const normalizedTheme = normalizeBrandingTheme(values, values.name.trim() || 'Organization')
      return api.createPlatformOrganization({
        name: values.name.trim(),
        company_image: values.company_image?.trim() ? values.company_image.trim() : null,
        primary_color: normalizedTheme.primary_color,
        accent_color: normalizedTheme.accent_color,
        background_color: normalizedTheme.background_color,
        text_color: normalizedTheme.text_color,
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform', 'organizations'] }),
  })

  const createInviteMutation = useMutation({
    mutationFn: (values: InviteFormValues) => api.createPlatformOrgInvite(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform', 'org-invites'] }),
  })

  const {
    register: registerOrganization,
    handleSubmit: handleOrganizationSubmit,
    reset: resetOrganizationForm,
    setValue: setOrganizationValue,
    watch: watchOrganization,
    formState: { errors: organizationErrors },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      primary_color: DEFAULT_BRANDING_THEME.primary_color,
      accent_color: DEFAULT_BRANDING_THEME.accent_color,
      background_color: DEFAULT_BRANDING_THEME.background_color,
      text_color: DEFAULT_BRANDING_THEME.text_color,
      company_image: '',
    },
  })

  const {
    register: registerInvite,
    handleSubmit: handleInviteSubmit,
    reset: resetInviteForm,
    formState: { errors: inviteErrors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { admin_email: '', org_name: '', expires_in_hours: 72 },
  })

  const companyImagePreview = watchOrganization('company_image')
  const backgroundColorValue = watchOrganization('background_color')
  const backgroundPickerValue = /^#([0-9a-fA-F]{6})$/.test(String(backgroundColorValue || ''))
    ? String(backgroundColorValue)
    : DEFAULT_BRANDING_THEME.background_color
  const createOrganizationError = useMemo(() => getErrorMessage(createOrganizationMutation.error), [createOrganizationMutation.error])
  const createInviteError = useMemo(() => getErrorMessage(createInviteMutation.error), [createInviteMutation.error])
  const listInviteError = useMemo(() => getErrorMessage(invitesQuery.error), [invitesQuery.error])
  const listOrganizationsError = useMemo(() => getErrorMessage(organizationsQuery.error), [organizationsQuery.error])

  return (
    <div className='space-y-6'>
      <PageHeader title='Platform Invites' subtitle='Create organizations and manage invite-based onboarding.' />

      <Card>
        <h2 className='text-lg font-semibold text-slate-900'>Create organization</h2>
        <form
          onSubmit={handleOrganizationSubmit((values) => {
            createOrganizationMutation.mutate(values, {
              onSuccess: () =>
                resetOrganizationForm({
                  name: '',
                  primary_color: DEFAULT_BRANDING_THEME.primary_color,
                  accent_color: DEFAULT_BRANDING_THEME.accent_color,
                  background_color: DEFAULT_BRANDING_THEME.background_color,
                  text_color: DEFAULT_BRANDING_THEME.text_color,
                  company_image: '',
                }),
            })
          })}
          className='mt-4 grid gap-4 md:grid-cols-3'
        >
          <FormField label='Organization name' error={organizationErrors.name}>
            <Input placeholder='Acme Industries' {...registerOrganization('name')} />
          </FormField>

          <FormField label='Primary color' error={organizationErrors.primary_color}>
            <Input type='color' className='h-11 w-full rounded-xl p-1' {...registerOrganization('primary_color')} />
          </FormField>
          <FormField label='Accent color' error={organizationErrors.accent_color}>
            <Input type='color' className='h-11 w-full rounded-xl p-1' {...registerOrganization('accent_color')} />
          </FormField>
          <FormField
            label='Background (color or gradient)'
            hint='Examples: #F8FAFC or linear-gradient(90deg, #2A7B9B 0%, #57C785 56%, #EDDD53 100%)'
            error={organizationErrors.background_color}
          >
            <Input
              type='text'
              placeholder='#F8FAFC or linear-gradient(...)'
              {...registerOrganization('background_color')}
            />
            <Input
              type='color'
              className='mt-2 h-11 w-full rounded-xl p-1'
              value={backgroundPickerValue}
              onChange={(event) =>
                setOrganizationValue('background_color', event.target.value, { shouldValidate: true, shouldDirty: true })
              }
            />
          </FormField>
          <FormField label='Text color' error={organizationErrors.text_color}>
            <Input type='color' className='h-11 w-full rounded-xl p-1' {...registerOrganization('text_color')} />
          </FormField>

          <FormField label='Company image (optional)'>
            <Input
              type='file'
              accept='image/*'
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) {
                  setOrganizationValue('company_image', '', { shouldValidate: true, shouldDirty: true })
                  return
                }
                try {
                  const dataUrl = await readFileAsDataUrl(file)
                  setOrganizationValue('company_image', dataUrl, { shouldValidate: true, shouldDirty: true })
                } catch {
                  setOrganizationValue('company_image', '', { shouldValidate: true, shouldDirty: true })
                }
              }}
            />
            <input type='hidden' {...registerOrganization('company_image')} />
          </FormField>

          {companyImagePreview ? (
            <div className='md:col-span-3'>
              <img src={companyImagePreview} alt='Company preview' className='h-20 w-20 rounded-xl border border-slate-200 object-cover' />
            </div>
          ) : null}

          <div className='md:col-span-3'>
            <Button type='submit' disabled={createOrganizationMutation.isPending}>
              {createOrganizationMutation.isPending ? 'Creating organization...' : 'Create organization'}
            </Button>
          </div>
        </form>
        {createOrganizationMutation.isError && <InlineAlert message={createOrganizationError} />}
      </Card>

      <Card>
        <h2 className='text-lg font-semibold text-slate-900'>Organizations</h2>
        {organizationsQuery.isLoading ? (
          <div className='mt-4 flex items-center justify-center'>
            <Spinner />
          </div>
        ) : organizationsQuery.isError ? (
          <div className='mt-4'>
            <InlineAlert message={listOrganizationsError} />
          </div>
        ) : organizationsQuery.data?.length ? (
          <div className='mt-4 grid gap-3'>
            {organizationsQuery.data.map((organization) => {
              const record = organization as Record<string, unknown>
              const id = Number(record.id) || 0
              const active = Boolean(record.is_active)
              const theme = normalizeBrandingTheme(
                {
                  name: typeof record.name === 'string' ? record.name : '',
                  company_image: typeof record.company_image === 'string' ? record.company_image : null,
                  primary_color: typeof record.primary_color === 'string' ? record.primary_color : null,
                  accent_color: typeof record.accent_color === 'string' ? record.accent_color : null,
                  background_color: typeof record.background_color === 'string' ? record.background_color : null,
                  text_color: typeof record.text_color === 'string' ? record.text_color : null,
                },
                `Organization ${id}`,
              )
              return (
                <Card key={`${id}-${theme.name}`}>
                  <div className='flex items-center justify-between gap-4 text-sm text-slate-600'>
                    <div>
                      <p className='font-semibold text-slate-900'>{theme.name}</p>
                      <p>ID: {id}</p>
                      <p>Status: {active ? 'Active' : 'Inactive'}</p>
                      <div className='mt-2 flex flex-wrap items-center gap-3'>
                        <span className='inline-flex items-center gap-2'>
                          <span className='inline-block h-3 w-3 rounded-full border border-slate-200' style={{ backgroundColor: theme.primary_color }} />
                          <span>Primary: {theme.primary_color}</span>
                        </span>
                        <span className='inline-flex items-center gap-2'>
                          <span className='inline-block h-3 w-3 rounded-full border border-slate-200' style={{ backgroundColor: theme.accent_color }} />
                          <span>Accent: {theme.accent_color}</span>
                        </span>
                        <span className='inline-flex items-center gap-2'>
                          <span className='inline-block h-3 w-3 rounded-full border border-slate-200' style={{ background: theme.background_color }} />
                          <span>Background: {theme.background_color}</span>
                        </span>
                        <span className='inline-flex items-center gap-2'>
                          <span className='inline-block h-3 w-3 rounded-full border border-slate-200' style={{ backgroundColor: theme.text_color }} />
                          <span>Text: {theme.text_color}</span>
                        </span>
                      </div>
                    </div>
                    {theme.company_image ? (
                      <img src={theme.company_image} alt={`${theme.name} logo`} className='h-14 w-14 rounded-lg border border-slate-200 object-cover' />
                    ) : null}
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className='mt-4'>
            <EmptyState title='No organizations found' description='Create an organization to get started.' />
          </div>
        )}
      </Card>

      <Card>
        <h2 className='text-lg font-semibold text-slate-900'>Create invite</h2>
        <form
          onSubmit={handleInviteSubmit((values) => {
            createInviteMutation.mutate(values, {
              onSuccess: () => resetInviteForm({ admin_email: '', org_name: '', expires_in_hours: 72 }),
            })
          })}
          className='mt-4 grid gap-4 md:grid-cols-3'
        >
          <FormField label='Admin email' error={inviteErrors.admin_email}>
            <Input type='email' placeholder='admin@acme.com' {...registerInvite('admin_email')} />
          </FormField>
          <FormField label='Organization name' error={inviteErrors.org_name}>
            <Input placeholder='Acme Industries' {...registerInvite('org_name')} />
          </FormField>
          <FormField label='Expires in hours' error={inviteErrors.expires_in_hours}>
            <Input type='number' min={1} max={24 * 30} {...registerInvite('expires_in_hours', { valueAsNumber: true })} />
          </FormField>
          <div className='md:col-span-3'>
            <Button type='submit' disabled={createInviteMutation.isPending}>
              {createInviteMutation.isPending ? 'Creating invite...' : 'Create invite'}
            </Button>
          </div>
        </form>
        {createInviteMutation.isError && <InlineAlert message={createInviteError} />}
      </Card>

      <Card>
        <div className='flex items-end gap-3'>
          <FormField label='Status Filter'>
            <Select value={status} onChange={(event) => setStatus((event.target.value || '') as PlatformOrgInviteListStatus | '')}>
              <option value=''>All</option>
              <option value='PENDING'>Pending</option>
              <option value='USED'>Used</option>
              <option value='REVOKED'>Revoked</option>
              <option value='EXPIRED'>Expired</option>
            </Select>
          </FormField>
        </div>
      </Card>

      {invitesQuery.isLoading ? (
        <Card className='flex items-center justify-center'>
          <Spinner />
        </Card>
      ) : invitesQuery.isError ? (
        <Card>
          <InlineAlert message={listInviteError} />
        </Card>
      ) : invitesQuery.data?.length ? (
        <div className='grid gap-3'>
          {invitesQuery.data.map((invite: Invite) => {
            const inviteRecord = invite as Record<string, unknown>
            const inviteId = inviteRecord.id
            const adminEmail = typeof inviteRecord.admin_email === 'string' ? inviteRecord.admin_email : ''
            const orgName = typeof inviteRecord.org_name === 'string' ? inviteRecord.org_name : ''
            const statusValue = typeof inviteRecord.status === 'string' ? inviteRecord.status : ''
            const expiresAt = typeof inviteRecord.expires_at === 'string' ? inviteRecord.expires_at : null
            const usedAt = typeof inviteRecord.used_at === 'string' ? inviteRecord.used_at : null
            const apiInviteUrl = typeof inviteRecord.invite_url === 'string' ? inviteRecord.invite_url : ''
            const tokenFromField = typeof inviteRecord.token === 'string' ? inviteRecord.token : ''
            const tokenFromApiUrl = apiInviteUrl ? extractTokenFromApiUrl(apiInviteUrl) : ''
            const token = tokenFromField || tokenFromApiUrl
            const normalizedApiInviteUrl = buildApiInviteUrl(token)
            const uiInviteUrl = buildUiInviteUrl(token)
            const bestInviteUrl = uiInviteUrl || normalizedApiInviteUrl || apiInviteUrl
            const copyKey = String(inviteId ?? token ?? adminEmail ?? orgName ?? Math.random())

            return (
              <Card key={copyKey}>
                <div className='flex flex-col gap-2 text-sm text-slate-600 md:flex-row md:items-center md:justify-between'>
                  <div>
                    <p className='font-semibold text-slate-900'>{adminEmail || 'Unknown email'}</p>
                    <p>Org: {orgName || 'Unknown org'}</p>
                    <p>Status: {statusValue || 'unknown'}</p>
                    <p className='break-all'>
                      Invite URL (UI):{' '}
                      {uiInviteUrl ? (
                        <a href={uiInviteUrl} target='_blank' rel='noreferrer' className='text-slate-800 underline'>
                          {uiInviteUrl}
                        </a>
                      ) : (
                        'n/a'
                      )}
                    </p>
                    {normalizedApiInviteUrl && <p className='break-all text-xs text-slate-500'>API URL: {normalizedApiInviteUrl}</p>}
                  </div>
                  <div className='text-xs text-slate-500'>
                    <p>Expires: {formatDateTime(expiresAt)}</p>
                    <p>Used: {formatDateTime(usedAt)}</p>
                    {bestInviteUrl && (
                      <button
                        type='button'
                        className='mt-2 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50'
                        onClick={async () => {
                          await copyToClipboard(bestInviteUrl)
                          setCopiedKey(copyKey)
                          setTimeout(() => setCopiedKey(null), 1500)
                        }}
                      >
                        {copiedKey === copyKey ? 'Copied' : 'Copy Invite Link'}
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState title='No invites found' description='Create a new invite to start onboarding.' />
      )}
    </div>
  )
}
