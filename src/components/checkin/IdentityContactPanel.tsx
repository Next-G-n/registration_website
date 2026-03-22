import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import type { CheckInWizardForm } from '../../types/checkin'

export function IdentityContactPanel({
  register,
  errors,
  citizenStatus,
  countries,
}: {
  register: UseFormRegister<CheckInWizardForm>
  errors: FieldErrors<CheckInWizardForm>
  citizenStatus: CheckInWizardForm['citizen_status']
  countries: string[]
}) {
  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold text-slate-900'>Identification and contact details.</h2>
      <p className='text-sm text-slate-600'>
        Enter your ID number and continue. If we find your profile, your personal details will be filled automatically.
      </p>

      <div className='space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4'>
        <p className='text-sm font-semibold text-slate-900'>Identification</p>
        {citizenStatus === 'citizen' ? (
          <div>
            <label className='text-sm font-medium text-slate-700'>Omang / ID Number</label>
            <input className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2' {...register('omang_number')} />
            {errors.omang_number?.message && <p className='text-sm text-red-600'>{errors.omang_number.message}</p>}
          </div>
        ) : (
          <div className='grid gap-4 sm:grid-cols-2'>
            <div>
              <label className='text-sm font-medium text-slate-700'>Passport Number</label>
              <input className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2' {...register('passport_number')} />
              {errors.passport_number?.message && <p className='text-sm text-red-600'>{errors.passport_number.message}</p>}
            </div>
            <div>
              <label className='text-sm font-medium text-slate-700'>Passport Country</label>
              <select className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2' {...register('passport_country')}>
                <option value=''>Select country</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              {errors.passport_country?.message && <p className='text-sm text-red-600'>{errors.passport_country.message}</p>}
            </div>
          </div>
        )}
      </div>

      <div className='space-y-3 rounded-xl border border-slate-200 p-4'>
        <p className='text-sm font-semibold text-slate-900'>Contact details</p>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div>
            <label className='text-sm font-medium text-slate-700'>Phone Number</label>
            <input className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2' {...register('mobile_phone')} />
            {errors.mobile_phone?.message && <p className='text-sm text-red-600'>{errors.mobile_phone.message}</p>}
          </div>
          <div>
            <label className='text-sm font-medium text-slate-700'>Email (Optional)</label>
            <input type='email' className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2' {...register('email')} />
            {errors.email?.message && <p className='text-sm text-red-600'>{errors.email.message}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
