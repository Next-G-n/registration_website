import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api, type PublicCheckInRequest, type PublicCheckInResponse } from '../../api/client'
import { Button } from '../../components/Button'
import { FormField } from '../../components/FormField'
import { ImageFileField } from '../../components/ImageFileField'
import { InlineAlert } from '../../components/InlineAlert'
import { Input } from '../../components/Input'
import { Select } from '../../components/Select'
import { Spinner } from '../../components/Spinner'
import { Textarea } from '../../components/Textarea'
import { formatDateTime } from '../../utils/format'
import { getErrorMessage, getErrorStatus } from '../../utils/error'
import { createIdempotencyKey } from '../../utils/idempotency'
import { getKioskCountries, getKioskDepartments, getKioskPurposes } from '../../utils/kioskConfig'
import { extractTextFromImage } from '../../utils/ocr'

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

const baseSchema = z.object({
  surname: z.string().min(1, 'Surname is required'),
  first_names: z.string().min(1, 'First names are required'),
  date_of_birth: z.string().regex(dateRegex, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  nationality: z.string().min(1, 'Nationality is required'),
  home_village_town: z.string().min(1, 'Home village/town is required'),
  mobile_phone: z.string().min(1, 'Mobile phone is required'),
  email: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, 'Enter a valid email'),
  department_id: z.string().min(1, 'Department is required'),
  purpose: z.string().min(1, 'Purpose is required'),
  additional_info: z.string().optional(),
  host_name: z.string().optional(),
  visitor_photo: z.string().min(1, 'Visitor photo is required'),
  data_protection_consent: z.boolean().refine((value) => value === true, 'Consent is required'),
})

const citizenSchema = baseSchema.extend({
  visitor_type: z.literal('citizen'),
  omang_number: z.string().min(1, 'Omang number is required'),
  passport_number: z.string().optional(),
  passport_country: z.string().optional(),
})

const nonCitizenSchema = baseSchema.extend({
  visitor_type: z.literal('non_citizen'),
  omang_number: z.string().optional(),
  passport_number: z.string().min(1, 'Passport number is required'),
  passport_country: z.string().min(1, 'Passport country is required'),
})

const schema = z.discriminatedUnion('visitor_type', [citizenSchema, nonCitizenSchema])

type FormValues = z.infer<typeof schema>

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read photo'))
    reader.readAsDataURL(file)
  })
}

function getPublicSubmitError(error: unknown, fallback: string) {
  const status = getErrorStatus(error)
  if (status === 404) return 'Registration point not found or inactive.'
  if (status === 409) return 'Request could not be completed due to a conflict.'
  if (status === 429) return 'Too many requests. Please wait and try again.'
  if (status === 422) return getErrorMessage(error, 'Please check the highlighted fields and try again.')
  return getErrorMessage(error, fallback)
}

function detectDocumentNumber(text: string, visitorType: 'citizen' | 'non_citizen') {
  const normalized = text.toUpperCase().replace(/\s+/g, ' ')
  const citizenMatches = normalized.match(/\b\d{9}\b/g) || []
  if (visitorType === 'citizen' && citizenMatches.length) return citizenMatches[0]

  const alnumMatches = normalized.match(/\b[A-Z0-9]{6,20}\b/g) || []
  if (!alnumMatches.length) return ''
  return [...alnumMatches].sort((a, b) => b.length - a.length)[0]
}

