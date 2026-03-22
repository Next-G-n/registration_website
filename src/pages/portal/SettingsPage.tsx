import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type OrgBrandingUpdateRequest, type SettingsResponse, type SettingsUpdateRequest } from '../../api/client'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { FormField } from '../../components/FormField'
import { InlineAlert } from '../../components/InlineAlert'
import { Input } from '../../components/Input'
import { PageHeader } from '../../components/PageHeader'
import { Spinner } from '../../components/Spinner'
import { DEFAULT_BRANDING_THEME, normalizeBrandingTheme } from '../../utils/branding'
import { getErrorMessage } from '../../utils/error'

const allowedFields = [
  'visitor_type',
  'surname',
  'first_names',
  'date_of_birth',
  'gender',
  'nationality',
  'home_village_town',
  'id_number',
  'phone',
  'purpose',
  'additional_info',
  'data_protection_consent',
] as const

const settingsSchema = z.object({
  retention_days: z.number().int().min(1),
  allow_raw_id: z.boolean(),
  required_fields_csv: z.string().min(1, 'Required fields cannot be empty'),
})

const brandingSchema = z.object({
  company_image: z.string().trim().optional().nullable(),
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
})

type SettingsFormValues = z.infer<typeof settingsSchema>
type BrandingFormValues = z.infer<typeof brandingSchema>

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })
}

