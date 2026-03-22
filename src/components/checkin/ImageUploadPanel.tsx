import type { FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import type { CheckInWizardForm } from '../../types/checkin'

const MAX_FILE_SIZE = 2 * 1024 * 1024

async function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read image'))
    reader.readAsDataURL(file)
  })
}

export function ImageUploadPanel({
  watch,
  setValue,
  errors,
  setInlineError,
}: {
  watch: UseFormWatch<CheckInWizardForm>
  setValue: UseFormSetValue<CheckInWizardForm>
  errors: FieldErrors<CheckInWizardForm>
  setInlineError: (message: string | null) => void
}) {
  const photo = watch('visitor_photo')

  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold text-slate-900'>Please upload one image.</h2>
      <p className='text-sm text-slate-500'>You can capture with camera or upload from device. Max size 2MB.</p>
      <input
        type='file'
        accept='image/*'
        capture='environment'
        className='block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file) return
          if (file.size > MAX_FILE_SIZE) {
            setInlineError('Image too large. Please upload an image smaller than 2MB.')
            setValue('visitor_photo', '', { shouldValidate: true })
            return
          }
          try {
            setInlineError(null)
            const base64 = await readFileAsBase64(file)
            setValue('visitor_photo', base64, { shouldDirty: true, shouldValidate: true })
          } catch {
            setInlineError('Unable to read image. Please try another file.')
          }
        }}
      />
      {photo && (
        <div className='space-y-2'>
          <img src={photo} alt='Uploaded preview' className='h-44 w-44 rounded-xl border border-slate-200 object-cover' />
          <p className='text-xs text-slate-500'>Image ready. Upload a new file to replace it.</p>
        </div>
      )}
      {errors.visitor_photo?.message && <p className='text-sm text-red-600'>{errors.visitor_photo.message}</p>}
    </div>
  )
}