export function PublicCheckInPage() {
  const { publicKey } = useParams()
  const [success, setSuccess] = useState<PublicCheckInResponse | null>(null)
  const [frontDocFile, setFrontDocFile] = useState<File | null>(null)
  const [backDocFile, setBackDocFile] = useState<File | null>(null)
  const [passportDocFile, setPassportDocFile] = useState<File | null>(null)
  const [visitorPhotoFile, setVisitorPhotoFile] = useState<File | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanTextPreview, setScanTextPreview] = useState('')

  const fallbackDepartmentOptions = useMemo(() => getKioskDepartments(), [])
  const purposeOptions = useMemo(() => getKioskPurposes(), [])
  const countryOptions = useMemo(() => getKioskCountries(), [])
  const departmentsQuery = useQuery({
    queryKey: ['kiosk', 'departments'],
    queryFn: api.getDepartments,
    retry: false,
  })

  const registeredDepartmentOptions = useMemo(() => {
    const departments = departmentsQuery.data || []
    return departments
      .map((department) => ({
        id: Number(department.id),
        label: String(department.name || `Department ${department.id}`),
      }))
      .filter((item) => Number.isInteger(item.id) && item.id > 0)
  }, [departmentsQuery.data])

  const departmentOptions = registeredDepartmentOptions.length ? registeredDepartmentOptions : fallbackDepartmentOptions

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      visitor_type: 'citizen',
      nationality: 'Botswana',
      gender: 'male',
      department_id: fallbackDepartmentOptions[0] ? String(fallbackDepartmentOptions[0].id) : '',
      purpose: purposeOptions[0] || '',
      email: '',
      omang_number: '',
      passport_number: '',
      passport_country: '',
      additional_info: '',
      host_name: '',
      visitor_photo: '',
      data_protection_consent: false,
    },
  })

  const visitorType = watch('visitor_type')
  const visitorPhoto = watch('visitor_photo')
  const consentChecked = watch('data_protection_consent')

  useEffect(() => {
    const currentDepartmentId = getValues('department_id')
    const hasCurrent = departmentOptions.some((option) => String(option.id) === String(currentDepartmentId))
    if (!hasCurrent && departmentOptions[0]) {
      setValue('department_id', String(departmentOptions[0].id), { shouldValidate: true })
    }
  }, [departmentOptions, getValues, setValue])

  const scanMutation = useMutation({
    mutationFn: async () => {
      setScanError(null)
      setScanTextPreview('')

      if (visitorType === 'citizen') {
        if (!frontDocFile || !backDocFile) {
          throw new Error('Upload both Omang front and back images first.')
        }
        const [frontText, backText] = await Promise.all([extractTextFromImage(frontDocFile), extractTextFromImage(backDocFile)])
        return `${frontText}\n${backText}`.trim()
      }

      if (!passportDocFile) {
        throw new Error('Upload passport image first.')
      }
      return (await extractTextFromImage(passportDocFile)).trim()
    },
    onSuccess: (text) => {
      setScanTextPreview(text.slice(0, 500))
      const number = detectDocumentNumber(text, visitorType)
      if (!number) {
        setScanError('Could not detect a document number. Enter it manually.')
        return
      }

      if (visitorType === 'citizen') {
        setValue('omang_number', number, { shouldValidate: true, shouldDirty: true })
      } else {
        setValue('passport_number', number, { shouldValidate: true, shouldDirty: true })
      }
    },
    onError: (error) => {
      setScanError(getErrorMessage(error, 'Failed to extract text from document image.'))
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!publicKey) throw new Error('Invalid registration point')
      const payload: PublicCheckInRequest = {
        visitor_type: values.visitor_type,
        surname: values.surname.trim(),
        first_names: values.first_names.trim(),
        date_of_birth: values.date_of_birth,
        gender: values.gender,
        nationality: values.nationality.trim(),
        home_village_town: values.home_village_town.trim(),
        omang_number: values.visitor_type === 'citizen' ? values.omang_number.trim() : null,
        passport_number: values.visitor_type === 'non_citizen' ? values.passport_number.trim() : null,
        passport_country: values.visitor_type === 'non_citizen' ? values.passport_country.trim() : null,
        mobile_phone: values.mobile_phone.trim(),
        email: values.email?.trim() ? values.email.trim() : null,
        department_id: Number(values.department_id),
        purpose: values.purpose.trim(),
        additional_info: values.additional_info?.trim() ? values.additional_info.trim() : null,
        host_name: values.host_name?.trim() ? values.host_name.trim() : null,
        visitor_photo: values.visitor_photo,
        data_protection_consent: true,
      }
      return api.publicCheckIn(publicKey, payload, { idempotencyKey: createIdempotencyKey('checkin') })
    },
    onSuccess: (data) => setSuccess(data),
  })

  const submitError = useMemo(
    () => getPublicSubmitError(mutation.error, 'Unable to complete check-in. Please try again.'),
    [mutation.error],
  )

  const canSubmit = Boolean(publicKey) && consentChecked && isValid && !mutation.isPending
  const departmentHint = registeredDepartmentOptions.length
    ? 'Select from registered departments.'
    : 'Showing configured kiosk departments. Registered list requires backend public metadata support.'

  if (success) {
    return (
      <div className='flex min-h-screen items-center justify-center px-4 py-10'>
        <div className='kiosk-card w-full max-w-xl text-center'>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500'>Check-in complete</p>
          <h1 className='mt-4 text-4xl font-semibold text-slate-900'>Visit confirmed</h1>
          <div className='mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4'>
            <p className='text-xs uppercase tracking-[0.2em] text-emerald-700'>Visit code</p>
            <p className='mt-2 text-3xl font-semibold text-emerald-900'>{success.visit_code}</p>
          </div>
          <div className='mt-4 space-y-1 text-left text-sm text-slate-700'>
            <p>
              <span className='font-semibold text-slate-900'>Visit ID:</span> {success.visit_id}
            </p>
            <p>
              <span className='font-semibold text-slate-900'>Check-in at:</span> {formatDateTime(success.check_in_at)}
            </p>
            <p>
              <span className='font-semibold text-slate-900'>Status:</span> {success.status}
            </p>
          </div>
          <Link to={`/p/${publicKey}/checkout`} className='mt-6 block'>
            <Button size='lg' className='w-full'>
              Proceed to Check Out
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='flex min-h-screen items-center justify-center px-3 py-6 sm:px-4 sm:py-10'>
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className='kiosk-card w-full max-w-3xl space-y-6'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-slate-400'>Visitor Check In</p>
          <h1 className='mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl'>Visitor details</h1>
          <p className='mt-2 text-sm text-slate-600 sm:text-base'>Complete all required details to check in.</p>
        </div>

        {mutation.isError && <InlineAlert message={submitError} />}

        <div className='grid gap-4 md:grid-cols-2'>
          <FormField label='Visitor Type' error={errors.visitor_type}>
            <Select {...register('visitor_type')} className='h-12 text-base'>
              <option value='citizen'>citizen</option>
              <option value='non_citizen'>non_citizen</option>
            </Select>
          </FormField>

          <FormField label='Department' hint={departmentHint} error={errors.department_id}>
            <Select {...register('department_id')} className='h-12 text-base'>
              <option value=''>Select department</option>
              {departmentOptions.map((option) => (
                <option key={option.id} value={String(option.id)}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label='Surname' error={errors.surname}>
            <Input {...register('surname')} className='h-12 text-base' />
          </FormField>

          <FormField label='First Names' error={errors.first_names}>
            <Input {...register('first_names')} className='h-12 text-base' />
          </FormField>

          <FormField label='Date of Birth' error={errors.date_of_birth}>
            <Input type='date' {...register('date_of_birth')} className='h-12 text-base' />
          </FormField>

          <FormField label='Gender' error={errors.gender}>
            <Select {...register('gender')} className='h-12 text-base'>
              <option value='male'>male</option>
              <option value='female'>female</option>
              <option value='other'>other</option>
            </Select>
          </FormField>

          <FormField label='Nationality' error={errors.nationality}>
            <Select {...register('nationality')} className='h-12 text-base'>
              {countryOptions.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label='Home Village / Town' error={errors.home_village_town}>
            <Input {...register('home_village_town')} className='h-12 text-base' />
          </FormField>

          <div className='md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4'>
            <p className='text-sm font-semibold text-slate-900'>Document Capture</p>
            <p className='mt-1 text-xs text-slate-500'>
              {visitorType === 'citizen'
                ? 'For citizens, upload Omang front and back, then extract number.'
                : 'For non-citizens, upload passport image, then extract number.'}
            </p>
            <div className='mt-3 grid gap-3 md:grid-cols-2'>
              {visitorType === 'citizen' ? (
                <>
                  <ImageFileField
                    label='Omang Front Image'
                    hint='Take a clear photo of the front side.'
                    file={frontDocFile}
                    capture='environment'
                    onChange={setFrontDocFile}
                    onClear={() => setFrontDocFile(null)}
                  />
                  <ImageFileField
                    label='Omang Back Image'
                    hint='Take a clear photo of the back side.'
                    file={backDocFile}
                    capture='environment'
                    onChange={setBackDocFile}
                    onClear={() => setBackDocFile(null)}
                  />
                </>
              ) : (
                <ImageFileField
                  label='Passport Image'
                  hint='Capture the passport photo page.'
                  file={passportDocFile}
                  capture='environment'
                  onChange={setPassportDocFile}
                  onClear={() => setPassportDocFile(null)}
                />
              )}
            </div>
            <div className='mt-3'>
              <Button type='button' variant='secondary' onClick={() => scanMutation.mutate()} disabled={scanMutation.isPending}>
                {scanMutation.isPending ? 'Extracting...' : 'Extract Number from Document'}
              </Button>
            </div>
            {scanError && <div className='mt-3'><InlineAlert message={scanError} /></div>}
            {scanTextPreview && (
              <div className='mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600'>
                <p className='font-semibold text-slate-700'>Extracted text preview</p>
                <p className='mt-1 whitespace-pre-wrap break-words'>{scanTextPreview}</p>
              </div>
            )}
          </div>

          <div className='md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4'>
            <p className='mb-3 text-sm font-semibold text-slate-900'>Identification</p>
            <div className='grid gap-4 md:grid-cols-2'>
              {visitorType === 'citizen' ? (
                <FormField label='Omang Number' error={errors.omang_number}>
                  <Input {...register('omang_number')} className='h-12 text-base' />
                </FormField>
              ) : (
                <>
                  <FormField label='Passport Number' error={errors.passport_number}>
                    <Input {...register('passport_number')} className='h-12 text-base' />
                  </FormField>
                  <FormField label='Passport Country' error={errors.passport_country}>
                    <Input list='country-options' {...register('passport_country')} className='h-12 text-base' />
                  </FormField>
                </>
              )}
            </div>
          </div>

          <div className='md:col-span-2 rounded-xl border border-slate-200 p-4'>
            <p className='mb-3 text-sm font-semibold text-slate-900'>Contact details</p>
            <div className='grid gap-4 md:grid-cols-2'>
              <FormField label='Mobile Phone' error={errors.mobile_phone}>
                <Input {...register('mobile_phone')} className='h-12 text-base' />
              </FormField>

              <FormField label='Email (Optional)' error={errors.email}>
                <Input type='email' {...register('email')} className='h-12 text-base' />
              </FormField>
            </div>
          </div>

          <FormField label='Purpose' error={errors.purpose}>
            <Select {...register('purpose')} className='h-12 text-base'>
              <option value=''>Select purpose</option>
              {purposeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label='Host Name (Optional)' error={errors.host_name}>
            <Input {...register('host_name')} className='h-12 text-base' />
          </FormField>
        </div>

        <FormField label='Additional Information (Optional)' error={errors.additional_info}>
          <Textarea rows={3} {...register('additional_info')} />
        </FormField>

        <FormField label='Visitor Photo' error={errors.visitor_photo}>
          <ImageFileField
            label='Visitor Photo'
            hint='Capture a portrait photo of the visitor.'
            file={visitorPhotoFile}
            previewUrl={visitorPhoto || null}
            error={typeof errors.visitor_photo?.message === 'string' ? errors.visitor_photo.message : null}
            capture='environment'
            onChange={async (file) => {
              setVisitorPhotoFile(file)
              if (!file) {
                setValue('visitor_photo', '', { shouldValidate: true })
                return
              }
              try {
                const dataUrl = await readFileAsDataUrl(file)
                setValue('visitor_photo', dataUrl, { shouldValidate: true, shouldDirty: true })
              } catch {
                setValue('visitor_photo', '', { shouldValidate: true })
              }
            }}
            onClear={() => {
              setVisitorPhotoFile(null)
              setValue('visitor_photo', '', { shouldValidate: true, shouldDirty: true })
            }}
          />
        </FormField>

        <label className='flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700'>
          <input type='checkbox' {...register('data_protection_consent')} className='mt-1 h-4 w-4' />
          <span>
            I consent to data processing for visitor registration.
            {errors.data_protection_consent && (
              <span className='mt-1 block text-xs text-red-600'>{String(errors.data_protection_consent.message)}</span>
            )}
          </span>
        </label>

        <datalist id='country-options'>
          {countryOptions.map((country) => (
            <option key={country} value={country} />
          ))}
        </datalist>

        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <Link to={`/p/${publicKey}`} className='text-sm text-slate-500'>
            Back to kiosk
          </Link>
          <Button type='submit' size='lg' disabled={!canSubmit} className='w-full md:w-auto'>
            {mutation.isPending ? (
              <span className='inline-flex items-center gap-2'>
                <Spinner className='h-4 w-4 border-white/40 border-t-white' />
                Checking in...
              </span>
            ) : (
              'Submit check-in'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
