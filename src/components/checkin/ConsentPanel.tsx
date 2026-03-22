import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import type { CheckInWizardForm } from '../../types/checkin'

export function ConsentPanel({
  register,
  errors,
}: {
  register: UseFormRegister<CheckInWizardForm>
  errors: FieldErrors<CheckInWizardForm>
}) {
  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold text-slate-900'>Almost done.</h2>
      <p className='text-sm text-slate-600'>
        By submitting this form, you acknowledge that your details will be used for visitor registration and security.
      </p>
      <label className='flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4'>
        <input type='checkbox' className='mt-1 h-4 w-4' {...register('data_protection_consent')} />
        <span className='text-sm text-slate-700'>I agree to the privacy acknowledgement and consent to data processing.</span>
      </label>
      {errors.data_protection_consent?.message && <p className='text-sm text-red-600'>{errors.data_protection_consent.message}</p>}
    </div>
  )
}
