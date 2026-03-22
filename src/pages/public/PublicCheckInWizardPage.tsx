import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Spinner } from '../../components/Spinner'
import { AddressPanel } from '../../components/checkin/AddressPanel'
import { CompanyDetailsPanel } from '../../components/checkin/CompanyDetailsPanel'
import { ConsentPanel } from '../../components/checkin/ConsentPanel'
import { IdentityContactPanel } from '../../components/checkin/IdentityContactPanel'
import { ImageUploadPanel } from '../../components/checkin/ImageUploadPanel'
import { PersonalInfoPanel } from '../../components/checkin/PersonalInfoPanel'
import { ReasonPanel } from '../../components/checkin/ReasonPanel'
import { VisitInfoPanel } from '../../components/checkin/VisitInfoPanel'
import { VisitorTypePanel } from '../../components/checkin/VisitorTypePanel'
import { WizardActions } from '../../components/checkin/WizardActions'
import { WizardShell } from '../../components/checkin/WizardShell'
import { panelForField, useCheckInWizard } from '../../hooks/useCheckInWizard'
import { getPublicOrgMetadata, prefillPublicCheckIn, submitPublicCheckIn } from '../../api/publicCheckinApi'
import { checkinWizardSchema, localNationality } from '../../schemas/checkinWizardSchema'
import type { CheckInWizardForm, PublicApiError, PublicPrefillPerson, PublicPrefillRequest } from '../../types/checkin'
import { mapCheckInFormToPayload } from '../../utils/checkinMapper'
import { createIdempotencyKey } from '../../utils/idempotency'
import { getKioskCountries } from '../../utils/kioskConfig'
import { getErrorMessage } from '../../utils/error'
import { normalizeBrandingTheme } from '../../utils/branding'

const fallbackPurposes = ['Meeting', 'Interview', 'Delivery', 'Service', 'Other']

const apiToFormField: Record<string, keyof CheckInWizardForm> = {
  visitor_type: 'citizen_status',
  citizen_status: 'citizen_status',
  visit_context: 'visit_context',
  last_name: 'last_name',
  surname: 'last_name',
  first_name: 'first_name',
  first_names: 'first_name',
  date_of_birth: 'date_of_birth',
  gender: 'gender',
  nationality: 'nationality',
  apartment_number: 'apartment_number',
  home_village_town: 'address_street',
  address_street: 'address_street',
  address_city: 'address_city',
  address_country: 'address_country',
  omang_number: 'omang_number',
  passport_number: 'passport_number',
  passport_country: 'passport_country',
  mobile_phone: 'mobile_phone',
  email: 'email',
  company_name: 'company_name',
  company_location: 'company_location',
  company_phone: 'company_phone',
  company_email: 'company_email',
  department_id: 'department_id',
  purpose: 'purpose',
  purpose_other: 'purpose_other',
  reason_for_visit_text: 'reason_for_visit_text',
  visitor_photo: 'visitor_photo',
  data_protection_consent: 'data_protection_consent',
}

function firstErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') return 'Unable to submit check-in.'
  const err = error as PublicApiError
  if (err.status === 422) return 'Please correct the highlighted fields.'
  if (err.status === 404) return 'Registration point not found or inactive.'
  if (err.status === 409) return 'Unable to create check-in due to a conflict.'
  if (err.status === 429) return 'Too many requests. Please try again shortly.'
  return err.message || 'Unable to submit check-in.'
}

function buildPrefillRequest(values: CheckInWizardForm): PublicPrefillRequest | null {
  if (values.citizen_status === 'citizen') {
    const omang = String(values.omang_number || '').trim()
    if (!omang) return null
    return { citizen_status: 'citizen', omang_number: omang }
  }

  const passport = String(values.passport_number || '').trim()
  if (!passport) return null
  return { citizen_status: 'non_citizen', passport_number: passport }
}

