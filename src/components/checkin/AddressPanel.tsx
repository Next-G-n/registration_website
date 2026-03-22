import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import type { CheckInWizardForm } from '../../types/checkin'

export function AddressPanel({
  register,
  errors,
}: {
  register: UseFormRegister<CheckInWizardForm>
  errors: FieldErrors<CheckInWizardForm>
}) {
  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold text-slate-900'>Where do you live?</h2>
      <div>
        <label className='text-sm font-medium text-slate-700'>Apartment Number</label>
        <input className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2' {...register('apartment_number')} />
        {errors.apartment_number?.message && <p className='text-sm text-red-600'>{errors.apartment_number.message}</p>}
      </div>
      <div className='grid gap-4 sm:grid-cols-3'>
        <div>
          <label className='text-sm font-medium text-slate-700'>Street</label>
          <input className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2' {...register('address_street')} />
          {errors.address_street?.message && <p className='text-sm text-red-600'>{errors.address_street.message}</p>}
        </div>
        <div>
          <label className='text-sm font-medium text-slate-700'>City</label>
          <input className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2' {...register('address_city')} />
          {errors.address_city?.message && <p className='text-sm text-red-600'>{errors.address_city.message}</p>}
        </div>
        <div>
          <label className='text-sm font-medium text-slate-700'>Country</label>
          <input className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2' {...register('address_country')} />
          {errors.address_country?.message && <p className='text-sm text-red-600'>{errors.address_country.message}</p>}
        </div>
      </div>
    </div>
  )
}
