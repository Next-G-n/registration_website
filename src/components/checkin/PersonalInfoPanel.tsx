import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import type { CheckInWizardForm, CitizenStatus } from '../../types/checkin'

export function PersonalInfoPanel({
  register,
  errors,
  countries,
  citizenStatus,
}: {
  register: UseFormRegister<CheckInWizardForm>
  errors: FieldErrors<CheckInWizardForm>
  countries: string[]
  citizenStatus: CitizenStatus
}) {
  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold text-slate-900'>Tell us about yourself.</h2>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div>
          <label className='text-sm font-medium text-slate-700'>First Name</label>
          <input className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2' {...register('first_name')} />
          {errors.first_name?.message && <p className='text-sm text-red-600'>{errors.first_name.message}</p>}
        </div>
        <div>
          <label className='text-sm font-medium text-slate-700'>Last Name</label>
          <input className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2' {...register('last_name')} />
          {errors.last_name?.message && <p className='text-sm text-red-600'>{errors.last_name.message}</p>}
        </div>
        <div>
          <label className='text-sm font-medium text-slate-700'>Date of Birth</label>
          <input type='date' className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2' {...register('date_of_birth')} />
          {errors.date_of_birth?.message && <p className='text-sm text-red-600'>{errors.date_of_birth.message}</p>}
        </div>
        <div>
          <label className='text-sm font-medium text-slate-700'>Gender</label>
          <select className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2' {...register('gender')}>
            <option value='male'>Male</option>
            <option value='female'>Female</option>
            <option value='other'>Other</option>
          </select>
          {errors.gender?.message && <p className='text-sm text-red-600'>{errors.gender.message}</p>}
        </div>
        <div className='sm:col-span-2'>
          <label className='text-sm font-medium text-slate-700'>Nationality</label>
          <select className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2' {...register('nationality')}>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          <p className='mt-1 text-xs text-slate-500'>
            {citizenStatus === 'citizen' ? 'Citizen default is Botswana.' : 'Please choose your nationality.'}
          </p>
          {errors.nationality?.message && <p className='text-sm text-red-600'>{errors.nationality.message}</p>}
        </div>
      </div>
    </div>
  )
}
