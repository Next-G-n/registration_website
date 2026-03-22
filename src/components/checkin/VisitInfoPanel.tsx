import type { FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form'
import type { CheckInWizardForm, PublicDepartment } from '../../types/checkin'

export function VisitInfoPanel({
  register,
  watch,
  errors,
  departments,
  purposes,
}: {
  register: UseFormRegister<CheckInWizardForm>
  watch: UseFormWatch<CheckInWizardForm>
  errors: FieldErrors<CheckInWizardForm>
  departments: PublicDepartment[]
  purposes: string[]
}) {
  const purpose = watch('purpose')

  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold text-slate-900'>Who are you visiting today?</h2>

      <div>
        <label className='text-sm font-medium text-slate-700'>Which department are you visiting?</label>
        <select className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2' {...register('department_id', { setValueAs: (v) => Number(v) })}>
          <option value=''>Select department</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
        {errors.department_id?.message && <p className='text-sm text-red-600'>{errors.department_id.message}</p>}
      </div>

      <div>
        <label className='text-sm font-medium text-slate-700'>What is the purpose of your visit?</label>
        <select className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2' {...register('purpose')}>
          <option value=''>Select purpose</option>
          {purposes.map((purposeValue) => (
            <option key={purposeValue} value={purposeValue}>
              {purposeValue}
            </option>
          ))}
          {!purposes.includes('Other') && <option value='Other'>Other</option>}
        </select>
        {errors.purpose?.message && <p className='text-sm text-red-600'>{errors.purpose.message}</p>}
      </div>

      {purpose === 'Other' && (
        <div>
          <label className='text-sm font-medium text-slate-700'>Please specify</label>
          <input className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2' {...register('purpose_other')} />
          {errors.purpose_other?.message && <p className='text-sm text-red-600'>{errors.purpose_other.message}</p>}
        </div>
      )}
    </div>
  )
}
