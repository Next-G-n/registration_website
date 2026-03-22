import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import type { CheckInWizardForm } from '../../types/checkin'

export function CompanyDetailsPanel({
  register,
  errors,
}: {
  register: UseFormRegister<CheckInWizardForm>
  errors: FieldErrors<CheckInWizardForm>
}) {
  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold text-slate-900'>Company details.</h2>
      <div>
        <label className='text-sm font-medium text-slate-700'>Company Name</label>
        <input className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2' {...register('company_name')} />
        {errors.company_name?.message && <p className='text-sm text-red-600'>{errors.company_name.message}</p>}
      </div>
      <div>
        <label className='text-sm font-medium text-slate-700'>Company Location</label>
        <input className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2' {...register('company_location')} />
        {errors.company_location?.message && <p className='text-sm text-red-600'>{errors.company_location.message}</p>}
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div>
          <label className='text-sm font-medium text-slate-700'>Company Phone (Optional)</label>
          <input className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2' {...register('company_phone')} />
          {errors.company_phone?.message && <p className='text-sm text-red-600'>{errors.company_phone.message}</p>}
        </div>
        <div>
          <label className='text-sm font-medium text-slate-700'>Company Email (Optional)</label>
          <input type='email' className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2' {...register('company_email')} />
          {errors.company_email?.message && <p className='text-sm text-red-600'>{errors.company_email.message}</p>}
        </div>
      </div>
    </div>
  )
}
