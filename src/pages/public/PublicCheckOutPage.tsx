import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api, type PublicCheckoutRequest, type PublicCheckoutResponse } from '../../api/client'
import { getPublicOrgMetadata } from '../../api/publicCheckinApi'
import { Button } from '../../components/Button'
import { FormField } from '../../components/FormField'
import { InlineAlert } from '../../components/InlineAlert'
import { Input } from '../../components/Input'
import { KioskBrandHeader } from '../../components/public/KioskBrandHeader'
import { Spinner } from '../../components/Spinner'
import { formatDateTime } from '../../utils/format'
import { getErrorMessage, getErrorStatus } from '../../utils/error'
import { createIdempotencyKey } from '../../utils/idempotency'
import { buildBrandCssVars, normalizeBrandingTheme } from '../../utils/branding'

const schema = z
  .object({
    mode: z.enum(['visit_code', 'id_number']),
    visit_code: z.string().optional(),
    id_number: z.string().optional(),
    feedback_opt_in: z.boolean(),
    feedback_rating: z.number().int().min(1).max(5).nullable(),
    feedback_was_helpful: z.boolean().nullable(),
    feedback_visit_outcome: z.enum(['completed_what_i_came_for', 'partially_completed', 'not_completed']).nullable(),
    feedback_comment: z.string().trim().max(500, 'Feedback comment must be 500 characters or fewer.').nullable(),
  })
  .superRefine((values, context) => {
    if (values.mode === 'visit_code' && !values.visit_code?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['visit_code'],
        message: 'Visit code is required',
      })
    }
    if (values.mode === 'id_number' && !values.id_number?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['id_number'],
        message: 'ID number is required',
      })
    }

    if (values.feedback_opt_in && (values.feedback_rating === null || values.feedback_rating === undefined)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['feedback_rating'],
        message: 'Rating is required when feedback is enabled.',
      })
    }
  })

type FormValues = z.infer<typeof schema>
const ratingValues = [1, 2, 3, 4, 5] as const

function ratingHint(value: number | null) {
  if (value === 1) return 'Poor'
  if (value === 2) return 'Fair'
  if (value === 3) return 'Good'
  if (value === 4) return 'Very good'
  if (value === 5) return 'Excellent'
  return null
}

function resetFeedbackFields(setValue: ReturnType<typeof useForm<FormValues>>['setValue']) {
  setValue('feedback_rating', null, { shouldValidate: true })
  setValue('feedback_was_helpful', null, { shouldValidate: true })
  setValue('feedback_visit_outcome', null, { shouldValidate: true })
  setValue('feedback_comment', null, { shouldValidate: true })
}

function buildFeedbackPayload(values: FormValues): Partial<PublicCheckoutRequest> {
  if (!values.feedback_opt_in) return {}

  return {
    feedback_opt_in: true,
    feedback_rating: values.feedback_rating,
    feedback_was_helpful: values.feedback_was_helpful,
    feedback_visit_outcome: values.feedback_visit_outcome,
    feedback_comment: values.feedback_comment,
  }
}

function checkoutIdCandidates(rawId: string) {
  const normalized = rawId.trim()
  if (!normalized) return []

  const candidates: string[] = []
  const pushUnique = (value: string) => {
    const next = value.trim()
    if (!next || candidates.includes(next)) return
    candidates.push(next)
  }

  // Keep user intent first.
  pushUnique(normalized)

  // Try common formatting variants.
  const compact = normalized.replace(/\s+/g, '')
  pushUnique(compact)
  const noMask = compact.replace(/\*/g, '')
  pushUnique(noMask)

  // Alphanumeric canonical form helps with IDs like A123456789.
  const alphaNumeric = noMask.replace(/[^a-zA-Z0-9]/g, '')
  pushUnique(alphaNumeric)

  // Last-4 fallbacks: alphanumeric and digits-only.
  if (alphaNumeric.length >= 4) {
    pushUnique(alphaNumeric.slice(-4))
  }
  const digitsOnly = alphaNumeric.replace(/\D/g, '')
  if (digitsOnly.length >= 4) {
    pushUnique(digitsOnly.slice(-4))
  }

  return candidates
}

