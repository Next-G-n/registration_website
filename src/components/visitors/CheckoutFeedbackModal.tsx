import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Drawer } from '../Drawer'
import { Button } from '../Button'
import { FormField } from '../FormField'
import { Select } from '../Select'
import { Textarea } from '../Textarea'
import { checkoutFeedbackSchema, type CheckoutFeedbackForm } from '../../schemas/checkinWizardSchema'
import type { VisitorHistoryRow } from '../../types/checkin'
import { cn } from '../../utils/cn'

function resetToNoFeedback(setValue: ReturnType<typeof useForm<CheckoutFeedbackForm>>['setValue']) {
  setValue('feedback_opt_in', false, { shouldValidate: true })
  setValue('feedback_rating', null, { shouldValidate: true })
  setValue('feedback_was_helpful', null, { shouldValidate: true })
  setValue('feedback_visit_outcome', null, { shouldValidate: true })
  setValue('feedback_comment', null, { shouldValidate: true })
}

export function CheckoutFeedbackModal({
  visit,
  open,
  submitting,
  onClose,
  onSubmit,
}: {
  visit: VisitorHistoryRow | null
  open: boolean
  submitting: boolean
  onClose: () => void
  onSubmit: (value: CheckoutFeedbackForm) => void
}) {
  const formId = useId()
  const {
    register,
    watch,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<CheckoutFeedbackForm>({
    resolver: zodResolver(checkoutFeedbackSchema),
    mode: 'onChange',
    defaultValues: {
      feedback_opt_in: false,
      feedback_rating: null,
      feedback_was_helpful: null,
      feedback_visit_outcome: null,
      feedback_comment: null,
    },
  })

  const feedbackOptIn = watch('feedback_opt_in')
  const feedbackRating = watch('feedback_rating')
  const feedbackHelpful = watch('feedback_was_helpful')
  const closeAndReset = () => {
    onClose()
    reset()
  }

  const submitNow = () => {
    void handleSubmit(onSubmit)()
  }

  return (
    <Drawer
      open={open}
      onClose={closeAndReset}
      title='Visit feedback'
      description='Capture a quick service rating before checkout, or skip and finish immediately.'
      panelClassName='sm:max-w-xl'
      footer={
        <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
          <Button
            type='button'
            variant='secondary'
            onClick={closeAndReset}
            disabled={submitting}
          >
            Cancel
          </Button>
          {feedbackOptIn ? (
            <>
              <Button
                type='button'
                variant='ghost'
                onClick={() => {
                  resetToNoFeedback(setValue)
                  submitNow()
                }}
                disabled={submitting}
              >
                Skip feedback
              </Button>
              <Button type='submit' form={formId} disabled={submitting || !isValid}>
                {submitting ? 'Saving...' : 'Submit feedback and check out'}
              </Button>
            </>
          ) : (
            <Button
              type='button'
              onClick={() => {
                resetToNoFeedback(setValue)
                submitNow()
              }}
              disabled={submitting}
            >
              {submitting ? 'Checking out...' : 'Check out now'}
            </Button>
          )}
        </div>
      }
    >
      {!visit ? null : (
        <form id={formId} className='space-y-6' onSubmit={handleSubmit(onSubmit)}>
          <div className='rounded-3xl border border-[color:var(--brand-surface-edge)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-4 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.28)]'>
            <p className='text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-text-muted)]'>Visitor</p>
            <p className='mt-2 text-base font-semibold text-[color:var(--brand-text)]'>{visit.full_name}</p>
            <p className='mt-1 text-sm text-[color:var(--brand-text-soft)]'>Do you have a minute to give feedback before checkout?</p>
          </div>

          <div className='space-y-3 rounded-3xl border border-[color:var(--brand-surface-edge)] bg-[color:var(--brand-secondary-surface)]/60 p-3'>
            <p className='text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-text-muted)]'>Feedback choice</p>
            <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
            <button
              type='button'
                className={cn(
                  'rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition',
                  feedbackOptIn
                    ? 'border-[color:var(--brand-secondary-border)] bg-white/85 text-[color:var(--brand-text-soft)] hover:bg-white'
                    : 'border-[color:var(--brand-primary-edge)] bg-[color:var(--brand-primary-strong)] text-[color:var(--brand-primary-text)] shadow-[0_16px_30px_-24px_rgba(15,23,42,0.35)]',
                )}
              onClick={() => {
                resetToNoFeedback(setValue)
                submitNow()
              }}
              disabled={submitting}
            >
                <span className='block'>No, check out now</span>
                <span className='mt-1 block text-xs font-medium opacity-80'>Finish immediately without asking more questions.</span>
            </button>
            <button
              type='button'
                className={cn(
                  'rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition',
                  feedbackOptIn
                    ? 'border-[color:var(--brand-primary-edge)] bg-[color:var(--brand-primary-strong)] text-[color:var(--brand-primary-text)] shadow-[0_16px_30px_-24px_rgba(15,23,42,0.35)]'
                    : 'border-[color:var(--brand-secondary-border)] bg-white/85 text-[color:var(--brand-text-soft)] hover:bg-white',
                )}
              onClick={() => setValue('feedback_opt_in', true, { shouldValidate: true })}
              disabled={submitting}
            >
                <span className='block'>Yes, collect feedback</span>
                <span className='mt-1 block text-xs font-medium opacity-80'>Ask a short rating before closing the visit.</span>
            </button>
            </div>
          </div>

          <input type='hidden' {...register('feedback_opt_in')} />

          {feedbackOptIn ? (
            <div className='space-y-5 rounded-3xl border border-[color:var(--brand-surface-edge)] bg-white/88 p-5 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.24)]'>
              <div>
                <p className='mb-3 text-sm font-medium text-[color:var(--brand-text)]'>How would you rate the service?</p>
                <div className='flex flex-wrap gap-2'>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type='button'
                      className={cn(
                        'h-11 w-11 rounded-2xl border text-sm font-semibold transition',
                        feedbackRating === rating
                          ? 'border-[color:var(--brand-primary-edge)] bg-[color:var(--brand-primary-strong)] text-[color:var(--brand-primary-text)] shadow-[0_14px_26px_-22px_rgba(15,23,42,0.3)]'
                          : 'border-[color:var(--brand-secondary-border)] bg-[color:var(--brand-secondary-surface)] text-[color:var(--brand-secondary-text)] hover:bg-[color:var(--brand-secondary-surface-hover)]',
                      )}
                      onClick={() => setValue('feedback_rating', rating, { shouldValidate: true })}
                      disabled={submitting}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                {errors.feedback_rating?.message && <p className='mt-2 text-sm text-red-600'>{errors.feedback_rating.message}</p>}
              </div>

              <div>
                <p className='mb-3 text-sm font-medium text-[color:var(--brand-text)]'>Were you helped successfully? (optional)</p>
                <div className='flex flex-wrap gap-2'>
                  <button
                    type='button'
                    className={cn(
                      'rounded-2xl border px-4 py-2.5 text-sm font-semibold transition',
                      feedbackHelpful === true
                        ? 'border-[color:var(--brand-primary-edge)] bg-[color:var(--brand-primary-strong)] text-[color:var(--brand-primary-text)]'
                        : 'border-[color:var(--brand-secondary-border)] bg-[color:var(--brand-secondary-surface)] text-[color:var(--brand-secondary-text)] hover:bg-[color:var(--brand-secondary-surface-hover)]',
                    )}
                    onClick={() => setValue('feedback_was_helpful', true, { shouldValidate: true })}
                    disabled={submitting}
                  >
                    Yes
                  </button>
                  <button
                    type='button'
                    className={cn(
                      'rounded-2xl border px-4 py-2.5 text-sm font-semibold transition',
                      feedbackHelpful === false
                        ? 'border-[color:var(--brand-primary-edge)] bg-[color:var(--brand-primary-strong)] text-[color:var(--brand-primary-text)]'
                        : 'border-[color:var(--brand-secondary-border)] bg-[color:var(--brand-secondary-surface)] text-[color:var(--brand-secondary-text)] hover:bg-[color:var(--brand-secondary-surface-hover)]',
                    )}
                    onClick={() => setValue('feedback_was_helpful', false, { shouldValidate: true })}
                    disabled={submitting}
                  >
                    No
                  </button>
                  <button
                    type='button'
                    className='rounded-2xl border border-[color:var(--brand-secondary-border)] bg-[color:var(--brand-secondary-surface)] px-4 py-2.5 text-sm font-semibold text-[color:var(--brand-secondary-text)] transition hover:bg-[color:var(--brand-secondary-surface-hover)]'
                    onClick={() => setValue('feedback_was_helpful', null, { shouldValidate: true })}
                    disabled={submitting}
                  >
                    Skip
                  </button>
                </div>
              </div>

              <FormField label='Was your visit successful? (optional)'>
                <Select
                  {...register('feedback_visit_outcome', {
                    setValueAs: (value) => (value === '' ? null : value),
                  })}
                  disabled={submitting}
                >
                  <option value=''>Skip</option>
                  <option value='completed_what_i_came_for'>Completed what I came for</option>
                  <option value='partially_completed'>Partially completed</option>
                  <option value='not_completed'>Not completed</option>
                </Select>
              </FormField>

              <FormField label='Anything you would like to add? (optional)' error={errors.feedback_comment}>
                <Textarea
                  rows={4}
                  {...register('feedback_comment', {
                    setValueAs: (value) => {
                      const trimmed = String(value || '').trim()
                      return trimmed ? trimmed : null
                    },
                  })}
                  disabled={submitting}
                />
                <p className='text-xs text-[color:var(--brand-text-muted)]'>Maximum 500 characters.</p>
              </FormField>
            </div>
          ) : null}
        </form>
      )}
    </Drawer>
  )
}
