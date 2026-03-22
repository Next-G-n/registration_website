import type { FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form'
import type { CheckInWizardForm } from '../../types/checkin'

function OptionCard({
  active,
  title,
  description,
  children,
}: {
  active: boolean
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <label className={`cursor-pointer rounded-xl border p-4 ${active ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white'}`}>
      {children}
      <p className='font-medium text-slate-900'>{title}</p>
      <p className='text-sm text-slate-500'>{description}</p>
    </label>
  )
}

export function VisitorTypePanel({
  register,
  watch,
  errors,
}: {
  register: UseFormRegister<CheckInWizardForm>
  watch: UseFormWatch<CheckInWizardForm>
  errors: FieldErrors<CheckInWizardForm>
}) {
  const citizenStatus = watch('citizen_status')
  const visitContext = watch('visit_context')

  return (
    <div className='space-y-6'>
      <div className='space-y-3'>
        <h2 className='text-xl font-semibold text-slate-900'>Who are you?</h2>
        <div className='grid gap-3 sm:grid-cols-2'>
          <OptionCard active={citizenStatus === 'citizen'} title='Citizen' description='Use Omang identification for this visit.'>
            <input type='radio' value='citizen' className='sr-only' {...register('citizen_status')} />
          </OptionCard>
          <OptionCard
            active={citizenStatus === 'non_citizen'}
            title='Non-Citizen'
            description='Use passport identification for this visit.'
          >
            <input type='radio' value='non_citizen' className='sr-only' {...register('citizen_status')} />
          </OptionCard>
        </div>
        {errors.citizen_status?.message && <p className='text-sm text-red-600'>{errors.citizen_status.message}</p>}
      </div>

      <div className='space-y-3'>
        <h3 className='text-base font-semibold text-slate-900'>Is this a personal or company visit?</h3>
        <div className='grid gap-3 sm:grid-cols-2'>
          <OptionCard active={visitContext === 'personal'} title='Personal' description='You are visiting in a personal capacity.'>
            <input type='radio' value='personal' className='sr-only' {...register('visit_context')} />
          </OptionCard>
          <OptionCard active={visitContext === 'company'} title='Company' description='You are representing a company.'>
            <input type='radio' value='company' className='sr-only' {...register('visit_context')} />
          </OptionCard>
        </div>
        {errors.visit_context?.message && <p className='text-sm text-red-600'>{errors.visit_context.message}</p>}
      </div>
    </div>
  )
}
