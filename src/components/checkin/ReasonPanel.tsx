import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import type { CheckInWizardForm } from '../../types/checkin'

export function ReasonPanel({
  register,
  errors,
}: {
  register: UseFormRegister<CheckInWizardForm>
  errors: FieldErrors<CheckInWizardForm>
}) {
  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold text-slate-900'>Reason for your visit</h2>
      <label className='block text-sm font-medium text-slate-700'>
        Tell us briefly why you are visiting today.
        <textarea
          rows={5}
          className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200'
          {...register('reason_for_visit_text')}
        />
      </label>
      {errors.reason_for_visit_text?.message && <p className='text-sm text-red-600'>{errors.reason_for_visit_text.message}</p>}
    </div>
  )
}
