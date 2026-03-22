import { Button } from '../Button'
import type { BrandingTheme } from '../../utils/branding'

export function WizardActions({
  theme,
  disableBack,
  disableContinue,
  disableSubmit,
  showSubmit,
  onBack,
  onContinue,
  submitting,
}: {
  theme: BrandingTheme
  disableBack: boolean
  disableContinue: boolean
  disableSubmit: boolean
  showSubmit: boolean
  onBack: () => void
  onContinue: () => void
  submitting: boolean
}) {
  return (
    <div
      className='fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 px-4 py-3 shadow-[0_-8px_20px_rgba(15,23,42,0.08)] backdrop-blur'
      style={{ borderColor: `${theme.primary_color}33` }}
    >
      <div className='mx-auto flex w-full max-w-3xl items-center justify-between gap-3'>
        <Button
          type='button'
          variant='secondary'
          onClick={onBack}
          disabled={disableBack}
          style={{ borderColor: `${theme.primary_color}4D`, color: theme.text_color }}
        >
          Back
        </Button>
        {showSubmit ? (
          <Button type='submit' disabled={disableSubmit || submitting} style={{ backgroundColor: theme.primary_color, color: '#FFFFFF' }}>
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        ) : (
          <Button type='button' onClick={onContinue} disabled={disableContinue} style={{ backgroundColor: theme.primary_color, color: '#FFFFFF' }}>
            Continue
          </Button>
        )}
      </div>
    </div>
  )
}