function getPublicSubmitError(error: unknown, fallback: string) {
  const status = getErrorStatus(error)
  if (status === 404) return 'Active visit not found for this registration point.'
  if (status === 409) return 'Checkout conflict. The visit may already be closed.'
  if (status === 429) return 'Too many requests. Please wait and try again.'
  if (status === 422) return getErrorMessage(error, 'Please check your input and try again.')
  return getErrorMessage(error, fallback)
}

export function PublicCheckOutPage() {
  const { publicKey } = useParams()
  const [success, setSuccess] = useState<PublicCheckoutResponse | null>(null)
  const metadataQuery = useQuery({
    queryKey: ['public-org-metadata', publicKey],
    queryFn: () => getPublicOrgMetadata(publicKey || ''),
    enabled: Boolean(publicKey),
    staleTime: 60_000,
  })
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
  const orgName = metadataQuery.data?.org_name || theme.name
  const registrationPointName = metadataQuery.data?.registration_point?.name
  const logoUrl = theme.company_image

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      mode: 'visit_code',
      visit_code: '',
      id_number: '',
      feedback_opt_in: false,
      feedback_rating: null,
      feedback_was_helpful: null,
      feedback_visit_outcome: null,
      feedback_comment: null,
    },
  })

  const mode = watch('mode')
  const feedbackOptIn = watch('feedback_opt_in')
  const feedbackRating = watch('feedback_rating')
  const feedbackHelpful = watch('feedback_was_helpful')
  const feedbackComment = watch('feedback_comment')
  const feedbackCommentLength = String(feedbackComment || '').length

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!publicKey) throw new Error('Invalid registration point')
      const feedbackPayload = buildFeedbackPayload(values)

      if (values.mode === 'visit_code') {
        const payload: PublicCheckoutRequest = { visit_code: values.visit_code?.trim() || '', ...feedbackPayload }
        return api.publicCheckout(publicKey, payload, { idempotencyKey: createIdempotencyKey('checkout') })
      }

      const candidates = checkoutIdCandidates(values.id_number || '')
      let fallbackError: unknown

      for (let index = 0; index < candidates.length; index += 1) {
        const candidate = candidates[index]
        try {
          const payload: PublicCheckoutRequest = { id_number: candidate, ...feedbackPayload }
          return await api.publicCheckout(publicKey, payload, { idempotencyKey: createIdempotencyKey('checkout') })
        } catch (error) {
          fallbackError = error
          const status = getErrorStatus(error)
          const hasMoreCandidates = index < candidates.length - 1
          if (status === 404 && hasMoreCandidates) {
            continue
          }
          throw error
        }
      }

      throw fallbackError || new Error('Unable to complete checkout.')
    },
    onSuccess: (data) => setSuccess(data),
  })

  const submitError = useMemo(
    () => getPublicSubmitError(mutation.error, 'Unable to complete checkout. Please try again.'),
    [mutation.error],
  )

  const canSubmit = Boolean(publicKey) && isValid && !mutation.isPending

  if (success) {
    const hasVisitId = typeof success.visit_id === 'number'
    const hasCheckOutAt = Boolean(success.check_out_at)
    const hasStatus = Boolean(success.status)
    const showMeta = hasVisitId || hasCheckOutAt || hasStatus

    return (
      <div className='min-h-screen px-4 py-10' style={buildBrandCssVars(theme)}>
        <div className='mx-auto w-full max-w-3xl space-y-6'>
          <KioskBrandHeader
            theme={theme}
            orgName={orgName}
            logoUrl={logoUrl}
            title='Confirm your visit'
            subtitle='Complete your check-out.'
            registrationPointName={registrationPointName}
          />

          <div className='kiosk-card mx-auto w-full max-w-xl text-center' style={{ borderColor: `${theme.primary_color}40`, color: theme.text_color }}>
            <p className='text-xs font-semibold uppercase tracking-[0.3em]' style={{ color: theme.primary_color }}>Checkout complete</p>
            <h1 className='mt-4 text-3xl font-semibold' style={{ color: theme.text_color }}>You are checked out</h1>
            <p className='mt-2 text-base' style={{ color: `${theme.text_color}CC` }}>Thank you for visiting.</p>
            {showMeta ? (
              <div className='mt-5 space-y-1 text-left text-sm text-slate-700'>
                {hasVisitId ? <p>{success.visit_id}</p> : null}
                {hasCheckOutAt ? <p>{formatDateTime(success.check_out_at)}</p> : null}
                {hasStatus ? <p>{success.status}</p> : null}
              </div>
            ) : null}
            <Link to={`/p/${publicKey}`} className='mt-6 block'>
              <Button size='lg' className='w-full'>
                Back to kiosk
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen px-3 py-6 sm:px-4 sm:py-10' style={buildBrandCssVars(theme)}>
      <div className='mx-auto w-full max-w-3xl space-y-6'>
        <KioskBrandHeader
          theme={theme}
          orgName={orgName}
          logoUrl={logoUrl}
          title='Confirm your visit'
          subtitle='Choose checkout method below.'
          registrationPointName={registrationPointName}
        />

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className='kiosk-card mx-auto w-full max-w-xl space-y-6'
          style={{ borderColor: `${theme.primary_color}40`, color: theme.text_color }}
        >
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.3em]' style={{ color: `${theme.text_color}99` }}>Visitor Check Out</p>
        </div>

        {mutation.isError && <InlineAlert message={submitError} />}

        <div className='grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2'>
          <button
            type='button'
            className={`rounded-lg px-3 py-2 text-sm font-medium ${mode === 'visit_code' ? 'bg-slate-900 text-white' : 'text-slate-700'}`}
            style={mode === 'visit_code' ? { backgroundColor: theme.primary_color, color: '#FFFFFF' } : { color: theme.text_color }}
            onClick={() => {
              setValue('mode', 'visit_code', { shouldValidate: true })
              setValue('id_number', '', { shouldValidate: true })
            }}
          >
            By Visit Code
          </button>
          <button
            type='button'
            className={`rounded-lg px-3 py-2 text-sm font-medium ${mode === 'id_number' ? 'bg-slate-900 text-white' : 'text-slate-700'}`}
            style={mode === 'id_number' ? { backgroundColor: theme.primary_color, color: '#FFFFFF' } : { color: theme.text_color }}
            onClick={() => {
              setValue('mode', 'id_number', { shouldValidate: true })
              setValue('visit_code', '', { shouldValidate: true })
            }}
          >
            By ID Number
          </button>
        </div>

        <input type='hidden' {...register('mode')} />

        {mode === 'visit_code' ? (
          <FormField label='Visit Code' error={errors.visit_code}>
            <Input placeholder='VIS-xxxx' {...register('visit_code')} className='h-12 text-base' />
          </FormField>
        ) : (
          <FormField label='ID Number' error={errors.id_number}>
            <Input placeholder='Omang / Passport / Last 4 digits' {...register('id_number')} className='h-12 text-base' />
          </FormField>
        )}

        <div className='space-y-4 rounded-xl border border-slate-200 p-4'>
          <div>
            <p className='text-sm font-medium' style={{ color: theme.text_color }}>Service feedback (optional)</p>
            <p className='text-xs' style={{ color: `${theme.text_color}AA` }}>Checkout works with or without feedback.</p>
          </div>

          <div className='grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2'>
            <button
              type='button'
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                feedbackOptIn ? 'text-slate-700 hover:bg-slate-100' : 'bg-slate-900 text-white'
              }`}
              style={feedbackOptIn ? { color: theme.text_color } : { backgroundColor: theme.primary_color, color: '#FFFFFF' }}
              onClick={() => {
                setValue('feedback_opt_in', false, { shouldValidate: true })
                resetFeedbackFields(setValue)
              }}
              disabled={mutation.isPending}
            >
              Skip feedback
            </button>
            <button
              type='button'
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                feedbackOptIn ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
              style={feedbackOptIn ? { backgroundColor: theme.primary_color, color: '#FFFFFF' } : { color: theme.text_color }}
              onClick={() => setValue('feedback_opt_in', true, { shouldValidate: true })}
              disabled={mutation.isPending}
            >
              Give feedback
            </button>
          </div>

          <input type='hidden' {...register('feedback_opt_in')} />

          {feedbackOptIn ? (
            <fieldset className='space-y-4' disabled={mutation.isPending}>
              <div>
                <p className='mb-2 text-sm font-medium' style={{ color: theme.text_color }}>How would you rate the service?</p>
                <div className='flex flex-wrap items-center gap-2'>
                  {ratingValues.map((rating) => (
                    <button
                      key={rating}
                      type='button'
                      className={`h-10 min-w-10 rounded-lg border px-2 text-sm font-semibold ${
                        feedbackRating === rating
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                      style={feedbackRating === rating ? { backgroundColor: theme.primary_color, borderColor: theme.primary_color, color: '#FFFFFF' } : { color: theme.text_color }}
                      onClick={() => setValue('feedback_rating', rating, { shouldValidate: true })}
                      aria-label={`Rate ${rating} out of 5`}
                    >
                      {rating}
                    </button>
                  ))}
                  {feedbackRating !== null ? (
                    <button
                      type='button'
                      className='rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100'
                      onClick={() => setValue('feedback_rating', null, { shouldValidate: true })}
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                {feedbackRating !== null ? <p className='mt-2 text-xs text-slate-500'>{ratingHint(feedbackRating)}</p> : null}
                {errors.feedback_rating?.message ? <p className='mt-2 text-sm text-red-600'>{errors.feedback_rating.message}</p> : null}
              </div>

              <div>
                <p className='mb-2 text-sm font-medium' style={{ color: theme.text_color }}>Were you helped successfully? (optional)</p>
                <div className='flex flex-wrap gap-2'>
                  <button
                    type='button'
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      feedbackHelpful === true ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-700'
                    }`}
                    style={feedbackHelpful === true ? { backgroundColor: theme.primary_color, borderColor: theme.primary_color, color: '#FFFFFF' } : { color: theme.text_color }}
                    onClick={() => setValue('feedback_was_helpful', true, { shouldValidate: true })}
                  >
                    Yes
                  </button>
                  <button
                    type='button'
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      feedbackHelpful === false ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-700'
                    }`}
                    style={feedbackHelpful === false ? { backgroundColor: theme.primary_color, borderColor: theme.primary_color, color: '#FFFFFF' } : { color: theme.text_color }}
                    onClick={() => setValue('feedback_was_helpful', false, { shouldValidate: true })}
                  >
                    No
                  </button>
                  <button
                    type='button'
                    className='rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700'
                    style={{ color: theme.text_color }}
                    onClick={() => setValue('feedback_was_helpful', null, { shouldValidate: true })}
                  >
                    Skip
                  </button>
                </div>
              </div>

              <div>
                <label className='text-sm font-medium text-slate-700'>Was your visit successful? (optional)</label>
                <select
                  className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200'
                  {...register('feedback_visit_outcome', {
                    setValueAs: (value) => (value === '' ? null : value),
                  })}
                >
                  <option value=''>Skip</option>
                  <option value='completed_what_i_came_for'>Completed what I came for</option>
                  <option value='partially_completed'>Partially completed</option>
                  <option value='not_completed'>Not completed</option>
                </select>
              </div>

              <div>
                <label className='text-sm font-medium text-slate-700'>Anything you would like to add? (optional)</label>
                <textarea
                  rows={4}
                  className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200'
                  {...register('feedback_comment', {
                    setValueAs: (value) => {
                      const trimmed = String(value || '').trim()
                      return trimmed ? trimmed : null
                    },
                  })}
                />
                <div className='mt-1 flex items-center justify-between text-xs text-slate-500'>
                  <span>Maximum 500 characters.</span>
                  <span>{feedbackCommentLength}/500</span>
                </div>
                {errors.feedback_comment?.message ? <p className='text-sm text-red-600'>{errors.feedback_comment.message}</p> : null}
              </div>
            </fieldset>
          ) : null}
        </div>

        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <Link to={`/p/${publicKey}`} className='text-sm' style={{ color: `${theme.text_color}B3` }}>
            Back to kiosk
          </Link>
          <Button
            type='submit'
            size='lg'
            disabled={!canSubmit}
            className='w-full md:w-auto'
          >
            {mutation.isPending ? (
              <span className='inline-flex items-center gap-2'>
                <Spinner className='h-4 w-4 border-white/40 border-t-white' />
                Checking out...
              </span>
            ) : (
              'Submit check-out'
            )}
          </Button>
        </div>
        </form>
      </div>
    </div>
  )
}
