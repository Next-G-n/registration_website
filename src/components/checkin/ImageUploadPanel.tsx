import { useState } from 'react'
import type { FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { ImageFileField } from '../ImageFileField'
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold text-slate-900'>Please upload one image.</h2>
      <p className='text-sm text-slate-500'>You can capture with camera or upload from device. Max size 2MB.</p>

      <ImageFileField
        label='Visitor photo'
        hint='Use your camera or choose an image from this device.'
        file={selectedFile}
        previewUrl={photo || null}
        error={typeof errors.visitor_photo?.message === 'string' ? errors.visitor_photo.message : null}
        capture='environment'
        onChange={async (file) => {
          setSelectedFile(file)
          if (!file) {
            setInlineError(null)
            setValue('visitor_photo', '', { shouldValidate: true })
            return
          }
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
        onClear={() => {
          setSelectedFile(null)
          setInlineError(null)
          setValue('visitor_photo', '', { shouldValidate: true, shouldDirty: true })
        }}
      />
    </div>
  )
}
