import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Drawer } from '../Drawer'
import { Button } from '../Button'
import { checkoutFeedbackSchema, type CheckoutFeedbackForm } from '../../schemas/checkinWizardSchema'
import type { VisitorHistoryRow } from '../../types/checkin'

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

  const submitNow = () => {
    void handleSubmit(onSubmit)()
  }

  return (
    <Drawer
      open={open}
      onClose={() => {
        onClose()
        reset()
      }}
      title='Visit feedback'
    >
      {!visit ? null : (
        <form className='space-y-5' onSubmit={handleSubmit(onSubmit)}>
          <div>
            <p className='text-sm text-slate-700'>Visitor: {visit.full_name}</p>
            <p className='text-sm text-slate-500'>Do you have a minute to give feedback?</p>
          </div>

          <div className='grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2'>
            <button
              type='button'
              className={`rounded-lg px-3 py-2 text-sm font-medium ${feedbackOptIn ? 'text-slate-700' : 'bg-slate-900 text-white'}`}
              onClick={() => {
                resetToNoFeedback(setValue)
                submitNow()
              }}
              disabled={submitting}
            >
              No, check out now
            </button>
            <button
              type='button'
              className={`rounded-lg px-3 py-2 text-sm font-medium ${feedbackOptIn ? 'bg-slate-900 text-white' : 'text-slate-700'}`}
              onClick={() => setValue('feedback_opt_in', true, { shouldValidate: true })}
              disabled={submitting}
            >
              Yes
            </button>
          </div>

          <input type='hidden' {...register('feedback_opt_in')} />

          {feedbackOptIn ? (
            <div className='space-y-4 rounded-xl border border-slate-200 p-4'>
              <div>
                <p className='mb-2 text-sm font-medium text-slate-700'>How would you rate the service?</p>
                <div className='flex flex-wrap gap-2'>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type='button'
                      className={`h-10 w-10 rounded-lg border text-sm font-semibold ${
                        feedbackRating === rating ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-700'
                      }`}
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
                <p className='mb-2 text-sm font-medium text-slate-700'>Were you helped successfully? (optional)</p>
                <div className='flex flex-wrap gap-2'>
                  <button
                    type='button'
                    className={`rounded-lg border px-3 py-2 text-sm ${feedbackHelpful === true ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-700'}`}
                    onClick={() => setValue('feedback_was_helpful', true, { shouldValidate: true })}
                    disabled={submitting}
                  >
                    Yes
                  </button>
                  <button
                    type='button'
                    className={`rounded-lg border px-3 py-2 text-sm ${feedbackHelpful === false ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-700'}`}
                    onClick={() => setValue('feedback_was_helpful', false, { shouldValidate: true })}
                    disabled={submitting}
                  >
                    No
                  </button>
                  <button
                    type='button'
                    className='rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700'
                    onClick={() => setValue('feedback_was_helpful', null, { shouldValidate: true })}
                    disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
                />
                <p className='text-xs text-slate-500'>Maximum 500 characters.</p>
                {errors.feedback_comment?.message && <p className='text-sm text-red-600'>{errors.feedback_comment.message}</p>}
              </div>

              <div className='flex flex-wrap justify-end gap-2'>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={() => {
                    resetToNoFeedback(setValue)
                    submitNow()
                  }}
                  disabled={submitting}
                >
                  Skip feedback
                </Button>
                <Button type='submit' disabled={submitting || !isValid}>
                  {submitting ? 'Saving...' : 'Submit feedback and check out'}
                </Button>
              </div>
            </div>
          ) : null}

          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='secondary'
              onClick={() => {
                onClose()
                reset()
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Drawer>
  )
}
