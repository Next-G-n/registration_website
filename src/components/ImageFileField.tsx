import { useEffect, useId, useState } from 'react'
import { Button } from './Button'
import { cn } from '../utils/cn'

function formatFileSize(bytes?: number) {
  if (!bytes) return null
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ImageFileField({
  label,
  hint,
  file,
  previewUrl,
  error,
  accept = 'image/*',
  capture,
  onChange,
  onClear,
  className,
}: {
  label: string
  hint?: string
  file?: File | null
  previewUrl?: string | null
  error?: string | null
  accept?: string
  capture?: 'environment' | 'user'
  onChange: (file: File | null) => void
  onClear?: () => void
  className?: string
}) {
  const inputId = useId()
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setObjectUrl(null)
      return
    }

    const nextUrl = URL.createObjectURL(file)
    setObjectUrl(nextUrl)
    return () => URL.revokeObjectURL(nextUrl)
  }, [file])

  const resolvedPreview = previewUrl || objectUrl
  const fileLabel = file?.name || (previewUrl ? 'Current image' : 'No image selected')
  const fileMeta = file ? formatFileSize(file.size) : null

  return (
    <div className={cn('space-y-3', className)}>
      <div className='space-y-1'>
        <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-text-muted)]'>{label}</p>
        {hint ? <p className='text-sm text-[color:var(--brand-text-soft)]'>{hint}</p> : null}
      </div>

      <div className='rounded-3xl border border-[color:var(--brand-field-border)] bg-[color:var(--brand-field-bg)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_16px_34px_-28px_rgba(15,23,42,0.18)]'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex min-w-0 items-center gap-4'>
            <div className='flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[color:var(--brand-secondary-border)] bg-[color:var(--brand-secondary-surface)]'>
              {resolvedPreview ? (
                <img src={resolvedPreview} alt={label} className='h-full w-full object-cover' />
              ) : (
                <svg width='28' height='28' viewBox='0 0 24 24' fill='none' className='text-[color:var(--brand-secondary-text)]'>
                  <path d='M19 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3l1.2-1.4A2 2 0 0 1 10.7 3h2.6a2 2 0 0 1 1.5.6L16 5h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2Z' stroke='currentColor' strokeWidth='1.7' />
                  <circle cx='12' cy='12' r='3.5' stroke='currentColor' strokeWidth='1.7' />
                </svg>
              )}
            </div>

            <div className='min-w-0'>
              <p className='truncate text-sm font-medium text-[color:var(--brand-text)]'>{fileLabel}</p>
              <p className='mt-1 text-xs text-[color:var(--brand-text-muted)]'>
                {fileMeta ? `${fileMeta} selected` : resolvedPreview ? 'Preview ready' : 'PNG, JPG, or camera capture'}
              </p>
            </div>
          </div>

          <div className='flex flex-wrap gap-2'>
            <input
              id={inputId}
              type='file'
              accept={accept}
              capture={capture}
              className='sr-only'
              onChange={(event) => onChange(event.target.files?.[0] || null)}
            />
            <label
              htmlFor={inputId}
              className='inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-2xl border border-[color:var(--brand-secondary-border)] bg-[color:var(--brand-secondary-surface)] px-4 py-2.5 text-sm font-semibold text-[color:var(--brand-secondary-text)] shadow-[0_14px_24px_-20px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-[color:var(--brand-secondary-surface-hover)]'
            >
              {resolvedPreview ? 'Replace image' : 'Choose image'}
            </label>
            {(resolvedPreview || file) && onClear ? (
              <Button type='button' variant='ghost' onClick={onClear}>
                Remove
              </Button>
            ) : null}
          </div>
        </div>

        {error ? <p className='mt-3 text-sm text-red-600'>{error}</p> : null}
      </div>
    </div>
  )
}