export function SettingsPage() {
  const queryClient = useQueryClient()
  const settingsQuery = useQuery<SettingsResponse>({
    queryKey: ['settings'],
    queryFn: api.getSettings,
  })
  const brandingQuery = useQuery({
    queryKey: ['org-branding'],
    queryFn: api.getOrgBranding,
  })

  const settingsMutation = useMutation({
    mutationFn: (values: SettingsUpdateRequest) => api.updateSettings(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  const brandingMutation = useMutation({
    mutationFn: (values: OrgBrandingUpdateRequest) => api.updateOrgBranding(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-branding'] })
    },
  })

  const {
    register: registerSettings,
    handleSubmit: handleSettingsSubmit,
    reset: resetSettings,
    formState: { errors: settingsErrors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      retention_days: 30,
      allow_raw_id: false,
      required_fields_csv: allowedFields.join(','),
    },
  })

  const {
    register: registerBranding,
    handleSubmit: handleBrandingSubmit,
    setValue: setBrandingValue,
    reset: resetBranding,
    watch: watchBranding,
    formState: { errors: brandingErrors },
  } = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      company_image: '',
      primary_color: DEFAULT_BRANDING_THEME.primary_color,
      accent_color: DEFAULT_BRANDING_THEME.accent_color,
      background_color: DEFAULT_BRANDING_THEME.background_color,
      text_color: DEFAULT_BRANDING_THEME.text_color,
    },
  })

  useEffect(() => {
    if (!settingsQuery.data) return
    resetSettings({
      retention_days: settingsQuery.data.retention_days,
      allow_raw_id: settingsQuery.data.allow_raw_id,
      required_fields_csv: settingsQuery.data.required_fields.join(','),
    })
  }, [settingsQuery.data, resetSettings])

  useEffect(() => {
    if (!brandingQuery.data) return
    const normalizedTheme = normalizeBrandingTheme(brandingQuery.data, brandingQuery.data.name || DEFAULT_BRANDING_THEME.name)
    resetBranding({
      company_image: normalizedTheme.company_image || '',
      primary_color: normalizedTheme.primary_color,
      accent_color: normalizedTheme.accent_color,
      background_color: normalizedTheme.background_color,
      text_color: normalizedTheme.text_color,
    })
  }, [brandingQuery.data, resetBranding])

  const brandingImagePreview = watchBranding('company_image')
  const primaryColorPreview = watchBranding('primary_color')
  const accentColorPreview = watchBranding('accent_color')
  const backgroundColorPreview = watchBranding('background_color')
  const textColorPreview = watchBranding('text_color')
  const backgroundPickerValue = /^#([0-9a-fA-F]{6})$/.test(String(backgroundColorPreview || ''))
    ? String(backgroundColorPreview)
    : DEFAULT_BRANDING_THEME.background_color

  const settingsMutationError = useMemo(() => getErrorMessage(settingsMutation.error), [settingsMutation.error])
  const brandingMutationError = useMemo(() => getErrorMessage(brandingMutation.error), [brandingMutation.error])

  if (settingsQuery.isLoading || brandingQuery.isLoading) {
    return (
      <Card className='flex items-center justify-center'>
        <Spinner />
      </Card>
    )
  }

  return (
    <div className='space-y-6'>
      <PageHeader title='Settings' subtitle='Configure branding, registration requirements, and retention.' />

      <Card>
        <h2 className='text-lg font-semibold text-slate-900'>Branding</h2>
        <form
          className='mt-4 space-y-4'
          onSubmit={handleBrandingSubmit((values) => {
            const normalizedTheme = normalizeBrandingTheme(values, brandingQuery.data?.name || DEFAULT_BRANDING_THEME.name)
            const payload: OrgBrandingUpdateRequest = {
              company_image: values.company_image?.trim() ? values.company_image.trim() : null,
              primary_color: normalizedTheme.primary_color,
              accent_color: normalizedTheme.accent_color,
              background_color: normalizedTheme.background_color,
              text_color: normalizedTheme.text_color,
            }
            brandingMutation.mutate(payload)
          })}
        >
          <FormField label='Organization logo (optional)' error={brandingErrors.company_image}>
            <Input
              type='file'
              accept='image/*'
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) {
                  setBrandingValue('company_image', '', { shouldValidate: true, shouldDirty: true })
                  return
                }
                try {
                  const dataUrl = await readFileAsDataUrl(file)
                  setBrandingValue('company_image', dataUrl, { shouldValidate: true, shouldDirty: true })
                } catch {
                  setBrandingValue('company_image', '', { shouldValidate: true, shouldDirty: true })
                }
              }}
            />
            <input type='hidden' {...registerBranding('company_image')} />
          </FormField>

          {brandingImagePreview ? (
            <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
              <p className='mb-2 text-xs font-medium uppercase tracking-wide text-slate-500'>Logo Preview</p>
              <img src={brandingImagePreview} alt='Organization logo preview' className='h-20 w-20 rounded-xl border border-slate-200 object-cover' />
            </div>
          ) : null}

          <FormField label='Primary color' error={brandingErrors.primary_color}>
            <Input type='color' className='h-11 w-full rounded-xl p-1' {...registerBranding('primary_color')} />
          </FormField>
          <FormField label='Accent color' error={brandingErrors.accent_color}>
            <Input type='color' className='h-11 w-full rounded-xl p-1' {...registerBranding('accent_color')} />
          </FormField>
          <FormField
            label='Background (color or gradient)'
            hint='Examples: #F8FAFC or linear-gradient(90deg, #2A7B9B 0%, #57C785 56%, #EDDD53 100%)'
            error={brandingErrors.background_color}
          >
            <Input
              type='text'
              placeholder='#F8FAFC or linear-gradient(...)'
              {...registerBranding('background_color')}
            />
            <Input
              type='color'
              className='mt-2 h-11 w-full rounded-xl p-1'
              value={backgroundPickerValue}
              onChange={(event) =>
                setBrandingValue('background_color', event.target.value, { shouldValidate: true, shouldDirty: true })
              }
            />
          </FormField>
          <FormField label='Text color' error={brandingErrors.text_color}>
            <Input type='color' className='h-11 w-full rounded-xl p-1' {...registerBranding('text_color')} />
          </FormField>

          <div className='rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600'>
            <p className='text-xs font-medium uppercase tracking-wide text-slate-500'>Current colors</p>
            <div className='mt-2 grid gap-2 sm:grid-cols-2'>
              <span className='inline-flex items-center gap-2'>
                <span className='inline-block h-3 w-3 rounded-full border border-slate-300' style={{ backgroundColor: primaryColorPreview || DEFAULT_BRANDING_THEME.primary_color }} />
                <span>Primary: {primaryColorPreview || DEFAULT_BRANDING_THEME.primary_color}</span>
              </span>
              <span className='inline-flex items-center gap-2'>
                <span className='inline-block h-3 w-3 rounded-full border border-slate-300' style={{ backgroundColor: accentColorPreview || DEFAULT_BRANDING_THEME.accent_color }} />
                <span>Accent: {accentColorPreview || DEFAULT_BRANDING_THEME.accent_color}</span>
              </span>
              <span className='inline-flex items-center gap-2'>
                <span className='inline-block h-3 w-3 rounded-full border border-slate-300' style={{ background: backgroundColorPreview || DEFAULT_BRANDING_THEME.background_color }} />
                <span>Background: {backgroundColorPreview || DEFAULT_BRANDING_THEME.background_color}</span>
              </span>
              <span className='inline-flex items-center gap-2'>
                <span className='inline-block h-3 w-3 rounded-full border border-slate-300' style={{ backgroundColor: textColorPreview || DEFAULT_BRANDING_THEME.text_color }} />
                <span>Text: {textColorPreview || DEFAULT_BRANDING_THEME.text_color}</span>
              </span>
            </div>
          </div>

          {brandingMutation.isError && <InlineAlert message={brandingMutationError} />}
          {brandingMutation.isSuccess && <InlineAlert tone='success' message='Branding updated.' />}

          <div className='flex gap-2'>
            <Button type='submit' disabled={brandingMutation.isPending}>
              {brandingMutation.isPending ? 'Saving branding...' : 'Save branding'}
            </Button>
            <Button
              type='button'
              variant='secondary'
              onClick={() => {
                if (!brandingQuery.data) return
                const normalizedTheme = normalizeBrandingTheme(
                  brandingQuery.data,
                  brandingQuery.data.name || DEFAULT_BRANDING_THEME.name,
                )
                resetBranding({
                  company_image: normalizedTheme.company_image || '',
                  primary_color: normalizedTheme.primary_color,
                  accent_color: normalizedTheme.accent_color,
                  background_color: normalizedTheme.background_color,
                  text_color: normalizedTheme.text_color,
                })
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <form
          className='space-y-4'
          onSubmit={handleSettingsSubmit((values) => {
            const requiredFields = values.required_fields_csv
              .split(',')
              .map((entry: string) => entry.trim())
              .filter((entry: string): entry is (typeof allowedFields)[number] =>
                (allowedFields as readonly string[]).includes(entry),
              )

            const payload: SettingsUpdateRequest = {
              retention_days: values.retention_days,
              allow_raw_id: values.allow_raw_id,
              required_fields: requiredFields,
            }

            settingsMutation.mutate(payload)
          })}
        >
          <FormField label='Retention Days' error={settingsErrors.retention_days}>
            <Input type='number' min={1} {...registerSettings('retention_days', { valueAsNumber: true })} />
          </FormField>

          <label className='flex items-center gap-2 text-sm text-slate-700'>
            <input type='checkbox' {...registerSettings('allow_raw_id')} />
            Allow raw ID visibility
          </label>

          <FormField
            label='Required Fields'
            hint='Comma separated: visitor_type,surname,first_names,date_of_birth,gender,nationality,home_village_town,id_number,phone,purpose,additional_info,data_protection_consent'
            error={settingsErrors.required_fields_csv}
          >
            <Input {...registerSettings('required_fields_csv')} />
          </FormField>

          {settingsMutation.isError && <InlineAlert message={settingsMutationError} />}
          {settingsMutation.isSuccess && <InlineAlert tone='success' message='Settings updated.' />}

          <div className='flex gap-2'>
            <Button type='submit' disabled={settingsMutation.isPending}>
              {settingsMutation.isPending ? 'Saving...' : 'Save settings'}
            </Button>
            <Button
              type='button'
              variant='secondary'
              onClick={() => {
                if (!settingsQuery.data) return
                resetSettings({
                  retention_days: settingsQuery.data.retention_days,
                  allow_raw_id: settingsQuery.data.allow_raw_id,
                  required_fields_csv: settingsQuery.data.required_fields.join(','),
                })
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