function applyPrefillPerson(form: ReturnType<typeof useForm<CheckInWizardForm>>, person: PublicPrefillPerson) {
  const assignIfPresent = (field: keyof CheckInWizardForm, value: string | null) => {
    const normalized = String(value || '').trim()
    if (!normalized) return
    form.setValue(field, normalized as CheckInWizardForm[keyof CheckInWizardForm], {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  assignIfPresent('first_name', person.first_name)
  assignIfPresent('last_name', person.last_name)
  assignIfPresent('date_of_birth', person.date_of_birth)
  if (person.gender) {
    form.setValue('gender', person.gender, { shouldDirty: true, shouldValidate: true })
  }
  assignIfPresent('nationality', person.nationality)
  assignIfPresent('apartment_number', person.apartment_number)
  assignIfPresent('address_street', person.address_street)
  assignIfPresent('address_city', person.address_city)
  assignIfPresent('address_country', person.address_country)
  assignIfPresent('mobile_phone', person.mobile_phone)
  assignIfPresent('email', person.email)
  assignIfPresent('omang_number', person.omang_number)
  assignIfPresent('passport_number', person.passport_number)
  assignIfPresent('passport_country', person.passport_country)
}

function hasValue(value: string | null) {
  return String(value || '').trim().length > 0
}

function canSkipProfilePanels(person: PublicPrefillPerson) {
  const hasGender = person.gender === 'male' || person.gender === 'female' || person.gender === 'other'
  return (
    hasValue(person.first_name) &&
    hasValue(person.last_name) &&
    hasValue(person.date_of_birth) &&
    hasGender &&
    hasValue(person.nationality) &&
    hasValue(person.apartment_number) &&
    hasValue(person.address_street) &&
    hasValue(person.address_city) &&
    hasValue(person.address_country)
  )
}

export function PublicCheckInWizardPage() {
  const params = useParams()
  const publicKey = params.public_key || params.publicKey || ''
  const [inlineImageError, setInlineImageError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ visit_id: number; visit_code: string; check_in_at: string; status: string } | null>(null)
  const [skipProfilePanels, setSkipProfilePanels] = useState(false)
  const [prefillNotice, setPrefillNotice] = useState<{ tone: 'success' | 'info' | 'error'; message: string } | null>(null)

  const countries = useMemo(() => getKioskCountries(), [])

  const metadataQuery = useQuery({
    queryKey: ['public', 'metadata', publicKey],
    queryFn: () => getPublicOrgMetadata(publicKey),
    enabled: Boolean(publicKey),
    retry: false,
  })

  const form = useForm<CheckInWizardForm>({
    resolver: zodResolver(checkinWizardSchema),
    mode: 'onChange',
    defaultValues: {
      citizen_status: 'citizen',
      visit_context: 'personal',
      visitor_photo: '',
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: 'male',
      nationality: localNationality,
      apartment_number: '',
      address_street: '',
      address_city: '',
      address_country: localNationality,
      omang_number: '',
      passport_number: '',
      passport_country: '',
      mobile_phone: '',
      email: '',
      company_name: '',
      company_location: '',
      company_phone: '',
      company_email: '',
      department_id: 0,
      purpose: '',
      purpose_other: '',
      reason_for_visit_text: '',
      data_protection_consent: false,
    },
  })

  const citizenStatus = form.watch('citizen_status')
  const visitContext = form.watch('visit_context')
  const effectiveDepartments = useMemo(() => {
    const departments = metadataQuery.data?.departments || []
    if (departments.length) return departments
    const fallbackDepartment = metadataQuery.data?.registration_point?.department
    if (!fallbackDepartment || !fallbackDepartment.id || !fallbackDepartment.name) return []
    return [fallbackDepartment]
  }, [metadataQuery.data])

  const hasDepartments = effectiveDepartments.length > 0
  const wizard = useCheckInWizard(form, hasDepartments, skipProfilePanels)

  const purposes = metadataQuery.data?.purposes?.length ? metadataQuery.data.purposes : fallbackPurposes
  const theme = normalizeBrandingTheme(
    {
      name: metadataQuery.data?.org_name,
      company_image: metadataQuery.data?.company_image || metadataQuery.data?.logo_url,
      primary_color: metadataQuery.data?.primary_color,
      accent_color: metadataQuery.data?.accent_color,
      background_color: metadataQuery.data?.background_color,
      text_color: metadataQuery.data?.text_color,
    },
    metadataQuery.data?.org_name || 'Organization',
  )

  useEffect(() => {
    if (citizenStatus === 'citizen') {
      form.setValue('nationality', localNationality, { shouldDirty: true, shouldValidate: true })
    }
  }, [citizenStatus, form])

  useEffect(() => {
    setSkipProfilePanels(false)
    setPrefillNotice(null)
  }, [citizenStatus])

  useEffect(() => {
    if (visitContext !== 'personal') return
    form.setValue('company_name', '', { shouldValidate: false })
    form.setValue('company_location', '', { shouldValidate: false })
    form.setValue('company_phone', '', { shouldValidate: false })
    form.setValue('company_email', '', { shouldValidate: false })
  }, [visitContext, form])

  useEffect(() => {
    if (!metadataQuery.data) return
    const currentDepartmentId = form.getValues('department_id')
    const departmentExists = effectiveDepartments.some((dept) => dept.id === currentDepartmentId)
    if (!departmentExists && effectiveDepartments[0]) {
      form.setValue('department_id', effectiveDepartments[0].id, { shouldValidate: true })
    }
    if (!form.getValues('purpose') && purposes[0]) {
      form.setValue('purpose', purposes[0], { shouldValidate: true })
    }
  }, [metadataQuery.data, effectiveDepartments, purposes, form])

  useEffect(() => {
    if (!metadataQuery.data || hasDepartments) return
    const debugUrl = `${import.meta.env.VITE_API_BASE_URL || 'https://registration-api-pdvk.onrender.com'}/public/p/${publicKey}`
    console.warn('[public-checkin] no departments available', {
      url: debugUrl,
      metadata: metadataQuery.data,
      departments: metadataQuery.data.departments,
      registrationPointDepartment: metadataQuery.data.registration_point?.department,
    })
  }, [hasDepartments, metadataQuery.data, publicKey])

  const submitMutation = useMutation({
    mutationFn: async (values: CheckInWizardForm) => {
      const payload = mapCheckInFormToPayload(values)
      return submitPublicCheckIn(publicKey, payload, createIdempotencyKey('public-checkin'))
    },
    onSuccess: (data) => {
      setSubmitError(null)
      setSuccess(data)
      form.reset()
    },
    onError: (error) => {
      setSubmitError(firstErrorMessage(error))
      const apiError = error as PublicApiError
      if (apiError.status !== 422 || !apiError.fieldErrors) return

      let firstFailPanel: ReturnType<typeof panelForField> = null
      Object.entries(apiError.fieldErrors).forEach(([apiField, message]) => {
        const formField = apiToFormField[apiField] || (apiField as keyof CheckInWizardForm)
        if (!(formField in form.getValues())) return
        form.setError(formField, { type: 'server', message })
        const panel = panelForField(String(formField))
        if (!firstFailPanel && panel) firstFailPanel = panel
      })

      if (firstFailPanel) wizard.goToPanel(firstFailPanel)
    },
  })

  const prefillMutation = useMutation({
    mutationFn: async (payload: PublicPrefillRequest) => {
      if (!publicKey) throw new Error('Invalid registration point')
      return prefillPublicCheckIn(publicKey, payload)
    },
  })

  const handleContinue = async () => {
    if (wizard.currentPanel !== 'identity_contact') {
      void wizard.goNext()
      return
    }

    setPrefillNotice(null)
    setSkipProfilePanels(false)

    const prefillPayload = buildPrefillRequest(form.getValues())
    if (prefillPayload) {
      try {
        const result = await prefillMutation.mutateAsync(prefillPayload)
        if (result.found && result.person) {
          applyPrefillPerson(form, result.person)
          const canSkip = canSkipProfilePanels(result.person)
          setSkipProfilePanels(canSkip)
          setPrefillNotice(
            canSkip
              ? {
                  tone: 'success',
                  message: 'We found your profile and filled your personal details automatically.',
                }
              : {
                  tone: 'info',
                  message: 'We found your profile, but some details are missing. Please confirm and complete them.',
                },
          )
        } else {
          setPrefillNotice({
            tone: 'info',
            message: 'No saved profile found. Please continue and enter your details.',
          })
        }
      } catch (error) {
        setPrefillNotice({
          tone: 'error',
          message: getErrorMessage(error, 'Unable to prefill details right now. Continue and enter details manually.'),
        })
      }
    }

    void wizard.goNext()
  }

  if (metadataQuery.isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Spinner />
      </div>
    )
  }

  if (metadataQuery.isError || !metadataQuery.data) {
    return (
      <div className='mx-auto max-w-xl px-4 py-10'>
        <div className='rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700'>
          Unable to load check-in form for this QR code.
        </div>
      </div>
    )
  }

  if (metadataQuery.data.active === false) {
    return (
      <div className='mx-auto max-w-xl px-4 py-10'>
        <div className='rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800'>
          This registration point is currently inactive.
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className='mx-auto max-w-xl px-4 py-10' style={{ background: theme.background_color }}>
        <div className='rounded-2xl border bg-white p-6' style={{ borderColor: `${theme.primary_color}55`, color: theme.text_color }}>
          <p className='text-xs font-semibold uppercase tracking-[0.3em]' style={{ color: theme.primary_color }}>Check-in successful</p>
          <h2 className='mt-2 text-2xl font-semibold' style={{ color: theme.text_color }}>Welcome in</h2>
          <p className='mt-2 text-sm'>Visit code: {success.visit_code}</p>
          <p className='text-sm'>Visit ID: {success.visit_id}</p>
          <p className='text-sm'>Status: {success.status}</p>
          <p className='text-sm'>Check-in time: {success.check_in_at}</p>
          <Link to={`/p/${publicKey}`} className='mt-4 block'>
            <Button style={{ backgroundColor: theme.primary_color, color: '#FFFFFF' }}>Back to kiosk</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: theme.background_color, minHeight: '100vh' }}>
      <form onSubmit={form.handleSubmit((values) => submitMutation.mutate(values))}>
        <WizardShell
          orgName={metadataQuery.data.org_name}
          logoUrl={theme.company_image}
          theme={theme}
          panelKey={wizard.currentPanel}
        >
        {metadataQuery.data.registration_point && (
          <div className='mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700'>
            <p>
              <span className='font-medium text-slate-900'>Registration Point:</span> {metadataQuery.data.registration_point.name}
            </p>
            {metadataQuery.data.registration_point.department?.name && (
              <p>
                <span className='font-medium text-slate-900'>Department:</span>{' '}
                {metadataQuery.data.registration_point.department.name}
              </p>
            )}
          </div>
        )}

        {submitError && <div className='mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700'>{submitError}</div>}
        {inlineImageError && <div className='mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700'>{inlineImageError}</div>}
        {prefillNotice && (
          <div
            className={`mb-4 rounded-xl p-3 text-sm ${
              prefillNotice.tone === 'success'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                : prefillNotice.tone === 'error'
                  ? 'border border-red-200 bg-red-50 text-red-700'
                  : 'border border-sky-200 bg-sky-50 text-sky-700'
            }`}
          >
            {prefillNotice.message}
          </div>
        )}
        {prefillMutation.isPending && wizard.currentPanel === 'identity_contact' && (
          <div className='mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700'>
            Checking for an existing visitor profile...
          </div>
        )}
        {!hasDepartments && (
          <div className='mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700'>
            This organization has no departments configured. Check-in is temporarily unavailable.
          </div>
        )}

        {wizard.currentPanel === 'who_are_you' && (
          <VisitorTypePanel register={form.register} watch={form.watch} errors={form.formState.errors} />
        )}

        {wizard.currentPanel === 'image_upload' && (
          <ImageUploadPanel
            watch={form.watch}
            setValue={form.setValue}
            errors={form.formState.errors}
            setInlineError={setInlineImageError}
          />
        )}

        {wizard.currentPanel === 'personal_info' && (
          <PersonalInfoPanel
            register={form.register}
            errors={form.formState.errors}
            countries={countries}
            citizenStatus={form.watch('citizen_status')}
          />
        )}

        {wizard.currentPanel === 'address' && <AddressPanel register={form.register} errors={form.formState.errors} />}

        {wizard.currentPanel === 'identity_contact' && (
          <IdentityContactPanel
            register={form.register}
            errors={form.formState.errors}
            citizenStatus={form.watch('citizen_status')}
            countries={countries}
          />
        )}

        {wizard.currentPanel === 'company_details' && (
          <CompanyDetailsPanel register={form.register} errors={form.formState.errors} />
        )}

        {wizard.currentPanel === 'visit_info' && (
          <VisitInfoPanel
            register={form.register}
            watch={form.watch}
            errors={form.formState.errors}
            departments={effectiveDepartments}
            purposes={purposes}
          />
        )}

        {wizard.currentPanel === 'reason' && <ReasonPanel register={form.register} errors={form.formState.errors} />}

        {wizard.currentPanel === 'consent' && <ConsentPanel register={form.register} errors={form.formState.errors} />}
        </WizardShell>

        <WizardActions
          theme={theme}
          disableBack={wizard.isFirst}
          disableContinue={!hasDepartments || prefillMutation.isPending}
          disableSubmit={!hasDepartments}
          showSubmit={wizard.isLast}
          onBack={wizard.goBack}
          onContinue={() => {
            void handleContinue()
          }}
          submitting={submitMutation.isPending}
        />
      </form>
    </div>
  )
}
